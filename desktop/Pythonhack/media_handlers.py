import cv2
import pyaudio

class CameraHandler:
    """カメラ制御用クラス"""
    def __init__(self, device_id=0):
        self.cap = cv2.VideoCapture(device_id)
        if not self.cap.isOpened():
            raise Exception("カメラが見つかりません")

    def get_frame(self):
        ret, frame = self.cap.read()
        return frame if ret else None

    def release(self):
        self.cap.release()

class AudioHandler:
    """マイク制御用クラス"""
    def __init__(self, rate=44100, chunk=1024):
        self.chunk = chunk
        self.p = pyaudio.PyAudio()
        self.stream = self.p.open(
            format=pyaudio.paInt16, 
            channels=1, 
            rate=rate, 
            input=True, 
            frames_per_buffer=chunk
        )

    def get_audio_chunk(self):
        try:
            return self.stream.read(self.chunk, exception_on_overflow=False)
        except Exception:
            return None

    def close(self):
        self.stream.stop_stream()
        self.stream.close()
        self.p.terminate()