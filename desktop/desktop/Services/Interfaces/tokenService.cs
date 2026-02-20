
public interface ITokenStorage
{
    Task SaveTokensAsync(string accessToken, string refreshToken);
    Task<string?> GetAccessTokenAsync();
    Task<string?> GetRefreshTokenAsync();
    Task<string?> GetCurrentUserIdAsync();
    Task ClearTokensAsync();
}