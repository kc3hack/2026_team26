using System.Text.Json.Serialization;

public record TeamLeaveReq(
    [property: JsonPropertyName("team_id")]
    string TeamId
);