import axios from 'axios';
import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Measure from './pages/Measure';
import Menu from './pages/Menu';
import Register from './pages/Register';
import TeamPage from './pages/Team';
// ▼▼▼ 型定義をインポート (LogoutRequestを追加) ▼▼▼
import type { LogoutRequest } from './types';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'https://test.sheeplab.net/api';

function App() {
  // トークン管理 (access_token と refresh_token 両方を保存)
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem('refresh_token'),
  );
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('user_id'));

  // トークン保存処理
  useEffect(() => {
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }, [token]);

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

        await axios.post(`${API_URL}/auth/logout`, req);
      }
    } catch (error) {
      console.error('ログアウトAPIの呼び出しに失敗しましたが、ローカルデータは削除します', error);
    } finally {
      // 成功・失敗に関わらずローカル情報は消す
      setToken(null);
      setRefreshToken(null);
      setUserId(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={token ? <Menu logout={logout} /> : <Navigate to="/login" />} />

        <Route
          path="/dashboard"
          element={
            token ? (
              <Dashboard token={token} logout={logout} userId={userId} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/measure"
          element={token ? <Measure token={token} userId={userId} /> : <Navigate to="/login" />}
        />

        <Route
          path="/team"
          element={
            token && userId ? <TeamPage token={token} userId={userId} /> : <Navigate to="/login" />
          }
        />
        {/* ▼▼ 追加: 招待URL用の動的ルーティング ▼▼ */}
        <Route
        path="/invite/:inviteCode"
        element={
        token && userId ? <TeamPage token={token} userId={userId} /> : <Navigate to="/login" />
        }
        />

        {/* Loginコンポーネントに setRefreshToken も渡す */}
        <Route
          path="/login"
          element={
            <Login setToken={setToken} setRefreshToken={setRefreshToken} setUserId={setUserId} />
          }
        />
        <Route
          path="/register"
          element={
            <Register
              setAccessToken={setToken}
              setRefreshToken={setRefreshToken}
              setUserId={setUserId}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
