import cv2
import mediapipe as mp
import numpy as np
import librosa
import time

class FatigueAnalyzer:
    def __init__(self):
        # MediaPipe初期化
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            refine_landmarks=True, min_detection_confidence=0.5)
        
        # キャリブレーション（基準値）用
        self.is_calibrated = False
        self.baseline = {
            "eye_ratio": 0.0,    # 瞼の開き
            "mouth_ratio": 0.0,  # 口角
            "brow_dist": 0.0,    # 眉の高さ
            "skin_bright": 0.0,  # 顔色（輝度）
            "voice_energy": 0.0  # 声の大きさ/張り
        }
        self.calibration_data = {k: [] for k in self.baseline.keys()}
        self.start_time = time.time()

    def _get_ear(self, landmarks):
        """瞼の開き具合 (Eye Aspect Ratio) の計算"""
        # 左目と右目の上下ランドマークの距離の平均
        left_eye = abs(landmarks[159].y - landmarks[145].y)
        right_eye = abs(landmarks[386].y - landmarks[374].y)
        return (left_eye + right_eye) / 2.0

    def _get_mouth_status(self, landmarks):
        """口角の上がり下がり"""
        # 口角の平均高さと上唇中央の比較
        corners_y = (landmarks[61].y + landmarks[291].y) / 2.0
        upper_lip_y = landmarks[13].y
        return corners_y - upper_lip_y # 数値が大きいほど口角が下がっている

    def _get_brow_height(self, landmarks):
        """眉の高さ（下がると疲労感）"""
        # 眉山と目の距離
        left_brow = abs(landmarks[52].y - landmarks[159].y)
        right_brow = abs(landmarks[282].y - landmarks[386].y)
        return (left_brow + right_brow) / 2.0

    def analyze(self, frame, audio_chunk):
        """総合解析メソッド"""
        # --- 顔解析 ---
        face_score = 100
        current_face = {"eye_ratio": 0, "mouth_ratio": 0, "brow_dist": 0, "skin_bright": 0}
        
        if frame is not None:
            results = self.face_mesh.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            if results.multi_face_landmarks:
                lm = results.multi_face_landmarks[0].landmark
                current_face["eye_ratio"] = self._get_ear(lm)
                current_face["mouth_ratio"] = self._get_mouth_status(lm)
                current_face["brow_dist"] = self._get_brow_height(lm)
                
                # 顔色（輝度）
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                current_face["skin_bright"] = np.mean(gray)

        # --- 音声解析 ---
        voice_energy = 0
        if audio_chunk is not None:
            samples = np.frombuffer(audio_chunk, dtype=np.int16).astype(np.float32)
            voice_energy = np.sqrt(np.mean(samples**2)) if len(samples) > 0 else 0

        # --- キャリブレーション処理 (最初の5秒間) ---
        if not self.is_calibrated:
            elapsed = time.time() - self.start_time
            if elapsed < 5.0:
                for k in current_face: self.calibration_data[k].append(current_face[k])
                self.calibration_data["voice_energy"].append(voice_energy)
                return 100.0 # キャリブレーション中は100を返す
            else:
                # 平均値を基準として保存
                for k in self.baseline:
                    self.baseline[k] = np.mean(self.calibration_data[k])
                self.is_calibrated = True

        # --- スコア算出 (基準値との比較) ---
        # 各要素の「元気な時(1.0)」に対する比率を計算
        f_eye = current_face["eye_ratio"] / (self.baseline["eye_ratio"] + 1e-6)
        f_brow = current_face["brow_dist"] / (self.baseline["brow_dist"] + 1e-6)
        f_skin = current_face["skin_bright"] / (self.baseline["skin_bright"] + 1e-6)
        # 口角と音声は変化の方向が異なるため調整
        f_mouth = 1.0 - (current_face["mouth_ratio"] - self.baseline["mouth_ratio"]) * 10 
        f_voice = voice_energy / (self.baseline["voice_energy"] + 1e-6) if voice_energy > 10 else 1.0

        # 顔スコア (0.5) と 音声スコア (0.5)
        face_comp = (f_eye + f_brow + f_skin + f_mouth) / 4.0
        voice_comp = f_voice
        
        total_ratio = (face_comp * 0.5) + (voice_comp * 0.5)
        
        # 各成分を0-120の数値にする
        face_score = float(np.clip(face_comp * 100, 0, 120))
        voice_score = float(np.clip(voice_comp * 100, 0, 120))
        total_score = float(np.clip(total_ratio * 100, 0, 120))
        
        ret = {
            "face": face_score,
            "voice": voice_score,
            "overall": total_score
        }
        
        print(ret)

        # 3つのスコアを辞書で返す
        return ret
        
      