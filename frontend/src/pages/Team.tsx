import {
  AddCircle as AddCircleIcon,
  ArrowBack as ArrowBackIcon,
  GroupAdd as GroupAddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TeamInvite from '../components/teamInvite';
import apiClient from '../lib/axios';
import type TeamCreateReq from '../types/request/teamCreateReq';
import type TeamInviteReq from '../types/request/teamInviteReq';
import type TeamJoinReq from '../types/request/teamJoinReq';
import type TeamLeaveReq from '../types/request/teamLeaveReq';
import type ApiErrorResponse from '../types/response/errorRes';
import type MeRes from '../types/response/meRes';
import type TeamInviteRes from '../types/response/teamInviteRes';
import type Team from '../types/team';

interface TeamUI {
  id: string;
  name: string;
  members: { user_id: string; display_name: string; latest_face_score?: number; last_updated?: string }[];
}

interface TeamProps {
  readonly userId: string;
}

type StatusCode = 'default' | 'error' | 'warning' | 'success';

export default function TeamPage(props: TeamProps) {
  const navigate = useNavigate();
  const { inviteCode } = useParams<{ inviteCode: string }>();

  // 状態管理 (新しく作った TeamUI を使うように修正)
  const [team, setTeam] = useState<TeamUI | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // 入力フォーム用
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState<string>(inviteCode ?? '');

  useEffect(() => {
    setJoinCode(inviteCode || '');
  }, [inviteCode]);

  // TODO: 実装しなおし
  // ▼ 自分の所属チーム情報を取得
  const fetchTeamData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.get<MeRes>('/me')
      if (res.status !== 200) {
        throw new Error(res.statusText)
      }
      const teamRes = res.data.user_teams[0];
      const teamId = teamRes.id;
      const teamDataRes = await apiClient.get('/team/fatigue', {
        params: {
          team_id: teamId
        }
      })
      const teamData = teamDataRes.data.team_data;
      const teamMember = teamDataRes.data.team_user;
      const teamUIData: TeamUI = {
        id: teamData.id,
        name: teamData.name,
        members: teamMember
      }
      setTeam(teamUIData);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setTeam(null); // 所属なし
      } else {
        console.error('チーム情報取得エラー:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);
  // 招待API通信部分
  const fetchTeamInvite = async (req: TeamInviteReq): Promise<TeamInviteRes> => {
    const res = await apiClient.post<TeamInviteRes>("/team/invite", req)
    if (res.status !== 200) {
      throw new Error("couldn't get invite code")
    }
    const data = res.data;
    return data;
  }

  // ▼ チーム作成
  const handleCreateTeam = async () => {
    if (!createName) return;
    try {
      const body: TeamCreateReq = { name: createName };
      await apiClient.post<Team>('/teams', body);
      alert('チームを作成しました！');
      fetchTeamData();
    } catch (error) {
      handleError(error, 'チーム作成に失敗しました');
    }
  };

  // ▼ チーム参加
  const handleJoinTeam = async () => {
    if (!joinCode) return;
    try {
      const body: TeamJoinReq = { team_tag: joinCode };
      await apiClient.post<Team>('/teams/join', body);
      alert('チームに参加しました！');
      fetchTeamData();
    } catch (error) {
      handleError(error, 'チーム参加に失敗しました。招待コードを確認してください。');
    }
  };

  // ▼ チーム退出処理
  const handleLeaveTeam = async () => {
    // チーム情報がない場合、または確認ダイアログで「キャンセル」を押した場合は処理を中断
    if (!team) return;
    if (!window.confirm(`本当にチーム「${team.name}」から退出しますか？`)) return;

    setIsActionLoading(true);
    setErrorMsg(null);
    try {
      const req: TeamLeaveReq = { team_id: team.id };
      await apiClient.post("/team/leave", req);
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', width: '100vw', position: 'absolute', top: 0, left: 0, overflowX: 'hidden'}}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            チーム管理
          </Typography>
          {team && (
            <IconButton onClick={fetchTeamData} color="primary">
              <RefreshIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

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
                  value={joinCode || isActionLoading ? '読み込み中...' : ''}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  color="warning"
                  onClick={handleJoinTeam}
                  disabled={!joinCode || isActionLoading }
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
                    {team.name}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <TeamInvite
                      team_id={team.id}
                      apiInvite={fetchTeamInvite}
                    />
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
              メンバーの状況 ({team.members.length}名)
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
              {team.members.map((member) => (
                <Box key={member.user_id}>
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
                            bgcolor: member.user_id === props.userId ? '#667eea' : '#e0e0e0',
                            mr: 2,
                          }}
                        >
                          {member.display_name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {member.display_name} {member.user_id === props.userId && '(あなた)'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.last_updated
                              ? new Date(member.last_updated).toLocaleString()
                              : '記録なし'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* ステータスチップ */}
                      <Chip
                        label={getStatusLabel(member.latest_face_score)}
                        color={getStatusColor(member.latest_face_score) as StatusCode}
                        variant={member.latest_face_score === undefined ? 'outlined' : 'filled'}
                      />
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}
