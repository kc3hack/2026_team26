import { useState } from 'react';
import axios from 'axios';
import { 
  TextField, Button, Typography, Paper, Box, Link, 
  Avatar, CssBaseline, Grid, CircularProgress, Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://test.sheeplab.net/api';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea', 
    },
    secondary: {
      main: '#764ba2', 
    },
  },
  typography: {
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 16,
  }
});

interface LoginProps {
  setToken: (token: string) => void;
  setUserId: (userId: string) => void;
}

export default function Login({ setToken, setUserId }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await axios.post(`${API_URL}/auth/signin`, { email, password });
      setToken(res.data.access_token);
      setUserId(res.data.user.id);
      navigate('/'); 
    } catch (error) {
      console.error(error);
      setErrorMsg('メールアドレスまたはパスワードが正しくありません。');
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* 背景全体 */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f0f2f5',
          padding: 2
        }}
      >
        {/* 横長の大きなカード */}
        <Paper
          elevation={12}
          sx={{
            display: 'flex',
            maxWidth: 1000,
            width: '100%',
            height: 600,
            overflow: 'hidden',
          }}
        >
          {/* 【左側】ビジュアルエリア */}
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
              p: 4
            }}
          >
            <MonitorHeartIcon sx={{ fontSize: 100, mb: 2, opacity: 0.9 }} />
            <Typography variant="h4" component="div" sx={{ mb: 1, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              はよ寝ろくん
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.8, textAlign: 'center' }}>
              リアルタイム疲労検知＆<br/>モニタリングシステム
            </Typography>
          </Grid>

          {/* 【右側】ログインフォーム */}
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
            <Avatar sx={{ m: 1, bgcolor: '#667eea' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
              ログイン
            </Typography>

            {errorMsg && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{errorMsg}</Alert>}

            <Box component="form" onSubmit={handleLogin} sx={{ width: '100%', maxWidth: 320 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="メールアドレス"
                name="email"
                autoComplete="email"
                autoFocus
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, height: 50, fontWeight: 'bold' }}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'ログイン'}
              </Button>
              
              {/* ▼ここを修正しました：新規登録画面へのリンク */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Link 
                  component="button" 
                  variant="body2" 
                  onClick={() => navigate('/register')}
                  sx={{ textDecoration: 'none', fontWeight: 'bold', color: 'primary.main' }}
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