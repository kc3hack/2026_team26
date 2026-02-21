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
import FatigueChart, { type ChartData } from '../components/FatigueChart'; // ▼ 追加
import Header from '../components/Header';
import API from '../lib/axios';
import type FatigueListRes from '../types/response/fatigueListRes';
import type MeRes from '../types/response/meRes';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // ユーザー情報の取得
      let meRes = await API.authClient().get<MeRes>('/me');
      if (meRes.status === 401) {
        await API.tokenRefresh();
        meRes = await API.authClient().get<MeRes>('/me');
      }
      const myUserId = meRes.data.user_data.id;

      // 疲労度リストの取得
      let fatigueRes = await API.authClient().get<FatigueListRes>(`/fatigue?u=${myUserId}&n=10`);
      if (fatigueRes.status === 401) {
        await API.tokenRefresh();
        fatigueRes = await API.authClient().get<FatigueListRes>(`/fatigue?u=${myUserId}&n=10`);
      }
      // データの整形
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
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ローディング画面
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
        justifyContent: 'center',
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

            {/* ▼ グラフ部分をコンポーネントで呼び出し！ */}
            <FatigueChart data={chartData} />
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
