from fastapi import FastAPI, WebSocket, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import threading
import asyncio
import base64
import time
import json
import numpy as np

from processing.camera import CameraCapture
from processing.face_fatigue import estimate_fatigue_from_face
from processing.audio import AudioCapture, estimate_fatigue_from_audio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple device enumeration (camera indices)
def list_video_devices(max_devices=4):
    devices = []
    for i in range(max_devices):
        cap = CameraCapture(i)
        try:
            cap.start()
            frame = cap.read_frame()
            if frame is not None:
                devices.append({"id": str(i), "name": f"Camera {i}"})
        except Exception:
            pass
        finally:
            cap.stop()
    return devices


def list_audio_devices(max_devices=16):
    devices = []
    try:
        import sounddevice as sd
        all_devs = sd.query_devices()
        for i, d in enumerate(all_devs[:max_devices]):
            name = d.get('name') if isinstance(d, dict) else str(d)
            devices.append({"id": f"audio_{i}", "name": f"Microphone {i}: {name}", "index": i})
    except Exception:
        # fallback: single default
        devices.append({"id": "audio_0", "name": "Microphone 0", "index": 0})
    return devices

# Global camera capture registry
_captures = {}
_video_clients = set()
_audio_clients = set()
_audio_lock = threading.Lock()
_capture_lock = threading.Lock()

@app.get("/api/devices")
async def get_devices():
    devices = list_video_devices()
    # include audio devices
    audio_devs = list_audio_devices()
    devices.extend(audio_devs)
    return JSONResponse(content=devices)

@app.post("/api/start_capture")
async def start_capture(body: dict):
    device_id = body.get("device_id")
    mode = body.get("mode", "video")
    if device_id is None:
        raise HTTPException(status_code=400, detail="device_id required")

    if mode == "video":
        idx = int(device_id)
        with _capture_lock:
            if device_id in _captures:
                return JSONResponse(content={"status": "already"})
            cap = CameraCapture(idx)
            cap.start()
            _captures[device_id] = cap
        return JSONResponse(content={"status": "started"})
    else:
        # start audio capture; device_id expected like 'audio_{index}'
        try:
            idx = None
            if isinstance(device_id, str) and device_id.startswith('audio_'):
                try:
                    idx = int(device_id.split('_', 1)[1])
                except Exception:
                    idx = None
            with _capture_lock:
                if device_id in _captures:
                    return JSONResponse(content={"status": "already"})
                ac = AudioCapture(device=idx, samplerate=16000, channels=1, block_ms=200)
                try:
                    ac.start()
                except Exception:
                    return JSONResponse(content={"status": "audio_start_failed"})
                _captures[device_id] = ac
            return JSONResponse(content={"status": "started_audio"})
        except Exception:
            return JSONResponse(content={"status": "audio_start_failed"})

@app.post("/api/stop_capture")
async def stop_capture(body: dict):
    device_id = body.get("device_id")
    if device_id is None:
        raise HTTPException(status_code=400, detail="device_id required")
    with _capture_lock:
        cap = _captures.pop(device_id, None)
    if cap:
        cap.stop()
    return JSONResponse(content={"status": "stopped"})



@app.post("/api/image")
async def post_image(image: UploadFile = File(...)):
    data = await image.read()
    try:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(data)).convert('RGB')
        arr = np.array(img)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid image")

    score, faces = estimate_fatigue_from_face(arr)
    return {"score": score, "faces": faces}

@app.websocket("/ws/video")
async def ws_video(websocket: WebSocket):
    await websocket.accept()
    _video_clients.add(websocket)
    try:
        # keep the connection alive; client may send commands if needed
        while True:
            # receive ping from client or wait
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=0.5)
                # ignore or handle commands
            except asyncio.TimeoutError:
                pass
            # broadcast latest frame from the first active capture (if any)
            frame_bytes = None
            with _capture_lock:
                for cap in _captures.values():
                    f = cap.read_frame()
                    if f is not None:
                        frame_bytes = cap.get_jpeg_bytes(f)
                        break
            if frame_bytes is None:
                await asyncio.sleep(0.05)
                continue

            b64 = base64.b64encode(frame_bytes).decode('ascii')
            payload = json.dumps({"image_b64": b64})
            try:
                await websocket.send_text(payload)
            except Exception:
                break
            await asyncio.sleep(0.03)
    finally:
        _video_clients.discard(websocket)
        try:
            await websocket.close()
        except Exception:
            pass


@app.websocket("/ws/audio")
async def ws_audio(websocket: WebSocket):
    await websocket.accept()
    _audio_clients.add(websocket)
    try:
        while True:
            # read a chunk from any audio capture
            chunk = None
            device_key = None
            with _capture_lock:
                for k, v in _captures.items():
                    if k.startswith('audio'):
                        try:
                            chunk = v.read_chunk(timeout=0.5)
                            device_key = k
                        except Exception:
                            chunk = None
                        if chunk:
                            break
            if not chunk:
                await asyncio.sleep(0.05)
                continue

            # estimate fatigue for this audio chunk
            score, meta = estimate_fatigue_from_audio(chunk, samplerate=16000)
            payload = json.dumps({"device_id": device_key, "score": score, "meta": meta, "pcm_b64": base64.b64encode(chunk).decode('ascii')})
            try:
                await websocket.send_text(payload)
            except Exception:
                break
            await asyncio.sleep(0.02)
    finally:
        _audio_clients.discard(websocket)
        try:
            await websocket.close()
        except Exception:
            pass
