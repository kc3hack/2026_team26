# coding: utf-8
import cv2
import mediapipe as mp
import socket
import json
import base64
import numpy as np
import time
import pyaudio

class FatigueAnalyzer:
    def __init__(self):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.dest = ("127.0.0.1", 5005)
        
        # 解析ツール初期化
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(refine_landmarks=True)
        self.pa = pyaudio.PyAudio()
        self.stream = self.pa.open(format=pyaudio.paInt16, channels=1, rate=44100, input=True, frames_per_buffer=1024)
        
        self.score = 100.0
        self.last_send_time = time.time()

    def run(self):
        cap = cv2.VideoCapture(0)
        # 安定送信のため解像度を制限
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 180)

        print("Python 解析エンジン起動中...")

        while cap.isOpened():
            success, frame = cap.read()
            if not success: break

            # 1. 視覚解析 (顔)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb)
            
            penalty = 0
            if results.multi_face_landmarks:
                marks = results.multi_face_landmarks[0].landmark
                # あくび判定 (口の開き)
                if (marks[14].y - marks[13].y) > 0.05: penalty += 1.5
                # 姿勢判定 (中心からのズレ)
                if abs(marks[1].x - 0.5) > 0.15: penalty += 0.5
            else:
                penalty += 0.8 # 顔が見えない

            # 2. 音声解析 (マイク)
            try:
                audio_data = np.frombuffer(self.stream.read(1024, exception_on_overflow=False), dtype=np.int16)
                vol = np.linalg.norm(audio_data) / 1000
                if vol < 0.5: penalty += 0.2 # 声が出ていない/元気がない
            except: pass

            # スコア更新 (0〜120)
            self.score = max(0.0, min(120.0, self.score - penalty + 0.1))

            # 0.1秒ごとに送信
            if time.time() - self.last_send_time > 0.1:
                _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 30])
                img_b64 = base64.b64encode(buf).decode('utf-8')

                data = {"score": float(self.score), "image_data": img_b64}
                
                try:
                    self.sock.sendto(json.dumps(data).encode(), self.dest)
                    # ★printはここ（送信成功時）に移動
                    print(f"送信中... スコア: {self.score:.1f}") 
                except Exception as e:
                    print(f"送信エラー: {e}")
                    
                self.last_send_time = time.time()

            if cv2.waitKey(1) & 0xFF == ord('q'): break

        cap.release()
        self.stream.stop_stream()
        self.pa.terminate()

if __name__ == "__main__":
    analyzer = FatigueAnalyzer()
    analyzer.run()