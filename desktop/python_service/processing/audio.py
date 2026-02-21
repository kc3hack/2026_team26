import sounddevice as sd
import numpy as np
import threading
import queue
import time


class AudioCapture:
    def __init__(self, device=None, samplerate=16000, channels=1, block_ms=200):
        self.device = device
        self.samplerate = samplerate
        self.channels = channels
        self.block_ms = block_ms
        self._q = queue.Queue()
        self._stream = None

    def _callback(self, indata, frames, time_info, status):
        if status:
            pass
        # convert to int16 pcm
        arr = (indata * 32767).astype(np.int16)
        self._q.put(arr.tobytes())

    def start(self):
        if self._stream is not None:
            return
        self._stream = sd.InputStream(samplerate=self.samplerate,
                                       device=self.device,
                                       channels=self.channels,
                                       dtype='float32',
                                       callback=self._callback,
                                       blocksize=int(self.samplerate * (self.block_ms / 1000.0)))
        self._stream.start()

    def read_chunk(self, timeout=1.0):
        # Aggregate blocks to ~block_ms
        try:
            data = self._q.get(timeout=timeout)
            return data
        except queue.Empty:
            return None

    def stop(self):
        if self._stream is not None:
            try:
                self._stream.stop()
                self._stream.close()
            except Exception:
                pass
        self._stream = None


def estimate_fatigue_from_audio(pcm_bytes, samplerate=16000):
    # pcm_bytes: int16 little-endian
    try:
        arr = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
        # simple energy and zero-crossing based heuristic
        energy = float(np.mean(arr * arr))
        zc = float(((arr[:-1] * arr[1:]) < 0).sum()) / max(1, len(arr))
        # map energy and zc to 0-100 fatigue (lower energy, lower zc -> higher fatigue)
        score = (1.0 - min(1.0, energy * 50.0)) * 50.0 + (1.0 - min(1.0, zc * 5.0)) * 50.0
        score = max(0.0, min(100.0, score))
        return float(round(score, 2)), {"energy": energy, "zc_rate": zc}
    except Exception:
        return 0.0, {}
