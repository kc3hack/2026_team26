using System;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

public class AudioDataEventArgs : EventArgs
{
    public double Score { get; }
    public JsonElement Meta { get; }
    public AudioDataEventArgs(double score, JsonElement meta)
    {
        Score = score;
        Meta = meta;
    }
}

public class AudioStreamClient : IDisposable
{
    private readonly ClientWebSocket _ws = new ClientWebSocket();
    private CancellationTokenSource _cts;
    public event EventHandler<AudioDataEventArgs> OnAudioData;

    public async Task ConnectAsync(Uri uri)
    {
        _cts = new CancellationTokenSource();
        await _ws.ConnectAsync(uri, _cts.Token);
        _ = Task.Run(ReceiveLoop);
    }

    private async Task ReceiveLoop()
    {
        var buffer = new ArraySegment<byte>(new byte[64 * 1024]);
        while (!_cts.IsCancellationRequested && _ws.State == WebSocketState.Open)
        {
            using var ms = new MemoryStream();
            WebSocketReceiveResult res;
            do
            {
                res = await _ws.ReceiveAsync(buffer, _cts.Token);
                if (res.MessageType == WebSocketMessageType.Close) return;
                ms.Write(buffer.Array!, buffer.Offset, res.Count);
            } while (!res.EndOfMessage);

            ms.Seek(0, SeekOrigin.Begin);
            var text = Encoding.UTF8.GetString(ms.ToArray());
            try
            {
                using var doc = JsonDocument.Parse(text);
                var root = doc.RootElement;
                double score = 0.0;
                if (root.TryGetProperty("score", out var p)) score = p.GetDouble();
                var meta = root.TryGetProperty("meta", out var m) ? m : default;
                OnAudioData?.Invoke(this, new AudioDataEventArgs(score, meta));
            }
            catch { }
        }
    }

    public async Task DisconnectAsync()
    {
        _cts?.Cancel();
        try { await _ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "", CancellationToken.None); } catch { }
    }

    public void Dispose()
    {
        _cts?.Cancel();
        _ws?.Dispose();
    }
}
