using System.Text.Json.Serialization;

public record RefreshRes(
    [property: JsonPropertyName("access_token")]
    string AccessToken,

    [property: JsonPropertyName("refresh_token")]
    string RefreshToken
);