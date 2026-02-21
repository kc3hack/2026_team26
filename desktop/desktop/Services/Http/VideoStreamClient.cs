using System;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Media.Imaging;

public class VideoFrameEventArgs : EventArgs
{
    public BitmapImage Image { get; }
    public double FaceScore { get; }
    public string FacesJson { get; }
    public VideoFrameEventArgs(BitmapImage img, double faceScore = 0.0, string facesJson = "")
    {
        Image = img;
        FaceScore = faceScore;
        FacesJson = facesJson;
    }
}

public class VideoStreamClient : IDisposable
{
    private readonly ClientWebSocket _ws = new ClientWebSocket();
    private CancellationTokenSource _cts;
    public event EventHandler<VideoFrameEventArgs> OnFrame;

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
                    string facesJson = "";
                    double faceScore = 0.0;
                    if (root.TryGetProperty("face_score", out var fs)) faceScore = fs.GetDouble();
                    if (root.TryGetProperty("faces", out var farr)) facesJson = farr.GetRawText();
                    if (root.TryGetProperty("image_b64", out var prop))
                    {
                        var b64 = prop.GetString();
                        if (!string.IsNullOrEmpty(b64))
                        {
                            var bytes = Convert.FromBase64String(b64);
                            var img = BytesToBitmapImage(bytes);
                            OnFrame?.Invoke(this, new VideoFrameEventArgs(img, faceScore, facesJson));
                        }
                    }
                }
                catch { }
        }
    }

    private BitmapImage BytesToBitmapImage(byte[] bytes)
    {
        var img = new BitmapImage();
        using var ms = new MemoryStream(bytes);
        img.BeginInit();
        img.CacheOption = BitmapCacheOption.OnLoad;
        img.StreamSource = ms;
        img.EndInit();
        img.Freeze();
        return img;
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
