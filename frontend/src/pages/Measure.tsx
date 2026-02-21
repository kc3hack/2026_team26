import { Stop as StopIcon, Videocam as VideocamIcon } from '@mui/icons-material';
import { Box, Button, Chip, Container, Paper, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import API from '../lib/axios';
import type FatigueCreateReq from '../types/request/fatigueCreateReq';
import type FatigueCreateRes from '../types/response/fatigueCreateRes';

// 【修正】DUMMY_GAME_ID の定義を削除しました

interface MeasureProps {
  readonly userId: string | null;
}

export default function Measure(props: MeasureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [latestScore, setLatestScore] = useState<{ face: number; voice: number } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // ▼ カメラを起動する関数
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('カメラの起動に失敗しました:', err);
      alert('カメラを使用できません。ブラウザの許可設定を確認してください。');
    }
  };

  // ▼ カメラを停止する関数
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // ▼ 測定とデータ送信を行う関数
  const measureAndSend = useCallback(async () => {
    if (!props.userId) return;

    const dummyFaceScore = Math.floor(Math.random() * 100);
    const dummyVoiceScore = Math.floor(Math.random() * 100);

    setLatestScore({ face: dummyFaceScore, voice: dummyVoiceScore });

    try {
      // 【修正】変数reqを定義し、game_id を null に設定（Issue #38対応）
      const req: FatigueCreateReq = {
        user_id: props.userId,
        game_id: undefined, // DUMMY_GAME_ID を削除し、game_id を undefined に設定
        face_score: dummyFaceScore,
        voice_score: dummyVoiceScore,
        recorded_at: new Date().toISOString(),
      };

      await API.authClient().post<FatigueCreateRes>('/fatigue', req);

      const time = new Date().toLocaleTimeString();
      setLogs((prev) => [
        `[${time}] 送信成功: 顔${dummyFaceScore} / 声${dummyVoiceScore}`,
        ...prev.slice(0, 4),
      ]);
    } catch (error) {
      console.error('送信エラー:', error);
      setLogs((prev) => ['送信失敗...', ...prev.slice(0, 4)]);
    }
  }, [props.userId]);

  // ▼ 録画状態の管理
  useEffect(() => {
    let intervalId: number;

    if (isRecording) {
      startCamera();
      measureAndSend();
      intervalId = setInterval(measureAndSend, 5000) as unknown as number;
    } else {
      stopCamera();
    }

    return () => {
      clearInterval(intervalId);
      stopCamera();
    };
  }, [isRecording, measureAndSend]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        height: '100vh',
        bgcolor: '#282c34',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header title="疲労測定" showBackButton={true} />

      <Container
        maxWidth="xl"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 2,
        }}
      >
        {/* カメラ映像エリア */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: '1200px',
            aspectRatio: '16/9',
            bgcolor: 'black',
            borderRadius: 4,
            overflow: 'hidden',
            mb: 3,
            boxShadow: isRecording ? '0 0 20px #f44336' : '0 0 10px rgba(0,0,0,0.5)',
            transition: '0.3s',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: isRecording ? 1 : 0.3,
            }}
          />

          {/* 録画中のインジケータ */}
          {!isRecording && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h6" color="grey.500">
                待機中...
              </Typography>
            </Box>
          )}
          {isRecording && (
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
              <Chip label="LIVE REC" color="error" size="small" />
            </Box>
          )}
        </Box>

        {/* スコア表示 */}
        {latestScore && (
          <Box
            sx={{
              mb: 4,
              maxWidth: 800,
              width: '100%',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
            }}
          >
            <Paper
              sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
            >
              <Typography variant="caption">現在の顔スコア</Typography>
              <Typography
                variant="h3"
                color={latestScore.face < 30 ? 'error.main' : 'success.main'}
                sx={{ fontWeight: 'bold' }}
              >
                {latestScore.face}
              </Typography>
            </Paper>
            <Paper
              sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
            >
              <Typography variant="caption">現在の声スコア</Typography>
              <Typography variant="h3" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {latestScore.voice}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* 操作ボタン */}
        <Button
          variant="contained"
          color={isRecording ? 'error' : 'primary'}
          size="large"
          startIcon={isRecording ? <StopIcon /> : <VideocamIcon />}
          onClick={() => setIsRecording(!isRecording)}
          sx={{
            borderRadius: 50,
            px: 6,
            py: 2,
            fontSize: '1.2rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          {isRecording ? '測定を停止' : '測定を開始'}
        </Button>

        {/* 送信ログ */}
        <Box sx={{ mt: 4, width: '100%', maxWidth: 500 }}>
          {logs.map((log, i) => (
            <Typography key={i} variant="caption" display="block" color="grey.500" align="center">
              {log}
            </Typography>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
