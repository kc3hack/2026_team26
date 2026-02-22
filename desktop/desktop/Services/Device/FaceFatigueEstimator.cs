using System;
using System.Collections.Generic;
using OpenCvSharp;

public class FaceFatigueResult
{
    public double Score { get; set; }
    public List<FaceInfo> Faces { get; set; } = new List<FaceInfo>();
}

public class FaceInfo
{
    public Rect FaceRect { get; set; }
    public Rect LeftEye { get; set; }
    public Rect RightEye { get; set; }
    public double EyeAspectRatio { get; set; }
}

public class FaceFatigueEstimator : IDisposable
{
    private readonly CascadeClassifier _faceCascade;
    private readonly CascadeClassifier _eyeCascade;

    public double CurrentScore { get; private set; } = 100.0;

    private const double DecreaseRate = 2.0;    // ダメな時の減少スピード
    private const double IncreaseRate = 0.5;    // 回復スピード（減少より遅く設定）

    // 【新設】回復に関する設定
    private int _safeFrameCounter = 0;          // 正常状態の連続カウント
    private const int RecoveryWaitFrames = 90;  // 30fpsの場合、約3秒間の待機
    // -----------------------

    private void UpdateScore(bool isBadCondition)
    {
        if (isBadCondition)
        {
            // 異常（顔なし・目閉じ）があれば、即座に減点
            CurrentScore -= DecreaseRate;

            // 重要：異常があった瞬間に「回復までの待ち時間」をリセット
            _safeFrameCounter = 0;
        }
        else
        {
            // 正常（顔あり・目パッチリ）なら、カウント開始
            _safeFrameCounter++;

            // 指定したフレーム数（例：90フレーム=3秒）連続で正常な時だけ回復
            if (_safeFrameCounter >= RecoveryWaitFrames)
            {
                CurrentScore += IncreaseRate;

                // (オプション) 回復時はカウンタを一定値に止めておき、
                // 次に異常が出たらまた0から数え直しにする
                _safeFrameCounter = RecoveryWaitFrames;
            }
            else
            {
                // 3秒経過するまでは、正常であってもスコアは維持（増加しない）
            }
        }

        // 0?100の間にクランプ
        CurrentScore = Math.Max(0.0, Math.Min(100.0, CurrentScore));
    }

    public FaceFatigueEstimator(string faceCascadePath = null, string eyeCascadePath = null)
    {
        // use default OpenCV Haar cascades if paths not provided
        _faceCascade = new CascadeClassifier(faceCascadePath ?? "haarcascade_frontalface_default.xml");
        _eyeCascade = new CascadeClassifier(eyeCascadePath ?? "haarcascade_eye.xml");
    }

    // Estimate fatigue from a single frame. Returns score [0..1] and details per face.
    public FaceFatigueResult Estimate(Mat frame)
    {
        var result = new FaceFatigueResult();
        if (frame == null || frame.Empty()) return result;

        using var gray = new Mat();
        Cv2.CvtColor(frame, gray, ColorConversionCodes.BGR2GRAY);
        Cv2.EqualizeHist(gray, gray);

        var faces = _faceCascade.DetectMultiScale(gray, 1.05, 6, HaarDetectionTypes.ScaleImage);
        foreach (var f in faces)
        {
            var faceInfo = new FaceInfo { FaceRect = f };
            // restrict eye search to upper part of face
            var eyeRegion = new Rect(f.X, (int)(f.Y + f.Height * 0.2), f.Width, (int)(f.Height * 0.35));
            var roi = new Mat(gray, eyeRegion);
            var eyes = _eyeCascade.DetectMultiScale(roi, 1.1, 4);
            Rect left = new Rect();
            Rect right = new Rect();
            if (eyes.Length >= 1)
            {
                // pick two largest by area if available
                Array.Sort(eyes, (a, b) => (b.Width*b.Height).CompareTo(a.Width*a.Height));
                left = eyes[0];
                if (eyes.Length > 1) right = eyes[1];

                // translate to face coords
                left.X += eyeRegion.X; left.Y += eyeRegion.Y;
                right.X += eyeRegion.X; right.Y += eyeRegion.Y;

                faceInfo.LeftEye = left;
                faceInfo.RightEye = right;

                // approximate EAR using eye bounding boxes: height/width heuristic
                double leftEar = (double)left.Height / Math.Max(1, left.Width);
                double rightEar = right.Width>0 ? (double)right.Height / Math.Max(1, right.Width) : leftEar;
                faceInfo.EyeAspectRatio = (leftEar + rightEar) / 2.0;
            }
            else
            {
                faceInfo.EyeAspectRatio = 0.0;
            }
            result.Faces.Add(faceInfo);
        }

        // compute a simple score: lower EAR -> higher fatigue
        double score = 0.0;
        if (result.Faces.Count > 0)
        {
            double sum = 0.0;
            foreach (var fi in result.Faces) sum += fi.EyeAspectRatio;
            double avgEar = sum / result.Faces.Count;
            // assume typical EAR around 0.2-0.3 when eyes open; map to 0..1
            // clamp and invert: smaller EAR means higher fatigue
            var norm = (avgEar - 0.10) / (0.30 - 0.10); // normalized roughly
            norm = Math.Max(0.0, Math.Min(1.0, norm));
            score = 1.0 - norm; // so 1.0 means high fatigue
        }
        result.Score = score;
        return result;
    }

    public void Dispose()
    {
        _faceCascade?.Dispose();
        _eyeCascade?.Dispose();
    }
}
