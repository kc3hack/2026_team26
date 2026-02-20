using System.Text.Json.Serialization;

public record AuthRes(
    [property: JsonPropertyName("user")]
    User User,

    [property: JsonPropertyName("access_token")]
    string AccessToken,

    [property: JsonPropertyName("refresh_token")]
    string? RefreshToken
);