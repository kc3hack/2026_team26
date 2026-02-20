using System.Net.Http;
using System.Net.Http.Json;
using System.Net.WebSockets;

public interface IFatigueService
{
    Task<FatigueCreateRes> CreateLogAsync(FatigueCreateReq req);
    Task<FatigueListRes> GetUserLogsAsync(string userId, string? from = null, string? to = null);
    // WebSocket受信開始
    Task ConnectRealtimeUpdatesAsync(string token, Action<FatigueLog> onReceived, CancellationToken ct);
}

public class FatigueService : BaseService, IFatigueService
{
    public FatigueService(HttpClient httpClient) : base(httpClient) { }

    public async Task<FatigueCreateRes> CreateLogAsync(FatigueCreateReq req) =>
        (await _httpClient.PostAsJsonAsync("/fatigue", req)).EnsureSuccessStatusCode().Content.ReadFromJsonAsync<FatigueCreateRes>().Result!;

    public async Task<FatigueListRes> GetUserLogsAsync(string userId, string? from, string? to)
    {
        var query = $"?u={userId}" + (from != null ? $"&f={from}" : "") + (to != null ? $"&t={to}" : "");
        return (await _httpClient.GetFromJsonAsync<FatigueListRes>($"/fatigue{query}"))!;
    }

    public async Task ConnectRealtimeUpdatesAsync(string token, Action<FatigueLog> onReceived, CancellationToken ct)
    {
        using var ws = new ClientWebSocket();
        ws.Options.SetRequestHeader("Authorization", $"Bearer {token}");
        await ws.ConnectAsync(new Uri("ws://localhost:8080/ws/fatigue"), ct);
        // (受信ループ処理は省略)
    }
}