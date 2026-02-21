import asyncio
import cv2
import base64
import uvicorn
import numpy as np
from fastapi import FastAPI, WebSocket
from media_handlers import CameraHandler, AudioHandler
from analysis_engine import FatigueAnalyzer

app = FastAPI()
analyzer = FatigueAnalyzer()

@app.websocket("/ws/video")
async def video_endpoint(websocket: WebSocket):
    await websocket.accept()
    # 既存のCameraHandlerを利用
    cam = CameraHandler()
    print("Video Client Connected")
    
    try:
        while True:
            frame = cam.get_frame()
            if frame is not None:
                # 1. 解析を実行 (顔解析をメインに行う)
                # 音声は別スレッド/エンドポイントで処理されるため、ここではNone
                scores = analyzer.analyze(frame, None)
                
                # 2. 画像をBase64に変換
                _, buffer = cv2.imencode('.jpg', frame)
                img_str = base64.b64encode(buffer).decode('utf-8')
                
                # 3. C#へ3つのスコアと画像を送る

                scores = analyzer.analyze(frame, None)
                await websocket.send_json({
                    "Image": img_str,
                    "FaceScore": scores["face"]  # C#の ev.FaceScore に入る
                })
            
            # CPU負荷を抑えるための待機
            await asyncio.sleep(0.03) 
            
    except Exception as e:
        print(f"Video WebSocket Error: {e}")
    finally:
        cam.release()
            
@app.websocket("/ws/audio")
async def audio_endpoint(websocket: WebSocket):
    await websocket.accept()
    # 既存のAudioHandlerを利用
    mic = AudioHandler()
    print("Audio Client Connected")
    
    try:
        while True:
            audio_data = mic.get_audio_chunk()
            if audio_data:
                # 1. 音声のみの解析を実行
                scores = analyzer.analyze(None, audio_data)
                
                # 2. C#へ音声スコアと総合スコアを送る
                await websocket.send_json({
                    "Score": scores["voice"]     # C#の ev.Score に入る
                })
            
            await asyncio.sleep(0.01)
            
    except Exception as e:
        print(f"Audio WebSocket Error: {e}")
    finally:
        mic.close()

if __name__ == "__main__":
    # FastAPIサーバーを起動 (C#側が ws://127.0.0.1:8000 を見に行っているため)
    uvicorn.run(app, host="127.0.0.1", port=8000)