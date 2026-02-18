import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Paper,
  Toolbar,
  Typography,
} from '@mui/material';
import axios from 'axios';
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
import type { FatigueListResponse, FatigueLog } from '../types';

const API_URL = 'https://test.sheeplab.net/api';

interface DashboardProps {
  token: string;
  logout: () => void;
  userId: string | null;
}

// グラフ表示用に時間を加工した型
interface ChartData extends FatigueLog {
  time: string;
}

export default function Dashboard({ token, logout, userId }: DashboardProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [currentStatus, setCurrentStatus] = useState<{
    label: string;
    color: 'default' | 'error' | 'warning' | 'success';
  }>({
    label: '取得中...',
    color: 'default',
  });

  const fetchData = useCallback(async () => {
    if (!userId) return;

    const now = new Date();
    const to = now.toISOString();
    const start = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    try {
      // API 0.1.0 仕様: GET /fatigue?u={userId}&f={start}&t={to}
      const res = await axios.get<FatigueListResponse>(`${API_URL}/fatigue`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { u: userId, f: start, t: to },
      });

      const logs = res.data.items || [];

      const formattedData: ChartData[] = logs
        .map((item) => ({
          ...item,
          time: new Date(item.recorded_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }))
        .reverse();

      setData(formattedData);

      if (formattedData.length > 0) {
        const latest = formattedData[formattedData.length - 1];
        // face_scoreに基づいた判定
        if (latest.face_score <= 30) {
          setCurrentStatus({ label: '危険 (休憩してください)', color: 'error' });
        } else if (latest.face_score <= 60) {
          setCurrentStatus({ label: '注意 (疲れが見えます)', color: 'warning' });
        } else {
          setCurrentStatus({ label: '良好 (正常です)', color: 'success' });
        }
      } else {
        setCurrentStatus({ label: 'データなし', color: 'default' });
      }
    } catch (error) {
      console.error('データ取得失敗', error);
    }
  }, [token, userId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            疲労モニタリングシステム
          </Typography>
          <Typography variant="caption" sx={{ mr: 2 }}>
            ID: {userId}
          </Typography>
          <Button color="inherit" onClick={logout}>
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box mb={4}>
          <Card>
            <CardContent
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Typography variant="h6">現在のコンディション</Typography>
              <Chip
                label={currentStatus.label}
                color={currentStatus.color}
                sx={{ fontSize: '1.2rem', p: 1 }}
              />
            </CardContent>
          </Card>
        </Box>

        <Paper elevation={3} sx={{ p: 3, height: 500 }}>
          <Typography variant="h6" gutterBottom>
            モニタリング推移
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="face_score"
                stroke="#ff5722"
                strokeWidth={3}
                name="顔スコア"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="voice_score"
                stroke="#8884d8"
                strokeWidth={2}
                name="声スコア"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Container>
    </Box>
  );
}
