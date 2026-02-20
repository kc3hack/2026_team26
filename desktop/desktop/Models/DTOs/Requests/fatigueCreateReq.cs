public record FatigueCreateReq (
    string UserId,
    string? GameId,
    uint FaceScore,
    uint VoiceScore,
    DateTime RecordedAt
) : FatigueData(UserId, GameId, FaceScore, VoiceScore, RecordedAt);