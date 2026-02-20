using OpenCvSharp;
using OpenCvSharp.WpfExtensions; // これを使うために OpenCvSharp4.WpfExtensions をNuGetで追加
using System.Windows.Media.Imaging;

public class CameraDevice : IDisposable
{
    private VideoCapture capture;

    public CameraDevice(int index = 0)
    {
        capture = new VideoCapture(index);
    }

    // BitmapSource型で返すように変更
    public BitmapSource GetFrameSource()
    {
        using (Mat frame = new Mat())
        {
            capture.Read(frame);
            if (frame.Empty()) return null;
            // OpenCVのMatをWPF用の画像型に変換
            return frame.ToBitmapSource();
        }
    }

    public void Dispose() => capture?.Dispose();
}