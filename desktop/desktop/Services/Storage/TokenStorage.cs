public class TokenStorage : ITokenStorage
{
    private string? _accessToken;
    private string? _refreshToken;
    private string? _userId;

    public Task SaveTokensAsync(string accessToken, string refreshToken)
    {
        _accessToken = accessToken;
        _refreshToken = refreshToken;
        // トークンをデコードしてUserIdを抜き出すロジックをここに入れる
        return Task.CompletedTask;
    }

    public Task<string?> GetAccessTokenAsync() => Task.FromResult(_accessToken);
    public Task<string?> GetRefreshTokenAsync() => Task.FromResult(_refreshToken);
    public Task<string?> GetCurrentUserIdAsync() => Task.FromResult(_userId);

    public Task ClearTokensAsync()
    {
        _accessToken = null;
        _refreshToken = null;
        _userId = null;
        return Task.CompletedTask;
    }
}