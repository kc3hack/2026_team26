public class AuthUsecase
{
    private readonly IAuthService _authService;
    private readonly ITokenStorage _tokenStorage; // ローカル（セキュア）保存用

    public AuthUsecase(IAuthService authService, ITokenStorage tokenStorage)
    {
        _authService = authService;
        _tokenStorage = tokenStorage;
    }

    public async Task<bool> LoginAndStoreAsync(string email, string password)
    {
        try
        {
            var res = await _authService.SigninAsync(new SigninReq(email, password));
            // トークンをセキュアなストレージに保存
            await _tokenStorage.SaveTokensAsync(res.AccessToken, res.RefreshToken);
            return true;
        }
        catch { return false; }
    }

    public async Task LogoutAsync()
    {
        var refreshToken = await _tokenStorage.GetRefreshTokenAsync();
        if (refreshToken != null)
        {
            await _authService.LogoutAsync(new LogoutReq(refreshToken));
        }
        await _tokenStorage.ClearTokensAsync();
    }
}