public record SignupRes(
    User User,
    string AccessToken,
    string? RefreshToken
) : AuthRes(User, AccessToken, RefreshToken);