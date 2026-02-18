import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  Grid,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ApiErrorResponse, AuthResponse } from '../types';

const API_URL = 'https://test.sheeplab.net/api';

const theme = createTheme({
  palette: {
    primary: { main: '#667eea' },
    secondary: { main: '#764ba2' },
  },
  typography: {
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
  },
  shape: { borderRadius: 16 },
});

// Propsの定義を更新
interface LoginProps {
  setToken: (_token: string) => void;
  setRefreshToken: (_refreshToken: string) => void; // 追加
  setUserId: (_userId: string) => void;
}

export default function Login({ setToken, setRefreshToken, setUserId }: LoginProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await axios.post<AuthResponse>(`${API_URL}/auth/signin`, { email, password });
      setToken(res.data.access_token);
      setRefreshToken(res.data.refresh_token || ''); // refresh_tokenを保存
      setUserId(res.data.user.id);
      navigate('/');
    } catch (error) {
      console.error(error);
      let message = 'メールアドレスまたはパスワードが正しくありません。';

      if (axios.isAxiosError(error) && error.response) {
        const errData = error.response.data as ApiErrorResponse;
        if (errData && errData.message) message = errData.message;
      }

      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f0f2f5',
          p: { xs: 2, md: 4 }, // スマホとPCで余白を変える
        }}
      >
        <Paper
          elevation={12}
          sx={{
            display: 'flex',
            // 【修正】PCフルサイズ対応: 幅を広げ、高さを増やす
            maxWidth: 'xl',
            width: '100%',
            // スマホは中身に合わせて伸縮(auto)、PCは固定高さ(700px)で迫力を出す
            minHeight: { xs: 'auto', md: '80vh' },
            overflow: 'hidden',
            flexDirection: { xs: 'column', md: 'row' }, // スマホは縦並び、PCは横並び
          }}
        >
          {/* 左側：ビジュアルエリア (スマホでは非表示) */}
          <Grid
            container
            sx={{
              // 【修正】PCの大画面では画像エリアを広め(55-60%)にとる
              width: { xs: '100%', md: '55%', lg: '60%' },
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: { xs: 'none', md: 'flex' }, // スマホでは隠す
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              p: 4,
              position: 'relative',
            }}
          >
            {/* 装飾用の円 (薄く背景に入れる) */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                left: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.1)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 50,
                right: -50,
                width: 300,
                height: 300,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.05)',
              }}
            />

            <MonitorHeartIcon sx={{ fontSize: { md: 100, lg: 120 }, mb: 3, opacity: 0.9 }} />
            <Typography
              variant="h3" // 文字サイズを大きく
              component="div"
              sx={{ mb: 2, textShadow: '0 2px 4px rgba(0,0,0,0.2)', fontWeight: 800 }}
            >
              はよ寝ろくん
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, textAlign: 'center', lineHeight: 1.6 }}>
              リアルタイム疲労検知＆
              <br />
              モニタリングシステム
            </Typography>
          </Grid>

          {/* 右側：入力フォームエリア */}
          <Box
            sx={{
              // 【修正】残りの幅を使う
              width: { xs: '100%', md: '45%', lg: '40%' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: { xs: 4, md: 6, lg: 8 }, // PCでは内側の余白をたっぷりとる
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: '#667eea', width: 56, height: 56 }}>
              <LockOutlinedIcon fontSize="large" />
            </Avatar>
            <Typography
              component="h1"
              variant="h4"
              sx={{ mb: 4, fontWeight: 'bold', color: '#333' }}
            >
              ログイン
            </Typography>

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
                {errorMsg}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin} sx={{ width: '100%', maxWidth: 400 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                // PCで見やすいように入力欄の高さを調整
                InputProps={{ sx: { height: 56, fontSize: '1.1rem' } }}
                InputLabelProps={{ sx: { fontSize: '1rem' } }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="パスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{ sx: { height: 56, fontSize: '1.1rem' } }}
                InputLabelProps={{ sx: { fontSize: '1rem' } }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 4, mb: 3, height: 56, fontSize: '1.1rem', fontWeight: 'bold' }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={28} color="inherit" /> : 'ログイン'}
              </Button>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Link
                  component="button"
                  variant="body1"
                  onClick={() => navigate('/register')}
                  sx={{
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    color: 'primary.main',
                    fontSize: '1rem',
                  }}
                >
                  新しいアカウントを作成
                </Link>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
