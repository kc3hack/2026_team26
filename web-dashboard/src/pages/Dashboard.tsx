import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Container, Typography, Box, Paper, AppBar, Toolbar, Button, Card, CardContent, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://test.sheeplab.net/api';

interface DashboardProps {
  token: string;
  logout: () => void;
  userId: string | null;
}

export default function Dashboard({ token, logout, userId }: DashboardProps) {
  const [data, setData] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState({ label: '取得中...', color: 'default' });
  const navigate = useNavigate();

  // データの取得と状態判定
  const fetchData = async () => {
    // userIdがない間は実行しない
    if (!userId) return;

    const now = new Date();
    const to = now.toISOString();
    const start = new Date(now.getTime() - 60 * 60 * 1000).toISOString(); // 1時間前

    try {
      // 修正1: axiosのparamsを使用してクエリパラメータを渡す
      const res = await axios.get(`${API_URL}/fatigue`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          u: userId,
          f: start,
          t: to
        }
      });
      
      // 修正2: データは res.data.items に入っている (OpenAPI仕様)
      // データがない場合は空配列にする
      const logs = res.data.items || [];

      const formattedData = logs.map((item: any) => ({
        ...item,
        time: new Date(item.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })).reverse(); // 古い順に並び替え
      
      setData(formattedData);

      // 修正3: 最新データに基づいてステータス判定 (項目名を face_score に変更)
      if (formattedData.length > 0) {
        const latest = formattedData[formattedData.length - 1];
        
        // face_score は「元気度」か「疲労度」かによりますが、
        // 今回は「高いほどスコアが良い（目が開いている）」と仮定した場合のロジック
        // ※もし「高いほど疲れている」なら不等号を逆にしてください
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
      // エラーが出てもすぐにログアウトさせないほうが開発中は便利です
      // logout(); 
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  // 修正4: userId がロードされたタイミングで再実行するために依存配列に追加
  }, [userId]); 

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
          <Button color="inherit" onClick={logout}>ログアウト</Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" style={{ marginTop: '30px' }}>
        
        {/* ステータスカード */}
        <Box mb={4}>
          <Card>
            <CardContent style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">現在のコンディション</Typography>
              <Chip 
                label={currentStatus.label} 
                color={currentStatus.color as any} 
                style={{ fontSize: '1.2rem', padding: '10px' }} 
              />
            </CardContent>
          </Card>
        </Box>

        {/* グラフエリア */}
        <Paper elevation={3} style={{ padding: '20px', height: '500px' }}>
          <Typography variant="h6" gutterBottom>モニタリング推移</Typography>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              {/* 修正5: グラフのデータキーを新しいAPI仕様に合わせる */}
              <Line type="monotone" dataKey="face_score" stroke="#ff5722" strokeWidth={3} name="顔スコア" />
              <Line type="monotone" dataKey="voice_score" stroke="#8884d8" strokeWidth={2} name="声スコア" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

      </Container>
    </Box>
  );
}