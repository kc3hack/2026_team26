public class UpdateUsecase
{
    private readonly IUpdateService _updateService;
    private readonly string _currentVersion = "0.1.0"; // 自アプリのバージョン

    public UpdateUsecase(IUpdateService updateService)
    {
        _updateService = updateService;
    }

    public async Task<(bool NeedsUpdate, string? NewVersion)> CheckForUpdatesAsync()
    {
        var response = await _updateService.CheckUpdateAsync();

        // シンプルなバージョン比較ロジック
        if (response.Current != _currentVersion)
        {
            return (true, response.Current);
        }
        return (false, null);
    }
}