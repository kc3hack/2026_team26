public interface ISettingsService
{
    string? LastJoinedTeamId { get; set; }
    void Save();
    void Load();
}
