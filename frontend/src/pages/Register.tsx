import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
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
import apiClient from '../lib/axios';
import type SignupReq from '../types/request/signupReq';
import type ApiErrorResponse from '../types/response/errorRes';
import type SignupRes from '../types/response/signupRes';

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

interface RegisterProps {
  readonly setUserId: (_userId: string) => void;
  readonly setRefreshToken: (_refreshToken: string) => void;
}

export default function Register(props: RegisterProps) {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username || !email || !password) {
      setErrorMsg('すべての項目を入力してください');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const req: SignupReq = {
      email: email,
      password: password,
      display_name: username,
    };
    try {
      const res = await apiClient.post<SignupRes>('/auth/signup', req);
      const data = res.data;
      // access_token is set as HttpOnly cookie by server; keep refresh token and user id
      props.setRefreshToken(data.refresh_token || '');
      props.setUserId(data.user.id);
      alert('登録完了！ログイン画面へ移動します。');
      navigate('/login');
    } catch (error) {
      console.error('登録エラー:', error);
      let message = '登録に失敗しました。';

      if (axios.isAxiosError(error) && error.response) {
        const errData = error.response.data as ApiErrorResponse;
        if (errData?.message) {
          message = errData.message;
        }
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
          padding: 2,
        }}
      >
        <Paper
          elevation={12}
          sx={{ display: 'flex', maxWidth: 1000, width: '100%', height: 600, overflow: 'hidden' }}
        >
          <Grid
            container
            sx={{
              width: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              p: 4,
            }}
          >
            <MonitorHeartIcon sx={{ fontSize: 100, mb: 2, opacity: 0.9 }} />
            <Typography
              variant="h4"
              component="div"
              sx={{ mb: 1, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
            >
              Join Us
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.8, textAlign: 'center' }}>
              アカウントを作成して、
              <br />
              コンディション管理を始めましょう
            </Typography>
          </Grid>
          <Box
            sx={{
              width: { xs: '100%', md: '50%' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 4,
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: '#764ba2' }}>
              <PersonAddAlt1Icon />
            </Avatar>
            <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
              新規アカウント作成
            </Typography>
            {errorMsg && (
              <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                {errorMsg}
              </Alert>
            )}
            <Box
              component="form"
              onSubmit={handleRegister}
              noValidate
              sx={{ width: '100%', maxWidth: 320 }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="ユーザー名 (表示名)"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="メールアドレス"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="パスワード"
                type="password"
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  height: 50,
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
                }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'アカウント作成'}
              </Button>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/login')}
                  sx={{ textDecoration: 'none', fontWeight: 'bold', color: 'primary.main' }}
                >
                  すでにアカウントをお持ちの方はこちら
                </Link>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
