using System.Text.Json.Serialization;

public record UpdateRes(
    [property: JsonPropertyName("current")]
    Version Current,

    [property: JsonPropertyName("support")]
    Version[] Support
);