public record TeamJoinRes(
    string Id,
    string Name,
    string TeamTag
) : Team(Id, Name, TeamTag);