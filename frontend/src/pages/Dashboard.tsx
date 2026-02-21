import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  Alert,
  AppBar,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type FatigueListRes from '../types/response/fatigueListRes';
import type MeRes from '../types/response/meRes';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'https://test.sheeplab.net/api';

interface ChartData {
  time: string;
  face_score: number;
  voice_score: number;
}

interface DashboardProps {
  token: string;
  logout: () => Promise<void>;
  userId: string | null;
}

export default function Dashboard({ token }: DashboardProps) {
  const navigate = useNavigate(); // 追加: 画面遷移用

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const meRes = await axios.get<MeRes>(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const myUserId = meRes.data.user_data.id;

      const fatigueRes = await axios.get<FatigueListRes>(`${API_URL}/fatigue?u=${myUserId}&n=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedData = (fatigueRes.data.items || []).map((log) => {
        const date = new Date(log.recorded_at);
        return {
          time: `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`,
          face_score: log.face_score,
          voice_score: log.voice_score,
        };
      });

      setChartData(formattedData.reverse());
    } catch (error) {
      console.error(error);
      setErrorMsg('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    // ▼ 修正: position="absolute" と width="100vw" で元の制限を突破して画面いっぱいに広げる
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f7fa',
        width: '100vw',
        position: 'absolute',
        top: 0,
        left: 0,
        overflowX: 'hidden', // 横スクロールバーを出さないための処理
      }}
    >
      {/* ▼ 追加: メニューに戻るためのヘッダー（AppBar） ▼ */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            ダッシュボード
          </Typography>
        </Toolbar>
      </AppBar>

      {/* ▼ コンテンツ部分 ▼ */}
      <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMsg}
          </Alert>
        )}

        <Card elevation={2} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, width: '100%' }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              最近のスコア推移
            </Typography>

            {chartData.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="h6">
                  まだ疲労度の記録がありません。
                </Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: 400, mt: 4 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="face_score"
                      name="顔スコア"
                      stroke="#8884d8"
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="voice_score"
                      name="声スコア"
                      stroke="#82ca9d"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
