using System.Net.Http;
using System.Net.Http.Json;

public interface IAuthService
{
    Task<SignupRes> SignupAsync(SignupReq req);
    Task<SigninRes> SigninAsync(SigninReq req);
    Task<RefreshRes> RefreshAsync(RefreshReq req);
    Task LogoutAsync(LogoutReq req);
}

public class AuthService : BaseService, IAuthService
{
    public AuthService(HttpClient httpClient) : base(httpClient) { }

    public async Task<SignupRes> SignupAsync(SignupReq req)
    {
        var response = await _httpClient.PostAsJsonAsync("/auth/signup", req);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<SignupRes>())!;
    }
    public async Task<SigninRes> SigninAsync(SigninReq req)
    {
        var response = await _httpClient.PostAsJsonAsync("/auth/signin", req);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<SigninRes>())!;
    }
    public async Task<RefreshRes> RefreshAsync(RefreshReq req)
    {
        var response = await _httpClient.PostAsJsonAsync("/auth/refresh", req);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<RefreshRes>())!;
    }

    public async Task LogoutAsync(LogoutReq req) =>
        (await _httpClient.PostAsJsonAsync("/auth/logout", req)).EnsureSuccessStatusCode();
}