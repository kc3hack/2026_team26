using NAudio.Wave;

public class AudioDevice : IDisposable
{
    private WaveInEvent waveIn;
    public byte[] LatestBuffer { get; private set; }

    public AudioDevice()
    {
        waveIn = new WaveInEvent();
        waveIn.DataAvailable += (s, e) => {
            // 取得した音声データをプロパティに保持（またはイベント発行）
            LatestBuffer = e.Buffer;
        };
        waveIn.StartRecording();
    }

    public void Dispose()
    {
        waveIn?.StopRecording();
        waveIn?.Dispose();
    }
}