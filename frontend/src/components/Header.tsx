import { ArrowBack as ArrowBackIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { AppBar, Button, IconButton, Toolbar, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// ▼ 外から受け取る「設定スイッチ（Props）」を定義
interface HeaderProps {
  title?: string;             // ヘッダーのタイトル（省略時はデフォルト値が入る）
  showBackButton?: boolean;   // 「戻る」ボタンを表示するか？ (true/false)
  showLogoutButton?: boolean; // 「ログアウト」ボタンを表示するか？ (true/false)
  onLogout?: () => void;      // ログアウト時の処理
  backPath?: string;          // 戻るボタンを押した時の移動先（デフォルトは '/'）
}

export default function Header({
  title = '疲労モニタリングアプリ', // デフォルトのタイトル
  showBackButton = false,       // デフォルトは非表示
  showLogoutButton = false,     // デフォルトは非表示
  onLogout,
  backPath = '/',
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: '#667eea' }}>
      <Toolbar>

        {/* ▼ showBackButton が true の時だけ「戻る」ボタンを表示 */}
        {showBackButton && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(backPath)}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}

        {/* ▼ タイトル */}
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          {title}
        </Typography>

        {/* ▼ showLogoutButton が true かつ onLogout関数 が渡された時だけ「ログアウト」ボタンを表示 */}
        {showLogoutButton && onLogout && (
          <Button color="inherit" onClick={onLogout} startIcon={<LogoutIcon />}>
            ログアウト
          </Button>
        )}

      </Toolbar>
    </AppBar>
  );
}
