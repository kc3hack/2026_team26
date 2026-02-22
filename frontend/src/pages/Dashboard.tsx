import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
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

import Header from '../components/Header';
import API from '../lib/axios';

// ▼ 修正: anyをなくすためにFatigueLogの型をインポート
import type FatigueLog from '../types/fatigueLog';
import type FatigueListRes from '../types/response/fatigueListRes';
import type MeRes from '../types/response/meRes';

interface ChartData {
  time: string;
  face_score: number;
  voice_score: number;
}

// ▼ 修正1: {} ではなく props を使うようにして no-empty-pattern を回避
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      let meRes = await API.authClient().get<MeRes>('/me');
      if (meRes.status === 401) {
        await API.tokenRefresh();
        meRes = await API.authClient().get<MeRes>('/me');
      }
      const myUserId = meRes.data.user_data.id;

      // ▼ 修正2: <any> ではなく <FatigueListRes> に変更
      let fatigueRes = await API.authClient().get<FatigueListRes>(`/fatigue?u=${myUserId}&n=10`);
      if (fatigueRes.status === 401) {
        await API.tokenRefresh();
        fatigueRes = await API.authClient().get<FatigueListRes>(`/fatigue?u=${myUserId}&n=10`);
      }

      const fatigueData = fatigueRes.data;
      const items = Array.isArray(fatigueData) ? fatigueData : fatigueData.items || [];

      // ▼ 修正3: log: any ではなく log: FatigueLog に変更
      const formattedData = items.map((log: FatigueLog) => {
        const date = new Date(log.recorded_at);
        return {
          time: `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`,
          face_score: log.face_score,
          voice_score: log.voice_score,
        };
      });

      setChartData(formattedData.reverse());
    } catch (error) {
      console.error('Dashboard Fetch Error:', error);
      setErrorMsg('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

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
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        position: 'absolute',
        top: 0,
        left: 0,
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: '#f5f7fa',
      }}
    >
      <Header title="ダッシュボード" showBackButton={true} />

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
