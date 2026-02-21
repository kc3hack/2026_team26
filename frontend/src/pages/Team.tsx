import { AddCircle as AddCircleIcon, GroupAdd as GroupAddIcon } from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import TeamFatigueChart from '../components/TeamFatigueChart';
import TeamInvite from '../components/teamInvite';
import API from '../lib/axios';
import type TeamCreateReq from '../types/request/teamCreateReq';
import type TeamInviteReq from '../types/request/teamInviteReq';
import type TeamJoinReq from '../types/request/teamJoinReq';
import type TeamLeaveReq from '../types/request/teamLeaveReq'; // 追加
import type ApiErrorResponse from '../types/response/errorRes';
import type MeRes from '../types/response/meRes'; // 追加
import type TeamFatigueRes from '../types/response/teamFatigueRes';
import type TeamInviteRes from '../types/response/teamInviteRes';

interface TeamProps {
  userId: string;
}

type StatusColor = 'default' | 'error' | 'warning' | 'success';

// 🚨 修正3: token はこの「TeamPage」コンポーネントの中でしか使えません！
// 以下すべての処理を必ずこの中に入れます。
export default function TeamPage(props: TeamProps) {
  const { inviteCode } = useParams<{ inviteCode: string }>();

  // 状態管理 (新しく作った TeamUI を使うように修正)
  const [team, setTeam] = useState<TeamFatigueRes | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // 入力フォーム用
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState<string>(inviteCode ?? '');

  useEffect(() => {
    setJoinCode(inviteCode || '');
  }, [inviteCode]);

  // ▼ 自分の所属チーム情報を取得
  const fetchTeamData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. まずは自分の情報を取得し、所属チームがあるか確認する
      let meRes = await API.authClient().get<MeRes>('/me');
      if (meRes.status === 401) {
        await API.tokenRefresh();
        meRes = await API.authClient().get<MeRes>('/me');
      }

      const myTeams = meRes.data.user_teams;

      // 所属チームがない場合は、未所属画面を表示
      if (!myTeams || myTeams.length === 0) {
        setLoading(false);
        return;
      }

      // 今回は1つ目のチーム情報を表示する
      const myTeamId = myTeams[0].id;

      // 2. チームの疲労度データと、招待コードを「同時に」取得する
      let fatigues = await API.authClient().get<TeamFatigueRes>(
        `/team/fatigue?team_id=${myTeamId}`,
      );
      if (fatigues.status === 401) {
        await API.tokenRefresh();
        fatigues = await API.authClient().get<TeamFatigueRes>(
          `/team/fatigue?team_id=${myTeamId}`,
        );
      }
      const teamData = fatigues.data;
      setTeam(teamData);

      // 3. 画面表示用のデータに変換
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
  // 招待API通信部分
  const fetchTeamInvite = async (req: TeamInviteReq): Promise<TeamInviteRes> => {
    let res = await API.authClient().post<TeamInviteRes>('/team/invite', req);
    if (res.status === 401) {
      await API.tokenRefresh();
      res = await API.authClient().post<TeamInviteRes>('/team/invite', req);
    }
    if (res.status !== 200) {
      throw new Error("couldn't get invite code");
    }
    const data = res.data;
    return data;
  };

  // ▼ チーム作成処理
  const handleCreateTeam = async () => {
    if (!createName.trim()) return;
    setIsActionLoading(true);
    setErrorMsg(null);
    try {
      const req: TeamCreateReq = { name: createName };
      const res = await API.authClient().post('/team/create', req);
      if (res.status === 401) {
        await API.tokenRefresh();
        await API.authClient().post('/team/create', req);
      }
      fetchTeamData();
    } catch (error) {
      console.error(error);
      handleError(error, 'チーム作成に失敗しました。'); // ← setErrorMsgから変更
    } finally {
      setIsActionLoading(false);
    }
  };

  // ▼ チーム参加処理
  const handleJoinTeam = async () => {
    if (!joinCode.trim()) return;
    setIsActionLoading(true);
    setErrorMsg(null);
    try {
      const req: TeamJoinReq = { team_tag: joinCode };
      const res = await API.authClient().post('/team/join', req);
      if (res.status === 401) {
        await API.tokenRefresh();
        await API.authClient().post('/team/join', req);
      }
      fetchTeamData();
    } catch (error) {
      console.error(error);
      handleError(error, 'チームの参加に失敗しました。タグが間違っている可能性があります。'); // ← setErrorMsgから変更
    } finally {
      setIsActionLoading(false);
    }
  };

  // ▼ チーム退出処理
  const handleLeaveTeam = async () => {
    // チーム情報がない場合、または確認ダイアログで「キャンセル」を押した場合は処理を中断
    if (!team) return;
    if (!window.confirm(`本当にチーム「${team.team_data.name}」から退出しますか？`)) return;

    setIsActionLoading(true);
    setErrorMsg(null);
    try {
      const req: TeamLeaveReq = { team_id: team.team_data.id };
      const res = await API.authClient().post('/team/leave', req);
      if (res.status === 401) {
        await API.tokenRefresh();
        await API.authClient().post('/team/leave', req);
      }
      // 退出に成功したら、最新の状態を取得し直す（所属チームがなくなるので、自動的に未所属画面に戻ります！）
      fetchTeamData();
    } catch (error) {
      console.error(error);
      handleError(error, 'チームの退出に失敗しました。');
    } finally {
      setIsActionLoading(false);
    }
  };

  // ▼ エラーハンドリング共通化
  const handleError = (error: unknown, defaultMsg: string) => {
    let msg = defaultMsg;
    if (axios.isAxiosError(error) && error.response) {
      const data = error.response.data as ApiErrorResponse;
      if (data?.message) msg = data.message;
    }
    setErrorMsg(msg);
  };

  // スコアに基づく状態判定
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

  // 読み込み中
  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f7fa',
        width: '100vw',
        position: 'absolute',
        top: 0,
        left: 0,
        overflowX: 'hidden',
      }}
    >
      {/* ▼ 追加: ヘッダーコンポーネントをここで呼び出す ▼ */}
      <Header title="チーム管理" showBackButton={true} />
      {/* 【修正】maxWidthを "xl" に拡張して大画面対応 */}
      <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {!team ? (
          // ▼▼▼ チーム未所属時の画面 ▼▼▼
          // 【修正】大画面で広がりすぎないよう maxWidth を設定し、中央寄せ(mx: auto)
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 4,
              maxWidth: 1000,
              mx: 'auto',
            }}
          >
            <Box>
              <Paper
                sx={{
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <AddCircleIcon sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  チームを新規作成
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph align="center">
                  新しいチームを作成し、リーダーとしてメンバーを招待します。
                </Typography>
                <TextField
                  fullWidth
                  label="チーム名"
                  variant="outlined"
                  sx={{ mb: 3 }}
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                />
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleCreateTeam}
                  disabled={!createName}
                  sx={{ mt: 'auto', bgcolor: '#667eea' }}
                >
                  作成する
                </Button>
              </Paper>
            </Box>

            <Box>
              <Paper
                sx={{
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <GroupAddIcon sx={{ fontSize: 60, color: '#ff9800', mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  チームに参加
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph align="center">
                  共有された「招待コード」を入力して、既存のチームに参加します。
                </Typography>
                <TextField
                  fullWidth
                  label="招待コード"
                  variant="outlined"
                  sx={{ mb: 3 }}
                  disabled={loading}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  color="warning"
                  onClick={handleJoinTeam}
                  disabled={!joinCode || isActionLoading}
                  sx={{ mt: 'auto' }}
                >
                  参加する
                </Button>
              </Paper>
            </Box>
          </Box>
        ) : (
          // ▼▼▼ チーム所属時の画面（メンバーリスト） ▼▼▼
          <>
            {/* チームヘッダー情報 */}
            <Paper sx={{ p: 3, mb: 4, bgcolor: 'white', borderRadius: 2 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                  gap: 2,
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Current Team
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {team.team_data.name}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <TeamInvite team_id={team.team_data.id} apiInvite={fetchTeamInvite} />
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleLeaveTeam}
                    disabled={isActionLoading}
                    sx={{ mt: 2, display: 'block', ml: { xs: 0, md: 'auto' } }}
                  >
                    チームを退出
                  </Button>
                </Box>
              </Box>
            </Paper>

            <Typography variant="h6" gutterBottom sx={{ ml: 1, mb: 2, fontWeight: 'bold' }}>
              メンバーの状況 ({team.team_user.length}名)
            </Typography>

            {/* 【修正】レスポンシブなグリッドレイアウト設定 */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr', // スマホ: 1列
                  sm: '1fr 1fr', // タブレット: 2列
                  md: 'repeat(3, 1fr)', // 小さなPC: 3列
                  lg: 'repeat(4, 1fr)', // 一般的なPC: 4列
                  xl: 'repeat(6, 1fr)', // 大画面: 6列
                },
                gap: 2,
              }}
            >
              {team.team_user.map((member) => (
                <Box key={member.id}>
                  <Card elevation={2}>
                    <CardContent
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          sx={{
                            bgcolor: member.id === props.userId ? '#667eea' : '#e0e0e0',
                            mr: 2,
                          }}
                        >
                          {member.display_name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {member.display_name} {member.id === props.userId && '(あなた)'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {team.fatigue_logs[member.id]?.[-1]?.recorded_at
                              ? new Date(team.fatigue_logs[member.id][-1].recorded_at).toLocaleString()
                              : '記録なし'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* ステータスチップ */}
                      <Chip
                        label={getStatusLabel(team.fatigue_logs[member.id]?.[-1]?.face_score)}
                        color={getStatusColor(team.fatigue_logs[member.id]?.[-1]?.face_score) as StatusColor}
                        variant={team.fatigue_logs[member.id]?.[-1]?.face_score === undefined ? 'outlined' : 'filled'}
                      />
                    </CardContent>
                  </Card>
                </Box>
              ))}
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
