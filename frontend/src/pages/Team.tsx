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
import { useNavigate } from 'react-router-dom';
import type { CreateTeamRequest, JoinTeamRequest, Team } from '../types';
import type ApiErrorResponse from '../types/responce/errorRes';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'https://test.sheeplab.net/api';

interface TeamProps {
  readonly token: string;
  readonly userId: string;
}

export default function TeamPage(props: TeamProps) {
  const navigate = useNavigate();

  // 状態管理
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 入力フォーム用
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  // ▼ 自分の所属チーム情報を取得
  const fetchTeamData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.get<Team>(`${API_URL}/teams/my`, {
        headers: { Authorization: `Bearer ${props.token}` },
      });
      setTeam(res.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setTeam(null); // 所属なし
      } else {
        console.error('チーム情報取得エラー:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [props.token]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // ▼ チーム作成
  const handleCreateTeam = async () => {
    if (!createName) return;
    try {
      const body: CreateTeamRequest = { name: createName };
      await axios.post<Team>(`${API_URL}/teams`, body, {
        headers: { Authorization: `Bearer ${props.token}` },
      });
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
      const body: JoinTeamRequest = { invite_code: joinCode };
      await axios.post<Team>(`${API_URL}/teams/join`, body, {
        headers: { Authorization: `Bearer ${props.token}` },
      });
      alert('チームに参加しました！');
      fetchTeamData();
    } catch (error) {
      handleError(error, 'チーム参加に失敗しました。招待コードを確認してください。');
    }
  };

  // エラーハンドリング共通化
  const handleError = (error: unknown, defaultMsg: string) => {
    let msg = defaultMsg;
    if (axios.isAxiosError(error) && error.response) {
      const data = error.response.data as ApiErrorResponse;
      if (data?.message) msg = data.message;
    }
    setErrorMsg(msg);
  };

  // 招待コードのコピー
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
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  color="warning"
                  onClick={handleJoinTeam}
                  disabled={!joinCode}
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
