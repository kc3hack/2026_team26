using System.Net.Http;
using System.Net.Http.Json;

public interface ITeamService
{
    Task<TeamCreateRes> CreateTeamAsync(TeamCreateReq req);
    Task<TeamJoinRes> JoinTeamAsync(TeamJoinReq req);
    Task LeaveTeamAsync(TeamLeaveReq req);
    Task<TeamFatigueRes> GetTeamFatigueAsync(string teamId, string? from = null, string? to = null, int? n = null);
}

public class TeamService : BaseService, ITeamService
{
    public TeamService(HttpClient httpClient) : base(httpClient) { }

    public async Task<TeamCreateRes> CreateTeamAsync(TeamCreateReq req)
    {
        var res = await _httpClient.PostAsJsonAsync("/team/create", req);
        res.EnsureSuccessStatusCode();
        return (await res.Content.ReadFromJsonAsync<TeamCreateRes>())!;
    }

    public async Task<TeamJoinRes> JoinTeamAsync(TeamJoinReq req)
    {
        var res = await _httpClient.PostAsJsonAsync("/team/join", req);
        res.EnsureSuccessStatusCode();
        return (await res.Content.ReadFromJsonAsync<TeamJoinRes>())!;
    }

    public async Task LeaveTeamAsync(TeamLeaveReq req)
    {
        var res = await _httpClient.PostAsJsonAsync("/team/leave", req);
        res.EnsureSuccessStatusCode();
    }

    public async Task<TeamFatigueRes> GetTeamFatigueAsync(string teamId, string? from, string? to, int? n)
    {
        // クエリパラメータの構築
        var query = $"?team_id={teamId}";
        if (from != null) query += $"&f={from}";
        if (to != null) query += $"&t={to}";
        if (n != null) query += $"&n={n}";

        return (await _httpClient.GetFromJsonAsync<TeamFatigueRes>($"/team/fatigue{query}"))!;
    }
}