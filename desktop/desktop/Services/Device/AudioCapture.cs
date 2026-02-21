using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using NAudio.Wave;

public class AudioChunkEventArgs : EventArgs
{
    public byte[] Pcm { get; }
    public int BytesPerSample { get; }
    public int SampleRate { get; }
    public AudioChunkEventArgs(byte[] pcm, int bytesPerSample, int sampleRate)
    {
        Pcm = pcm;
        BytesPerSample = bytesPerSample;
        SampleRate = sampleRate;
    }
}

public class AudioCapture : IDisposable
{
    private WaveInEvent _waveIn;
    private readonly int _deviceIndex;
    private readonly int _sampleRate;
    private readonly int _channels;
    public bool IsRunning { get; private set; }

    public event EventHandler<AudioChunkEventArgs> OnChunk;
    public event EventHandler<double> OnRms; // 0..1

    public AudioCapture(int deviceIndex = -1, int sampleRate = 16000, int channels = 1)
    {
        _deviceIndex = deviceIndex;
        _sampleRate = sampleRate;
        _channels = channels;
    }

    public static System.Collections.Generic.IList<DeviceInfo> GetDeviceList()
    {
        var list = new System.Collections.Generic.List<DeviceInfo>();
        try
        {
            for (int i = 0; i < WaveIn.DeviceCount; i++)
            {
                var caps = WaveIn.GetCapabilities(i);
                list.Add(new DeviceInfo($"audio_{i}", caps.ProductName ?? $"Microphone {i}"));
            }
        }
        catch
        {
            list.Add(new DeviceInfo("audio_default", "Default Microphone"));
        }
        return list;
    }

    public void Start()
    {
        if (IsRunning) return;
        _waveIn = new WaveInEvent();
        if (_deviceIndex >= 0)
            _waveIn.DeviceNumber = _deviceIndex;
        _waveIn.WaveFormat = new WaveFormat(_sampleRate, 16, _channels);
        _waveIn.BufferMilliseconds = 200;
        _waveIn.DataAvailable += WaveIn_DataAvailable;
        _waveIn.StartRecording();
        IsRunning = true;
    }

    private void WaveIn_DataAvailable(object sender, WaveInEventArgs e)
    {
        try
        {
            // compute RMS
            double sum = 0;
            int count = e.BytesRecorded / 2; // 16bit
            for (int i = 0; i < e.BytesRecorded; i += 2)
            {
                short sample = (short)(e.Buffer[i] | (e.Buffer[i + 1] << 8));
                double s = sample / 32768.0;
                sum += s * s;
            }
            double rms = 0.0;
            if (count > 0) rms = Math.Sqrt(sum / count);
            OnRms?.Invoke(this, rms);

            var copy = new byte[e.BytesRecorded];
            Array.Copy(e.Buffer, 0, copy, 0, e.BytesRecorded);
            OnChunk?.Invoke(this, new AudioChunkEventArgs(copy, 2, _sampleRate));
        }
        catch { }
    }

    public void Stop()
    {
        if (!IsRunning) return;
        try
        {
            _waveIn.DataAvailable -= WaveIn_DataAvailable;
            _waveIn.StopRecording();
            _waveIn.Dispose();
        }
        catch { }
        IsRunning = false;
    }

    public void Dispose()
    {
        Stop();
    }
}
