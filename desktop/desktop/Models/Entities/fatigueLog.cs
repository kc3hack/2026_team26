using System.Text.Json.Serialization;

public record FatigueLog(
    [property: JsonPropertyName("id")]
    string Id,
    string UserId,
    string? GameId,
    uint FaceScore,
    uint VoiceScore,
    DateTime RecordedAt
) : FatigueData(UserId, GameId, FaceScore, VoiceScore, RecordedAt);