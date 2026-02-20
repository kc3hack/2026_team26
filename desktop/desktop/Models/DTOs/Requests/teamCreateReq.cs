using System.Text.Json.Serialization;

public record TeamCreateReq(
    [property: JsonPropertyName("name")]
    string Name
);