import { useState } from 'react';
import axios from 'axios';
import { 
  TextField, Button, Typography, Paper, Box, Link, 
  Avatar, CssBaseline, Grid, CircularProgress, Alert
} from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'; // 登録用アイコン
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

interface RegisterProps {
  setUserId?: (userId: string) => void;
}

export default function Register({ setUserId }: RegisterProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!username || !email || !password) {
      setErrorMsg('すべての項目を入力してください');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await axios.post(`${API_URL}/auth/signup`, { 
        email: email, 
        password: password,
        display_name: username 
      });
      
      // 登録成功時はアラートではなく、少し待ってから遷移させると親切ですが、今回はシンプルに
      alert('登録完了！ログイン画面へ移動します。');
      navigate('/login'); 
      
    } catch (error: any) {
      console.error("登録エラー:", error);
      const message = error.response?.data?.message || '登録に失敗しました。メールアドレスが既に使用されている可能性があります。';
      setErrorMsg(message);
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
          {/* 【左側】ビジュアルエリア（ログイン画面と統一） */}
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
            <Typography variant="h5" component="div" sx={{ mb: 1, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              お前も健康にならないか？
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.8, textAlign: 'center' }}>
              アカウントを作成して、<br/>コンディション管理を始めましょう
            </Typography>
          </Grid>

          {/* 【右側】新規登録フォーム */}
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
            <Avatar sx={{ m: 1, bgcolor: '#764ba2' }}> {/* 色を少し変えて区別 */}
              <PersonAddAlt1Icon />
            </Avatar>
            <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
              新規アカウント作成
            </Typography>

            {errorMsg && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{errorMsg}</Alert>}

            <Box component="form" onSubmit={handleRegister} noValidate sx={{ width: '100%', maxWidth: 320 }}>
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
                  mt: 3, mb: 2, height: 50, fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)' // グラデーションの向きを逆にしてみる
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