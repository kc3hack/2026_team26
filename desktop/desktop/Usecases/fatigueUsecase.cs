public class FatigueUsecase
{
    private readonly IFatigueService _fatigueService;
    private readonly ITokenStorage _tokenStorage;

    public FatigueUsecase(IFatigueService fatigueService, ITokenStorage tokenStorage)
    {
        _fatigueService = fatigueService;
        _tokenStorage = tokenStorage;
    }

    public async Task<bool> RecordFatigueAsync(uint faceScore, uint voiceScore, string? gameId = null)
    {
        // 1. 現在のユーザー情報を取得（ログイン状態の確認）
        var userId = await _tokenStorage.GetCurrentUserIdAsync();
        if (userId == null) return false;

        var req = new FatigueCreateReq(userId, gameId, faceScore, voiceScore, DateTime.Now);

        try
        {
            await _fatigueService.CreateLogAsync(req);
            // 2. 必要に応じてローカルの履歴キャッシュを更新する等の処理
            return true;
        }
        catch { return false; }
    }
}