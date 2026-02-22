import {
  Alert,
  Box,
  Button,
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

import { useNavigate } from 'react-router-dom';
import type FatigueLog from '../types/fatigueLog';
import type FatigueListRes from '../types/response/fatigueListRes';
import type MeRes from '../types/response/meRes';

// ▼ 修正1: グラフのデータに数値型の時間（timestamp）を追加
interface ChartData {
  time: string;
  timestamp: number; // ← これがグラフの横幅を正確に計算するキーになります
  face_score: number;
  voice_score: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const navigate = useNavigate();

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

      let fatigueRes = await API.authClient().get<FatigueListRes>(`/fatigue?u=${myUserId}&n=10`);
      if (fatigueRes.status === 401) {
        await API.tokenRefresh();
        fatigueRes = await API.authClient().get<FatigueListRes>(`/fatigue?u=${myUserId}&n=10`);
      }

      const fatigueData = fatigueRes.data;
      const items = Array.isArray(fatigueData) ? fatigueData : fatigueData.items || [];

      const formattedData = items.map((log: FatigueLog) => {
        const date = new Date(log.recorded_at);
        return {
          time: `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`,
          timestamp: date.getTime(), // ▼ 修正2: 実際の時間をミリ秒の「数値」として保存
          face_score: log.face_score,
          voice_score: log.voice_score,
        };
      });

      // ▼ 修正3: 単純なreverseではなく、時間順(古い→新しい)に確実に並べ替え
      const sortedData = formattedData.sort((a, b) => a.timestamp - b.timestamp);
      setChartData(sortedData);
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

  // ▼ 追加: 数値(ミリ秒)を「2/22 9:57」の表示に戻すための便利関数
  const formatTime = (unixTime: number) => {
    const d = new Date(unixTime);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

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

                    {/* ▼ 修正4: X軸の設定を「数値」に変更し、時間幅を自動計算させる */}
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      scale="time"
                      tickFormatter={(value) => formatTime(value as number)}
                    />
                    <YAxis domain={[0, 100]} />

                    {/* ▼ 修正5: ツールチップの表示も日時に戻す */}
                    <Tooltip labelFormatter={(label) => formatTime(label as number)} />

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
            <Box sx={{ mt: 5, mb: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/history')} // navigate でさっき作ったページに移動
                sx={{ borderRadius: 3, px: 5, py: 1.5, fontWeight: 'bold' }}
              >
                過去の記録を期間で検索する
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
