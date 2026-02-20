using System;
using System.Text.Json.Serialization;

public record FatigueData(
    [property: JsonPropertyName("user_id")]
    string UserId,

    [property: JsonPropertyName("game_id")]
    string? GameId,

    [property: JsonPropertyName("face_score")]
    uint FaceScore,

    [property: JsonPropertyName("voice_score")]
    uint VoiceScore,

    [property: JsonPropertyName("recorded_at")]
    DateTime RecordedAt
);