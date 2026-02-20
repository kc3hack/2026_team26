using System.IO;
using System.Text.Json;

public class SettingsService : ISettingsService
{
    private readonly string _filePath = "appsettings_local.json";
    public string? LastJoinedTeamId { get; set; }

    public void Save()
    {
        var json = JsonSerializer.Serialize(this);
        File.WriteAllText(_filePath, json);
    }

    public void Load()
    {
        if (File.Exists(_filePath))
        {
            var json = File.ReadAllText(_filePath);
            var data = JsonSerializer.Deserialize<SettingsService>(json);
            this.LastJoinedTeamId = data?.LastJoinedTeamId;
        }
    }
}