public record SigninRes(
    User User,
    string AccessToken,
    string? RefreshToken
) : AuthRes(User, AccessToken, RefreshToken);