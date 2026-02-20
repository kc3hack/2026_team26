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

    public async Task<SignupRes> SignupAsync(SignupReq req) =>
        (await _httpClient.PostAsJsonAsync("/auth/signup", req)).EnsureSuccessStatusCode().Content.ReadFromJsonAsync<SignupRes>().Result!;

    public async Task<SigninRes> SigninAsync(SigninReq req) =>
        (await _httpClient.PostAsJsonAsync("/auth/signin", req)).EnsureSuccessStatusCode().Content.ReadFromJsonAsync<SigninRes>().Result!;

    public async Task<RefreshRes> RefreshAsync(RefreshReq req) =>
        (await _httpClient.PostAsJsonAsync("/auth/refresh", req)).EnsureSuccessStatusCode().Content.ReadFromJsonAsync<RefreshRes>().Result!;

    public async Task LogoutAsync(LogoutReq req) =>
        (await _httpClient.PostAsJsonAsync("/auth/logout", req)).EnsureSuccessStatusCode();
}