using System.Net.Http;
using System.Net.Http.Json;

public interface IUpdateService
{
    Task<UpdateResponse> CheckUpdateAsync();
}

public class UpdateService : BaseService, IUpdateService
{
    public UpdateService(HttpClient httpClient) : base(httpClient) { }

    public async Task<UpdateResponse> CheckUpdateAsync()
    {
        // 認証不要のGETリクエスト
        return (await _httpClient.GetFromJsonAsync<UpdateResponse>("/update"))!;
    }
}