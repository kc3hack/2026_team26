using NAudio.Wave;
//マイク入力テスト用
using System;
using System.Linq;

public class AudioDevice : IDisposable
{
    private WaveInEvent waveIn;
    //本実装用public byte[] LatestBuffer { get; private set; }
    //マイク入力テスト用
    public float CurrentVolume { get; private set; }

    public AudioDevice()
    {
        waveIn = new WaveInEvent();
        //マイク入力テスト用
        waveIn.WaveFormat = new WaveFormat(44100, 1); // 44.1kHz, モノラル
        waveIn.DataAvailable += (s, e) => {
            // 取得した音声データをプロパティに保持（またはイベント発行）
            //    LatestBuffer = e.Buffer;

            //マイク入力テスト用
            short[] samples = new short[e.BytesRecorded / 2];
            Buffer.BlockCopy(e.Buffer, 0, samples, 0, e.BytesRecorded);

            // サンプルの中から最大値を探して、音量(0.0~1.0)に正規化
            if (samples.Length > 0)
            {
                float max = samples.Max(x => Math.Abs(x)) / 32768f;
                CurrentVolume = max;
            }
        };
        waveIn.StartRecording();
    }

    public void Dispose()
    {
        waveIn?.StopRecording();
        waveIn?.Dispose();
    }
}