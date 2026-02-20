import {
  AddCircle as AddCircleIcon,
  ArrowBack as ArrowBackIcon,
  ContentCopy as ContentCopyIcon,
  GroupAdd as GroupAddIcon,
  Refresh as RefreshIcon,
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
import type { ApiErrorResponse, TeamCreateRequest, TeamFatigueResponse, TeamJoinRequest } from '../types';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'https://test.sheeplab.net/api';

interface TeamUI {
  id: string;
  name: string;
  invite_code: string;
  members: { user_id: string; display_name: string; latest_face_score?: number; last_updated?: string }[];
}

interface TeamProps {
  token: string;
  userId: string;
}

// 🚨 修正3: token はこの「TeamPage」コンポーネントの中でしか使えません！
// 以下すべての処理を必ずこの中に入れます。
export default function TeamPage({ token, userId }: TeamProps) {
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

  // ▼ 自分の所属チーム情報を取得
  const fetchTeamData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const myTeamId = null; // 仮置き（あとでAPIから取得する）

      if (!myTeamId) {
        setTeam(null);
        setLoading(false);
        return;
      }

      const res = await axios.get<TeamFatigueResponse>(`${API_URL}/team/fatigue?team_id=${myTeamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 現状のUIに合わせるための仮の変換処理
      const teamData: TeamUI = {
        id: res.data.team_data.id,
        name: res.data.team_data.name,
        invite_code: "dummy_tag", // ※後述のバックエンドの欠陥参照
        members: res.data.team_user.map((user) => {
          // ▼ 修正: fatigue_logs の中から、このユーザーのログ配列を探す
          const userLogs = res.data.fatigue_logs[user.id] || [];
          // 一番新しいログ（とりあえず配列の先頭にあると仮定）を取得
          const latestLog = userLogs.length > 0 ? userLogs[0] : null;

          return {
            user_id: user.id,
            display_name: user.display_name,
            latest_face_score: latestLog?.face_score, // ログからスコアを取得
            last_updated: latestLog?.recorded_at, // ログから時間を取得
          };
        })
      };

      setTeam(teamData);
    } catch (error) {
      console.error(error);
      setErrorMsg('チーム情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

 // ▼ チーム作成処理
  const handleCreateTeam = async () => {
    if (!createName.trim()) return;
    setIsActionLoading(true);
    setErrorMsg(null);
    try {
      const req: TeamCreateRequest = { name: createName };
      await axios.post(`${API_URL}/team/create`, req, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
    if (!joinCode || !joinCode.trim()) return;
    setIsActionLoading(true);
    setErrorMsg(null);
    try {
      const req: TeamJoinRequest = { team_tag: joinCode };
      await axios.post(`${API_URL}/team/join`, req, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTeamData();
    } catch (error) {
      console.error(error);
      handleError(error, 'チームの参加に失敗しました。タグが間違っている可能性があります。'); // ← setErrorMsgから変更
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

  // ▼ 招待コードのコピー
  const copyCode = () => {
    if (team) {
      navigator.clipboard.writeText(team.invite_code);
      alert('招待コードをコピーしました');
    }
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
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f7fa' }}>
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
                  <Typography variant="caption" display="block" color="text.secondary">
                    招待コード
                  </Typography>
                  <Chip
                    label={team.invite_code}
                    onDelete={copyCode}
                    deleteIcon={<ContentCopyIcon />}
                    sx={{ fontWeight: 'bold', fontSize: '1.1rem', py: 2 }}
                  />
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
                            bgcolor: member.user_id === userId ? '#667eea' : '#e0e0e0',
                            mr: 2,
                          }}
                        >
                          {member.display_name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {member.display_name} {member.user_id === userId && '(あなた)'}
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
                        color={
                          getStatusColor(member.latest_face_score) as
                            | 'default'
                            | 'error'
                            | 'warning'
                            | 'success'
                        }
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
