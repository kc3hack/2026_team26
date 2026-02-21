import { Box, Typography } from '@mui/material';
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

// データの型定義
export interface ChartData {
  time: string;
  face_score: number;
  voice_score: number;
}

interface FatigueChartProps {
  data: ChartData[];
}

export default function FatigueChart({ data }: FatigueChartProps) {
  // データが空の場合の表示
  if (data.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: 'center' }}>
        <Typography color="text.secondary" variant="h6">
          まだ疲労度の記録がありません。
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 400, mt: 4 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
  );
}
