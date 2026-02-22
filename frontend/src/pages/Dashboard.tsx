import {
  Alert,
  Box, Card, CardContent, CircularProgress, Container,
  Typography
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// ▼ 修正: 標準のaxiosではなく、チーム特製のAPIクライアントを読み込む
import API from '../lib/axios';

import type MeRes from '../types/response/meRes';

import Header from '../components/Header';

interface ChartData {
  time: string;
  face_score: number;
  voice_score: number;
}

// ▼ 修正: App.tsxからtokenは渡されなくなったので削除！
interface DashboardProps {
  logout: () => Promise<void>;
  userId: string | null;
}

export default function Dashboard({  }: DashboardProps) {

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // ▼ 1. 自分のユーザーIDを取得 (Team.tsxと同じリフレッシュロジックを採用！)
      let meRes = await API.authClient().get<MeRes>('/me');
      if (meRes.status === 401) {
        await API.tokenRefresh();
        meRes = await API.authClient().get<MeRes>('/me');
      }
      const myUserId = meRes.data.user_data.id;

      // ▼ 2. 疲労度データを取得
      let fatigueRes = await API.authClient().get<any>(`/fatigue?u=${myUserId}&n=10`);
      if (fatigueRes.status === 401) {
        await API.tokenRefresh();
        fatigueRes = await API.authClient().get<any>(`/fatigue?u=${myUserId}&n=10`);
      }

      // ▼ 3. データの整形 (配列で来てもオブジェクトで来ても対応できる安全な書き方)
      const fatigueData = fatigueRes.data;
      const items = Array.isArray(fatigueData) ? fatigueData : (fatigueData.items || []);

      const formattedData = items.map((log: any) => {
        const date = new Date(log.recorded_at);
        return {
          time: `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`,
          face_score: log.face_score,
          voice_score: log.voice_score,
        };
      });

      setChartData(formattedData.reverse());

    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
      setErrorMsg('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []); // tokenを使わなくなったので依存配列からも削除

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', position: 'absolute', top: 0, left: 0 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
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
    }}>

      <Header title="ダッシュボード" showBackButton={true} />

      <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>
        )}

        <Card elevation={2} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, width: '100%' }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              最近のスコア推移
            </Typography>

            {chartData.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="h6">まだ疲労度の記録がありません。</Typography>
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
