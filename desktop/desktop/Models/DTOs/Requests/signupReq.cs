using System.Text.Json.Serialization;

public record SignupReq(
    [property: JsonPropertyName("display_name")]
    string DisplayName,

    [property: JsonPropertyName("email")]
    string Email,

    [property: JsonPropertyName("password")]
    string Password
);