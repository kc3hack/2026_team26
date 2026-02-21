import { Box, Card, CardContent, Typography } from '@mui/material';
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
import type TeamFatigueRes from '../types/response/teamFatigueRes';

// メンバーごとのグラフ線の色（最大7色、それ以上はループ）
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042'];

export default function TeamFatigueChart(props: TeamFatigueRes) {
  // 1. バラバラの記録時間をひとつの時系列データにまとめる処理
  const timeMap = new Map<string, any>();

  props.team_user.forEach((user) => {
    const logs = props.fatigue_logs[user.id] || [];
    logs.forEach((log) => {
      const date = new Date(log.recorded_at);
      // X軸の表示用（例: 2/22 10:00）
      const timeKey = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, { time: timeKey, timestamp: date.getTime() });
      }

      const entry = timeMap.get(timeKey);

      // 今回は顔スコアと声スコアの平均値をグラフに描画します
      const face = log.face_score ?? 0;
      const voice = log.voice_score ?? 0;
      entry[user.display_name] = (face + voice) / 2;
    });
  });

  // 時間順（古い順）に並べ替え
  const chartData = Array.from(timeMap.values()).sort((a, b) => a.timestamp - b.timestamp);

  // データが1つもない場合は何も表示しない
  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom color="text.secondary">
          チーム全体の疲労度推移
        </Typography>
        <Box sx={{ width: '100%', height: 350, mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              {props.team_user.map((user, index) => (
                <Line
                  key={user.id}
                  type="monotone"
                  dataKey={user.display_name}
                  name={user.display_name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  // ▼ メンバーによって記録時間が違っても、線を途切れさせずに繋ぐ魔法の設定 ▼
                  connectNulls={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
