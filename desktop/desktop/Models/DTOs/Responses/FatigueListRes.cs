using System.Collections.Generic;
using System.Text.Json.Serialization;

public record FatigueListRes(
    [property: JsonPropertyName("items")]
    List<FatigueLog> Items
);