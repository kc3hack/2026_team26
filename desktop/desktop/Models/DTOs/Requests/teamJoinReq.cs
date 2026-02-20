using System.Text.Json.Serialization;

public record TeamJoinReq(
    [property: JsonPropertyName("team_tag")]
    string TeamTag
);