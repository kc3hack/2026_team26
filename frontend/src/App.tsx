import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function App() {
  // トークンを保存する場所（リロードしても消えないようにlocalStorageを使うと良いが、今回は簡易的にStateで）
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('user_id'));
  // トークンが変更されたら保存
  useEffect(() => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }, [token]);
  useEffect(() => {
    if (userId) {
      localStorage.setItem('user_id', userId);
    } else {
      localStorage.removeItem('user_id');
    }
  }, [userId]);

  const logout = () => {
    setToken(null);
    setUserId(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* トークンがあればダッシュボード、なければログイン画面へ */}
        <Route
          path="/"
          element={
            token ? (
              <Dashboard token={token} logout={logout} userId={userId} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* ログイン画面 */}
        <Route path="/login" element={<Login setToken={setToken} setUserId={setUserId} />} />

        {/* 新規登録画面 */}
        <Route path="/register" element={<Register setUserId={setUserId} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
