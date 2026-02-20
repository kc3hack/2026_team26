using System.Text.Json.Serialization;

public record ApiErrorResponse(
    [property: JsonPropertyName("message")]
    string Message,

    [property: JsonPropertyName("error")]
    string? Error
);