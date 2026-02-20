using System.Text.Json.Serialization;

public record UpdateRes(
    [property: JsonPropertyName("current")]
    string Current,

    [property: JsonPropertyName("support")]
    string[] Support
);