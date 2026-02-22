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

type Props = {
  teamData: TeamFatigueRes
}

export default function TeamFatigueChart(props: Props) {
  if (!props.teamData || !props.teamData.team_user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timeMap = new Map<string, any>();

  props.teamData.team_user.forEach((user) => {
    const logs = props.teamData.fatigue_logs[user.id] || [];
    logs.forEach((log) => {
      const date = new Date(log.recorded_at);
      const timeKey = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, { time: timeKey, timestamp: date.getTime() }); // timestamp(数値)も保持
      }

      const entry = timeMap.get(timeKey)!;

      const face = log.face_score ?? 0;
      const voice = log.voice_score ?? 0;
      entry[user.display_name] = (face + voice) / 2;
    });
  });

  const chartData = Array.from(timeMap.values()).sort((a, b) => a.timestamp - b.timestamp);

  if (chartData.length === 0) {
    return (
      <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          <Typography color="text.secondary">まだグラフに表示する疲労度データがありません。</Typography>
        </CardContent>
      </Card>
    );
  }

  // ▼ 追加: 数値(ミリ秒)を「2/22 9:57」の表示に戻す関数
  const formatTime = (unixTime: number) => {
    const d = new Date(unixTime);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

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

              {/* ▼ 修正: X軸を timestamp(数値) に変更し、時間幅を正確にする */}
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                scale="time"
                tickFormatter={(value) => formatTime(value as number)}
              />
              <YAxis domain={[0, 100]} />

              {/* ▼ 修正: ツールチップの表示も日時に戻す */}
              <Tooltip labelFormatter={(label) => formatTime(label as number)} />

              <Legend />
              {props.teamData.team_user.map((user, index) => (
                <Line
                  key={user.id}
                  type="monotone"
                  dataKey={user.display_name}
                  name={user.display_name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
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
