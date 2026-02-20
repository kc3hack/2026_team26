using System;
using System.Text.Json.Serialization;

public record Team(
    [property: JsonPropertyName("id")]
    string Id,

    [property: JsonPropertyName("name")]
    string Name,

    [property: JsonPropertyName("created_at")]
    DateTime CreatedAt,

    [property: JsonPropertyName("created_by")]
    string? CreatedBy
);