using System.Text.Json.Serialization;

public record FatigueCreateRes(
    [property: JsonPropertyName("id")]
    string Id
);