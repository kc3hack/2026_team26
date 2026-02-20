public record LogoutReq (
    string refreshToken
): RefreshReq(refreshToken);
