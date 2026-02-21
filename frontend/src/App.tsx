import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Measure from './pages/Measure';
import Menu from './pages/Menu';
import Register from './pages/Register';
import TeamPage from './pages/Team';
import type RefreshReq from './types/request/refreshReq'; // パスは適宜調整してください
import type RefreshRes from './types/response/refreshRes'; // ※以前作成したレスポンス型
// ▼▼▼ 型定義をインポート (LogoutRequestを追加) ▼▼▼
import type LogoutRequest from './types/request/logoutReq';

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

  const logout = useCallback(async () => {
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
  }, [refreshToken]);

  // =========================================================================
  // ▼▼ ここから追加: トークン自動更新の「検問所（インターセプター）」 ▼▼
  // =========================================================================
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response, // 成功時はそのまま通す
      async (error) => {
        const originalRequest = error.config;

        // 401（認証エラー）で、かつ「まだリフレッシュを試していない」場合
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true; // 無限ループ防止フラグ

          // リフレッシュトークンがない場合は諦めてログアウト
          if (!refreshToken) {
            await logout();
            return Promise.reject(error);
          }

          try {
            // 1. バックエンドに新しいトークンを要求
            const reqBody: RefreshReq = { refresh_token: refreshToken };
            const refreshRes = await axios.post<RefreshRes>(`${API_URL}/auth/refresh`, reqBody, {
              withCredentials: true // HttpOnly Cookie対応用
            });

            const newAccessToken = refreshRes.data.access_token;
            const newRefreshToken = refreshRes.data.refresh_token;

            // 2. 新しいトークンをStateに保存
            // （※上のuseEffectが連動して自動でlocalStorageも更新してくれます！）
            setToken(newAccessToken);
            setRefreshToken(newRefreshToken);

            // 3. 失敗した元のリクエストのヘッダーを「新しいトークン」に書き換える
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            // 4. 新しいトークンを使って、さっき失敗した通信をやり直す！
            return axios(originalRequest);

          } catch (refreshError) {
            // リフレッシュ自体が失敗した場合（リフレッシュの期限切れなど）
            console.error('トークンの自動更新に失敗しました', refreshError);
            await logout();
            return Promise.reject(refreshError);
          }
        }

        // 401以外のエラーはそのまま投げる
        return Promise.reject(error);
      }
    );

    // クリーンアップ（コンポーネント再描画時に古い検問所を破棄）
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [refreshToken]);
  // ▲▲ 追加ここまで ▲▲

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
