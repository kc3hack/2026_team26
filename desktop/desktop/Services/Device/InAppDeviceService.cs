using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using OpenCvSharp;

public class VideoFrameEventArgsEx : EventArgs
{
    public byte[] Jpeg { get; }
    public double FaceScore { get; }
    public FaceFatigueResult FaceResult { get; }
    public VideoFrameEventArgsEx(byte[] jpeg, double faceScore, FaceFatigueResult faceResult)
    {
        Jpeg = jpeg;
        FaceScore = faceScore;
        FaceResult = faceResult;
    }
}

public class AudioDataEventArgsEx : EventArgs
{
    public double Score { get; }
    public byte[] Pcm { get; }
    public AudioDataEventArgsEx(double score, byte[] pcm)
    {
        Score = score;
        Pcm = pcm;
    }
}

public class InAppDeviceService : IDeviceService, IDisposable
{
    private readonly ConcurrentDictionary<string, object> _captures = new ConcurrentDictionary<string, object>();
    private readonly FaceFatigueEstimator _estimator;

    public event EventHandler<VideoFrameEventArgsEx> OnVideoFrame;
    public event EventHandler<AudioDataEventArgsEx> OnAudioData;

    public InAppDeviceService()
    {
        _estimator = new FaceFatigueEstimator();
    }

    public Task<IList<DeviceInfo>> GetDevicesAsync()
    {
        var list = new List<DeviceInfo>();
        foreach (var c in CameraCapture.GetDeviceList(6)) list.Add(c);
        foreach (var a in AudioCapture.GetDeviceList()) list.Add(a);
        return Task.FromResult((IList<DeviceInfo>)list);
    }

    public Task StartCaptureAsync(string deviceId, string mode = "video")
    {
        if (string.IsNullOrEmpty(deviceId)) throw new ArgumentNullException(nameof(deviceId));
        if (mode == "video")
        {
            if (_captures.ContainsKey(deviceId)) return Task.CompletedTask;
            if (!int.TryParse(deviceId, out var idx)) throw new ArgumentException("invalid camera id");
            var cap = new CameraCapture(idx);
            cap.OnMatFrame += (mat) =>
            {
                try
                {
                    var faceRes = _estimator.Estimate(mat);
                    var jpeg = CameraCapture.MatToJpeg(mat);
                    OnVideoFrame?.Invoke(this, new VideoFrameEventArgsEx(jpeg, faceRes.Score, faceRes));
                }
                catch { }
            };
            cap.OnJpegFrame += (bytes) =>
            {
                // some consumers may want raw jpeg only
            };
            cap.Start();
            _captures[deviceId] = cap;
            return Task.CompletedTask;
        }
        else
        {
            // audio device (format: audio_{index} or audio_default)
            if (_captures.ContainsKey(deviceId)) return Task.CompletedTask;
            int idx = -1;
            if (deviceId.StartsWith("audio_"))
            {
                var s = deviceId.Substring("audio_".Length);
                int.TryParse(s, out idx);
            }
            var ac = new AudioCapture(idx, 16000, 1);
            ac.OnChunk += (s, ev) =>
            {
                try
                {
                    // quick score: map RMS to 0..1 then invert/mapping as fatigue proxy
                    // Here we compute a naive score: low activity -> higher fatigue
                    // Use rms from OnRms event or compute here
                    // For now compute RMS from chunk bytes
                    double rms = 0.0;
                    try
                    {
                        int samples = ev.Pcm.Length / ev.BytesPerSample;
                        long sum = 0;
                        for (int i = 0; i < ev.Pcm.Length; i += ev.BytesPerSample)
                        {
                            short sample = (short)(ev.Pcm[i] | (ev.Pcm[i+1] << 8));
                            double sVal = sample / 32768.0;
                            sum += (long)(sVal * sVal * 1000000);
                        }
                        if (samples > 0) rms = Math.Sqrt((double)sum / samples) / 1000.0;
                    }
                    catch { }
                    double score = 1.0 - Math.Min(1.0, rms);
                    OnAudioData?.Invoke(this, new AudioDataEventArgsEx(score, ev.Pcm));
                }
                catch { }
            };
            ac.OnRms += (s, rms) =>
            {
                // could propagate RMS as needed
            };
            ac.Start();
            _captures[deviceId] = ac;
            return Task.CompletedTask;
        }
    }

    public Task StopCaptureAsync(string deviceId)
    {
        if (string.IsNullOrEmpty(deviceId)) return Task.CompletedTask;
        if (_captures.TryRemove(deviceId, out var obj))
        {
            try
            {
                if (obj is CameraCapture cc) cc.Stop();
                if (obj is AudioCapture ac) ac.Stop();
            }
            catch { }
        }
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        foreach (var k in _captures.Keys)
        {
            StopCaptureAsync(k).Wait(100);
        }
        _estimator?.Dispose();
    }
}
