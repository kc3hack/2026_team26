using System.Text.Json.Serialization;

public record RefreshReq(
    [property: JsonPropertyName("refresh_token")]
    string RefreshToken
);