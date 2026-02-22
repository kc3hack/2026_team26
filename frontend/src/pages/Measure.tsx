import SendIcon from '@mui/icons-material/Send';
import {
  Alert,
  Box,
  Button,
  Card, CardContent,
  CircularProgress,
  Container,
  Paper,
  Slider,
  Stack,
  Typography
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
// ▼ 修正: 標準のaxiosではなく、設定済みのapiClientを読み込む
import API from '../lib/axios';

// ▼ 修正: App.tsxでtokenを渡さなくなったので削除
interface MeasureProps {
  userId: string | null;
}

export default function Measure({ userId }: MeasureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- 疲労スコアの状態管理 ---
  const [faceScore, setFaceScore] = useState<number>(50);
  const [voiceScore, setVoiceScore] = useState<number>(50);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraReady(true);
        }
      } catch (err) {
        console.error("Camera Error:", err);
        setError("カメラまたはマイクの起動に失敗しました。");
      }
    };
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  // --- データを送信する関数 ---
  // --- データを送信する関数 ---
  const handleSubmit = async () => {
    if (!userId) {
      setError("ユーザーIDが見つかりません。再ログインしてください。");
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        user_id: userId,
        face_score: faceScore,
        voice_score: voiceScore,
      };

      // 🌟 Team.tsx と同じ「特製APIクライアント」を使用！
      let res = await API.authClient().post('/fatigue', payload);

      // 🌟 トークンが切れていた場合はリフレッシュして再トライ！
      if (res.status === 401) {
        await API.tokenRefresh();
        res = await API.authClient().post('/fatigue', payload);
      }

      setSuccessMsg("測定データを保存しました！ダッシュボードを確認してください。");
    } catch (err) {
      console.error("Submit Error:", err);
      setError("データの保存に失敗しました。");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', pb: 10, width: '100vw', position: 'absolute', top: 0, left: 0, overflowX: 'hidden' }}>
      <Header title="疲労測定" showBackButton={true} />

      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          現在の自分をスキャン
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}

        <Paper elevation={6} sx={{ position: 'relative', borderRadius: 4, overflow: 'hidden', bgcolor: '#000', aspectRatio: '16/9', mb: 4 }}>
          {!isCameraReady && (
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' }}>
              <CircularProgress color="inherit" />
            </Box>
          )}
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        </Paper>

        {/* --- 手動入力セクション --- */}
        <Card elevation={3} sx={{ borderRadius: 4, p: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
              手動スコア調整（デバッグ用）
            </Typography>

            <Stack spacing={4} sx={{ mt: 2, px: 2 }}>
              <Box>
                <Typography gutterBottom align="left">顔の疲労度: <strong>{faceScore}</strong></Typography>
                <Slider
                  value={faceScore}
                  onChange={(_, val) => setFaceScore(val as number)}
                  valueLabelDisplay="auto"
                  color="secondary"
                />
              </Box>

              <Box>
                <Typography gutterBottom align="left">声の疲労度: <strong>{voiceScore}</strong></Typography>
                <Slider
                  value={voiceScore}
                  onChange={(_, val) => setVoiceScore(val as number)}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Button
                variant="contained"
                size="large"
                startIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                onClick={handleSubmit}
                disabled={!isCameraReady || isSending}
                sx={{ py: 1.5, borderRadius: 3, fontWeight: 'bold' }}
              >
                {isSending ? '送信中...' : '測定結果を送信'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
