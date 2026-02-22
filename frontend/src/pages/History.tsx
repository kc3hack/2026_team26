import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
// ▼ 修正1: useParamsとuseLocationを追加
import { useLocation, useParams } from 'react-router-dom';
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

import type FatigueLog from '../types/fatigueLog';
import type FatigueListRes from '../types/response/fatigueListRes';
import type MeRes from '../types/response/meRes';

interface ChartData {
  time: string;
  timestamp: number;
  face_score: number;
  voice_score: number;
}

export default function History() {
  // ▼ 修正2: URLから対象のユーザーIDを受け取る（無ければ自分のIDになる）
  const { targetUserId } = useParams<{ targetUserId?: string }>();
  // ▼ 修正3: Team画面から渡された「名前」を受け取る
  const location = useLocation();
  const userName = location.state?.userName || '自分';

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const fetchHistoryData = useCallback(async (filterFrom: string, filterTo: string) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // ▼ 修正4: targetUserId がある場合はそれを使う。無い場合は /me で自分のIDを取る。
      let queryUserId = targetUserId;

      if (!queryUserId) {
        let meRes = await API.authClient().get<MeRes>('/me');
        if (meRes.status === 401) {
          await API.tokenRefresh();
          meRes = await API.authClient().get<MeRes>('/me');
        }
        queryUserId = meRes.data?.user_data?.id;
        if (!queryUserId) throw new Error('ユーザーIDが見つかりません');
      }

      let url = `/fatigue?u=${queryUserId}`;
      if (filterFrom) {
        const d = new Date(`${filterFrom}T00:00:00`);
        if (!isNaN(d.getTime())) url += `&f=${d.toISOString()}`;
      }
      if (filterTo) {
        const d = new Date(`${filterTo}T23:59:59`);
        if (!isNaN(d.getTime())) url += `&t=${d.toISOString()}`;
      }

      let fatigueRes = await API.authClient().get<FatigueListRes>(url);
      if (fatigueRes.status === 401) {
        await API.tokenRefresh();
        fatigueRes = await API.authClient().get<FatigueListRes>(url);
      }

      const fatigueData = fatigueRes.data;
      const items = Array.isArray(fatigueData) ? fatigueData : fatigueData?.items || [];

      if (!Array.isArray(items)) throw new Error('データの形式が不正です');

      const formattedData = items.map((log: FatigueLog) => {
        const date = log?.recorded_at ? new Date(log.recorded_at) : new Date();
        return {
          time: `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`,
          timestamp: date.getTime(),
          face_score: log?.face_score ?? 0,
          voice_score: log?.voice_score ?? 0,
        };
      });

      const sortedData = formattedData.sort((a, b) => a.timestamp - b.timestamp);
      setChartData(sortedData);
    } catch (error) {
      console.error('History Fetch Error:', error);
      setErrorMsg('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchHistoryData('', '');
  }, [fetchHistoryData]); // targetUserIdが変わったら再取得する

  const handleSearch = () => {
    fetchHistoryData(fromDate, toDate);
  };

  const handleClear = () => {
    setFromDate('');
    setToDate('');
    fetchHistoryData('', '');
  };

  const formatTime = (unixTime: number) => {
    const d = new Date(unixTime);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (loading && chartData.length === 0) {
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
      {/* ▼ 修正5: 名前が変わるように！ */}
      <Header title={`${userName}の過去の記録`} showBackButton={true} />

      <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMsg}
          </Alert>
        )}

        <Paper
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="body1" fontWeight="bold">
            期間で絞り込み:
          </Typography>
          <TextField
            type="date"
            size="small"
            label="開始日"
            InputLabelProps={{ shrink: true }}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <Typography variant="body1">～</Typography>
          <TextField
            type="date"
            size="small"
            label="終了日"
            InputLabelProps={{ shrink: true }}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            この期間で検索
          </Button>
          <Button variant="outlined" onClick={handleClear} disabled={loading}>
            クリア
          </Button>
        </Paper>

        <Card elevation={2} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, width: '100%' }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              指定した期間のスコア推移 ({chartData.length}件)
            </Typography>

            {chartData.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography color="text.secondary" variant="h6">
                  この期間に疲労度の記録がありません。
                </Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: 400, mt: 4 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      scale="time"
                      tickFormatter={(value) => formatTime(value as number)}
                    />
                    <YAxis domain={[0, 100]} />
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
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
