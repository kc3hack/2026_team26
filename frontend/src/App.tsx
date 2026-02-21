import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Measure from './pages/Measure';
import Menu from './pages/Menu';
import Register from './pages/Register';
import TeamPage from './pages/Team';
// ▼▼▼ 型定義をインポート (LogoutRequestを追加) ▼▼▼
import apiClient from './lib/axios';
import type LogoutRequest from './types/request/logoutReq';

function App() {
  // トークン管理 (access_token と refresh_token 両方を保存)
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem('refresh_token'),
  );
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('user_id'));

  // リフレッシュトークン保存処理
  useEffect(() => {
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    else localStorage.removeItem('refresh_token');
  }, [refreshToken]);

  useEffect(() => {
    if (userId) localStorage.setItem('user_id', userId);
    else localStorage.removeItem('user_id');
  }, [userId]);

  const logout = async () => {
    try {
      // サーバーにログアウト通知を送る (refresh_tokenを送付)
      if (refreshToken) {
        const req: LogoutRequest = {
          refresh_token: refreshToken,
        };

        await apiClient.post('/auth/logout', req);
      }
    } catch (error) {
      console.error('ログアウトAPIの呼び出しに失敗しましたが、ローカルデータは削除します', error);
    } finally {
      // 成功・失敗に関わらずローカル情報は消す
      setRefreshToken(null);
      setUserId(null);
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={userId ? <Menu logout={logout} /> : <Navigate to="/login" />} />

        <Route
          path="/dashboard"
          element={
            userId ? <Dashboard logout={logout} userId={userId} /> : <Navigate to="/login" />
          }
        />

        <Route
          path="/measure"
          element={userId ? <Measure userId={userId} /> : <Navigate to="/login" />}
        />

        <Route
          path="/team"
          element={userId ? <TeamPage userId={userId} /> : <Navigate to="/login" />}
        />
        {/* ▼▼ 追加: 招待URL用の動的ルーティング ▼▼ */}
        <Route
          path="/invite/:inviteCode"
          element={userId ? <TeamPage userId={userId} /> : <Navigate to="/login" />}
        />

        {/* Loginコンポーネントに setRefreshToken も渡す */}
        <Route
          path="/login"
          element={<Login setRefreshToken={setRefreshToken} setUserId={setUserId} />}
        />
        <Route
          path="/register"
          element={<Register setRefreshToken={setRefreshToken} setUserId={setUserId} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
