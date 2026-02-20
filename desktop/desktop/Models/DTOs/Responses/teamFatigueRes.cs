using System.Collections.Generic;
using System.Text.Json.Serialization;

public record TeamFatigueRes(
    [property: JsonPropertyName("team_user")]
    List<User> TeamUser,

    [property: JsonPropertyName("team_data")]
    Team TeamData,

    [property: JsonPropertyName("fatigue_logs")]
    Dictionary<string, List<FatigueLog>> FatigueLogs
);