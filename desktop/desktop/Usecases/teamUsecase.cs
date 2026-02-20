public class TeamUsecase
{
    private readonly ITeamService _teamService;
    private readonly ISettingsService _settings; // ローカル設定保存用（仮想）

    public TeamUsecase(ITeamService teamService, ISettingsService settings)
    {
        _teamService = teamService;
        _settings = settings;
    }

    public async Task<bool> JoinNewTeamAsync(string tag)
    {
        try
        {
            var team = await _teamService.JoinTeamAsync(new TeamJoinReq(tag));
            _settings.LastJoinedTeamId = team.Id; // アプリ側に状態を保持
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }
}