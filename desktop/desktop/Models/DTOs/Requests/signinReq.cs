using System.Text.Json.Serialization;

public record SigninReq(
    [property: JsonPropertyName("email")]
    string Email,

    [property: JsonPropertyName("password")]
    string Password
);