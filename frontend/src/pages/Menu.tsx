import { Logout as LogoutIcon } from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  Toolbar,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import MenuCard from '../components/MenuCard';
import { menuItems } from '../components/menuData';

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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          position: 'absolute',
          top: 0,
          left: 0,
          bgcolor: '#f5f7fa',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AppBar position="static" elevation={0} sx={{ bgcolor: '#667eea' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              疲労モニタリングアプリ
            </Typography>
            <Button color="inherit" onClick={props.logout} startIcon={<LogoutIcon />}>
              ログアウト
            </Button>
          </Toolbar>
        </AppBar>

        {/* 【修正】元のコードではこのBoxがすぐ閉じられていましたが、
          Containerを中に入れることで「画面の中央配置」が正しく効くようになります！
        */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pb: 10,
          }}
        >
          <Container maxWidth="xl">
            <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 6 }}>
              メインメニュー
            </Typography>

            <Grid container spacing={4} justifyContent="center">
              {/* ▼ 魔法のループ処理！ ▼ */}
              {menuItems.map((item, index) => (
                <MenuCard
                  key={index}
                  title={item.title}
                  description={item.description}
                  icon={item.icon}
                  color={item.color}
                  path={item.path}
                />
              ))}
            </Grid>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
