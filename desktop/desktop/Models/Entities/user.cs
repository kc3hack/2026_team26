using System;
using System.Text.Json.Serialization;

public record User(
    [property: JsonPropertyName("id")]
    string Id,

    [property: JsonPropertyName("email")]
    string Email,

    [property: JsonPropertyName("display_name")]
    string DisplayName,

    [property: JsonPropertyName("created_at")]
    DateTime CreatedAt
 );