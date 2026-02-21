import cv2
import threading
import time
import base64
from io import BytesIO
from PIL import Image
import numpy as np


class CameraCapture:
    def __init__(self, device_index=0, width=640, height=480):
        self.device_index = device_index
        self.width = width
        self.height = height
        self._capture = None
        self._running = False
        self._lock = threading.Lock()

    def start(self):
        with self._lock:
            if self._running:
                return
            self._capture = cv2.VideoCapture(self.device_index)
            self._capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self._capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            self._running = True

    def read_frame(self):
        with self._lock:
            if not self._running or self._capture is None:
                return None
            ret, frame = self._capture.read()
            if not ret:
                return None
            # convert BGR -> RGB
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            return rgb

    def get_jpeg_bytes(self, frame, quality=80):
        img = Image.fromarray(frame)
        buf = BytesIO()
        img.save(buf, format='JPEG', quality=quality)
        return buf.getvalue()

    def stop(self):
        with self._lock:
            if self._capture is not None:
                try:
                    self._capture.release()
                except Exception:
                    pass
            self._capture = None
            self._running = False
