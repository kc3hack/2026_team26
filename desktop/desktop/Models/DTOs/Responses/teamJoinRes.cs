public record TeamJoinRes(
    string Id,
    string Name,
    DateTime CreatedAt,
    string? CreatedBy
) : Team(Id, Name, CreatedAt, CreatedBy);