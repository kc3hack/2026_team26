import { AddCircle as AddCircleIcon, GroupAdd as GroupAddIcon } from '@mui/icons-material';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Container, Paper, TextField, Typography,
} from '@mui/material';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
// ▼ 修正1: useNavigate を追加
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import TeamFatigueChart from '../components/TeamFatigueChart';
import TeamInvite from '../components/teamInvite';
import API from '../lib/axios';
import type TeamCreateReq from '../types/request/teamCreateReq';
import type TeamInviteReq from '../types/request/teamInviteReq';
import type TeamJoinReq from '../types/request/teamJoinReq';
import type TeamLeaveReq from '../types/request/teamLeaveReq';
import type ApiErrorResponse from '../types/response/errorRes';
import type MeRes from '../types/response/meRes';
import type TeamFatigueRes from '../types/response/teamFatigueRes';
import type TeamInviteRes from '../types/response/teamInviteRes';

interface TeamProps {
  userId: string;
}

type StatusColor = 'default' | 'error' | 'warning' | 'success';

export default function TeamPage(props: TeamProps) {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate(); // ▼ 修正2: 画面遷移用の機能を追加

  const [team, setTeam] = useState<TeamFatigueRes | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState<string>(inviteCode ?? '');

  useEffect(() => {
    setJoinCode(inviteCode || '');
  }, [inviteCode]);

  const fetchTeamData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let meRes;
      try {
        meRes = await API.authClient().get<MeRes>('/me');
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          await API.tokenRefresh();
          meRes = await API.authClient().get<MeRes>('/me');
        } else {
          throw err;
        }
      }

      const myTeams = meRes.data.user_teams;
      if (!myTeams || myTeams.length === 0) {
        setTeam(undefined);
        setLoading(false);
        return;
      }

      const myTeamId = myTeams[0].id;

      let fatigues = await API.authClient().get<TeamFatigueRes>(`/team/fatigue?team_id=${myTeamId}`);
      if (fatigues.status === 401) {
        await API.tokenRefresh();
        fatigues = await API.authClient().get<TeamFatigueRes>(`/team/fatigue?team_id=${myTeamId}`);
      }
      setTeam(fatigues.data);
    } catch (error) {
      console.error(error);
      setErrorMsg('チーム情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const fetchTeamInvite = async (req: TeamInviteReq): Promise<TeamInviteRes> => {
    let res = await API.authClient().post<TeamInviteRes>('/team/invite', req);
    if (res.status === 401) {
      await API.tokenRefresh();
      res = await API.authClient().post<TeamInviteRes>('/team/invite', req);
    }
    if (res.status !== 200) throw new Error("couldn't get invite code");
    return res.data;
  };

  const handleCreateTeam = async () => {
    if (!createName.trim()) return;
    setIsActionLoading(true);
    setErrorMsg(null);
    try {
      const req: TeamCreateReq = { name: createName.trim() };
      let res = await API.authClient().post('/team/create', req);
      if (res.status === 401) {
        await API.tokenRefresh();
        await API.authClient().post('/team/create', req);
      }
      fetchTeamData();
    } catch (error) {
      handleError(error, 'チーム作成に失敗しました。');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) return;
    setIsActionLoading(true);
    setErrorMsg(null);
    try {
      const req: TeamJoinReq = { team_tag: joinCode.trim() };
      let res = await API.authClient().post('/team/join', req);
      if (res.status === 401) {
        await API.tokenRefresh();
        await API.authClient().post('/team/join', req);
      }
      fetchTeamData();
    } catch (error) {
      handleError(error, 'チームの参加に失敗しました。タグが間違っている可能性があります。');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!team) return;
    if (!window.confirm(`本当にチーム「${team.team_data.name}」から退出しますか？`)) return;
    setIsActionLoading(true);
    setErrorMsg(null);
    try {
      const req: TeamLeaveReq = { team_id: team.team_data.id };
      let res = await API.authClient().post('/team/leave', req);
      if (res.status === 401) {
        await API.tokenRefresh();
        await API.authClient().post('/team/leave', req);
      }
      fetchTeamData();
    } catch (error) {
      handleError(error, 'チームの退出に失敗しました。');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleError = (error: unknown, defaultMsg: string) => {
    let msg = defaultMsg;
    if (axios.isAxiosError(error) && error.response) {
      const data = error.response.data as ApiErrorResponse;
      if (data?.message) msg = data.message;
    }
    setErrorMsg(msg);
  };

  const getStatusColor = (score?: number) => {
    if (score === undefined) return 'default';
    if (score <= 30) return 'error';
    if (score <= 60) return 'warning';
    return 'success';
  };

  const getStatusLabel = (score?: number) => {
    if (score === undefined) return '未測定';
    if (score <= 30) return '危険';
    if (score <= 60) return '注意';
    return '良好';
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', width: '100vw', position: 'absolute', top: 0, left: 0, overflowX: 'hidden' }}>
      <Header title="チーム管理" showBackButton={true} />
      <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

        {!team ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, maxWidth: 1000, mx: 'auto' }}>
            <Box>
              <Paper sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <AddCircleIcon sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight="bold">チームを新規作成</Typography>
                <TextField fullWidth label="チーム名" variant="outlined" sx={{ mb: 3 }} value={createName} onChange={(e) => setCreateName(e.target.value)} />
                <Button variant="contained" fullWidth size="large" onClick={handleCreateTeam} disabled={!createName} sx={{ mt: 'auto', bgcolor: '#667eea' }}>作成する</Button>
              </Paper>
            </Box>
            <Box>
              <Paper sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <GroupAddIcon sx={{ fontSize: 60, color: '#ff9800', mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight="bold">チームに参加</Typography>
                <TextField fullWidth label="招待コード" variant="outlined" sx={{ mb: 3 }} disabled={loading} value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
                <Button variant="contained" fullWidth size="large" color="warning" onClick={handleJoinTeam} disabled={!joinCode || isActionLoading} sx={{ mt: 'auto' }}>参加する</Button>
              </Paper>
            </Box>
          </Box>
        ) : (
          <>
            <Paper sx={{ p: 3, mb: 4, bgcolor: 'white', borderRadius: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2, alignItems: 'center' }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Current Team</Typography>
                  <Typography variant="h4" fontWeight="bold">{team.team_data.name}</Typography>
                </Box>
                <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <TeamInvite team_id={team.team_data.id} apiInvite={fetchTeamInvite} />
                  <Button variant="outlined" color="error" size="small" onClick={handleLeaveTeam} disabled={isActionLoading} sx={{ mt: 2, display: 'block', ml: { xs: 0, md: 'auto' } }}>チームを退出</Button>
                </Box>
              </Box>
            </Paper>

            <Typography variant="h6" gutterBottom sx={{ ml: 1, mb: 2, fontWeight: 'bold' }}>
              メンバーの状況 ({team.team_user.length}名)
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 2, mb: 4 }}>
              {team.team_user.map((member) => {
                // ▼ 修正3: [-1] バグを修正し、安全に最新のログを取得
                const logs = team.fatigue_logs[member.id] || [];
                const latestLog = logs.length > 0 ? logs.at(-1) : undefined;

                return (
                  <Box key={member.id}>
                    {/* ▼ 修正4: クリックでその人の履歴ページに飛ぶように！ */}
                    <Card
                      elevation={2}
                      onClick={() => navigate(`/history/${member.id}`, { state: { userName: member.display_name } })}
                      sx={{
                        cursor: 'pointer',
                        transition: '0.2s',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 }
                      }}
                    >
                      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: member.id === props.userId ? '#667eea' : '#e0e0e0', mr: 2 }}>
                            {member.display_name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {member.display_name} {member.id === props.userId && '(あなた)'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {latestLog?.recorded_at ? new Date(latestLog.recorded_at).toLocaleString() : '記録なし'}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={getStatusLabel(latestLog?.face_score)}
                          color={getStatusColor(latestLog?.face_score) as StatusColor}
                          variant={latestLog?.face_score === undefined ? 'outlined' : 'filled'}
                        />
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>
            <Box>
              <TeamFatigueChart teamData={team} />
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}
