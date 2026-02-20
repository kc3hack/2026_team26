public record TeamCreateRes(
    string id,
    string name,
    DateTime createdAt,
    string? createdBy
) : Team(id, name, createdAt, createdBy);