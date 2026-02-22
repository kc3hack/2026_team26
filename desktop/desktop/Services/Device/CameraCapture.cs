using System;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using OpenCvSharp;
using System.IO;

public class CameraCapture : IDisposable
{
    private VideoCapture _cap;
    private Mat _frame;
    private CancellationTokenSource _cts;
    private Task _loopTask;
    private readonly object _lock = new object();

    public int DeviceIndex { get; }
    public bool IsRunning { get; private set; }

    public event Action<byte[]> OnJpegFrame; // JPEG bytes
    public event Action<Mat> OnMatFrame; // raw mat for internal processing

    public CameraCapture(int deviceIndex = 0)
    {
        DeviceIndex = deviceIndex;
        _frame = new Mat();
    }

    public static IList<DeviceInfo> GetDeviceList(int maxDevices = 4)
    {
        var list = new List<DeviceInfo>();
        for (int i = 0; i < maxDevices; i++)
        {
            try
            {
                using var cap = new VideoCapture(i);
                if (cap.IsOpened())
                {
                    list.Add(new DeviceInfo(i.ToString(), $"Camera {i}"));
                }
            }
            catch { }
        }
        return list;
    }

    public void Start()
    {
        if (IsRunning) return;
        _cap = new VideoCapture(DeviceIndex);
        if (!_cap.IsOpened()) throw new InvalidOperationException("Camera cannot be opened");
        _cap.FrameWidth = 640;
        _cap.FrameHeight = 480;
        _cts = new CancellationTokenSource();
        _loopTask = Task.Run(() => CaptureLoop(_cts.Token));
        IsRunning = true;
    }

    private void CaptureLoop(CancellationToken ct)
    {
        var buf = new Mat();
        while (!ct.IsCancellationRequested)
        {
            try
            {
                if (!_cap.Read(buf) || buf.Empty())
                {
                    Thread.Sleep(10);
                    continue;
                }

                // clone for safe usage
                var mat = buf.Clone();

                // fire raw frame
                OnMatFrame?.Invoke(mat);

                // encode to JPEG for consumers
                byte[] imgBytes;
                try
                {
                    imgBytes = Cv2.ImEncode(".jpg", mat, new ImageEncodingParam(ImwriteFlags.JpegQuality, 75));
                }
                catch
                {
                    imgBytes = mat.ToBytes();
                }
                OnJpegFrame?.Invoke(imgBytes);
            }
            catch (Exception)
            {
                Thread.Sleep(30);
            }
        }
    }

    // helper to get latest jpeg from a Mat (static utility)
    public static byte[] MatToJpeg(Mat mat, int quality = 75)
    {
        return mat.ImEncode(".jpg", new ImageEncodingParam(ImwriteFlags.JpegQuality, quality));
    }

    public byte[] GetJpegBytes(Mat mat, int quality = 75)
    {
        return MatToJpeg(mat, quality);
    }

    public Mat ReadFrame()
    {
        lock (_lock)
        {
            if (_cap != null && _cap.Read(_frame))
            {
                return _frame.Clone();
            }
            return null;
        }
    }

    public void Stop()
    {
        if (!IsRunning) return;
        _cts.Cancel();
        try { _loopTask?.Wait(500); } catch { }
        _cap?.Release();
        _cap?.Dispose();
        _cap = null;
        IsRunning = false;
    }

    public void Dispose()
    {
        Stop();
        _frame?.Dispose();
    }
}
