import {
  AddAPhoto as AddAPhotoIcon,
  BarChart as BarChartIcon,
  Groups as GroupsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  CssBaseline,
  Toolbar,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid'; // この書き方を維持
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const theme = createTheme({
  palette: {
    primary: { main: '#667eea' },
  },
  shape: { borderRadius: 16 },
});

interface MenuProps {
  readonly logout: () => void;
}

export default function Menu(props: MenuProps) {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: '自分のこれまでのデータを見る',
      description: '過去の疲労スコアの推移をグラフで確認します',
      icon: <BarChartIcon sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      path: '/dashboard',
    },
    {
      title: 'チーム',
      description: 'チームメンバーの状況や共有データを確認します',
      icon: <GroupsIcon sx={{ fontSize: 40 }} />,
      color: '#2196f3',
      path: '/team',
    },
    {
      title: '疲労を測定する',
      description: 'カメラとマイクを使って現在の疲労度を測定します',
      icon: <AddAPhotoIcon sx={{ fontSize: 40 }} />,
      color: '#ff9800',
      path: '/measure',
    },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            疲労モニタリングアプリ
          </Typography>
          <Button color="inherit" onClick={props.logout} startIcon={<LogoutIcon />}>
            ログアウト
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)',
          bgcolor: '#f5f7fa',
          pt: 8,
          pb: 8,
        }}
      >
        {/* 【修正】maxWidth="xl" にして大画面対応 */}
        <Container maxWidth="xl">
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 6 }}>
            メインメニュー
          </Typography>

          {/* 【修正】justifyContent="center" を追加 */}
          <Grid container spacing={4} justifyContent="center">
            {menuItems.map((item) => (
              // 【修正】sizeプロパティを使ってレスポンシブ設定 (lgを追加)
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.title}>
                <Card
                  elevation={4}
                  sx={{
                    height: '100%',
                    transition: '0.3s',
                    '&:hover': { transform: 'translateY(-5px)' },
                  }}
                >
                  {/* 【修正】paddingを p: 3 に増やしてゆとりを持たせる */}
                  <CardActionArea onClick={() => navigate(item.path)} sx={{ height: '100%', p: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                      }}
                    >
                      {/* 【修正】Avatarサイズを少し大きく (70->80) */}
                      <Avatar sx={{ bgcolor: item.color, width: 80, height: 80, mb: 3 }}>
                        {item.icon}
                      </Avatar>
                      <CardContent>
                        {/* 【修正】タイトルをh5にして少し大きく */}
                        <Typography
                          variant="h5"
                          component="div"
                          gutterBottom
                          sx={{ fontWeight: 'bold' }}
                        >
                          {item.title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {item.description}
                        </Typography>
                      </CardContent>
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
