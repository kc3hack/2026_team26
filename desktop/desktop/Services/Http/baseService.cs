using System.Net.Http;

public abstract class BaseService
{
    protected readonly HttpClient _httpClient;

    protected BaseService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    // トークンのセット（ログイン後に呼び出す）
    public void SetAuthToken(string token)
    {
        _httpClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }
}