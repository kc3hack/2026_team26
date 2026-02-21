import cv2
import numpy as np

# Simple face detection + heuristic fatigue estimator
_face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def detect_faces_gray(frame_gray):
    faces = _face_cascade.detectMultiScale(frame_gray, scaleFactor=1.1, minNeighbors=5)
    return faces

def estimate_fatigue_from_face(rgb_frame):
    # rgb_frame: numpy array RGB
    gray = cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2GRAY)
    faces = detect_faces_gray(gray)
    if len(faces) == 0:
        return 0.0, []

    results = []
    for (x, y, w, h) in faces:
        face = gray[y:y+h, x:x+w]
        # heuristic: smaller eyes/occluded faces -> higher fatigue mock
        mean_intensity = float(np.mean(face))
        # normalize mean intensity 0-255 -> invert to 0-100 rough score
        score = max(0.0, min(100.0, (255.0 - mean_intensity) / 255.0 * 100.0))
        results.append({"bbox": [int(x), int(y), int(w), int(h)], "score": float(round(score, 2))})

    # return average score and list
    avg = float(round(sum(r['score'] for r in results) / len(results), 2))
    return avg, results
