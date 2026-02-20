public class UpdateUsecase
{
    private readonly IUpdateService _updateService;
    private readonly Version _currentVersion = new Version(0, 0, 1); // 自アプリのバージョン

    public UpdateUsecase(IUpdateService updateService)
    {
        _updateService = updateService;
    }

    public async Task<(bool NeedsUpdate, string? NewVersion)> CheckForUpdatesAsync()
    {
        var response = await _updateService.CheckUpdateAsync();

        bool isSupported = response.Support
            .Contains(_currentVersion);
        if (isSupported)
        {
            return (false, null);
        }
        return (true, null);
    }
}