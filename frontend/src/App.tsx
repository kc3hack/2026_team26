import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import API from './lib/axios';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Login from './pages/Login';
import Measure from './pages/Measure';
import Menu from './pages/Menu';
import Register from './pages/Register';
import TeamPage from './pages/Team';
// ▼▼▼ 型定義をインポート (LogoutRequestを追加) ▼▼▼

function App() {
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('user_id'));

  useEffect(() => {
    if (userId) localStorage.setItem('user_id', userId);
    else localStorage.removeItem('user_id');
  }, [userId]);

  const logout = async () => {
    try {
      await API.logout();
    } catch (error) {
      console.error('ログアウトAPIの呼び出しに失敗しましたが、ローカルデータは削除します', error);
    } finally {
      // 成功・失敗に関わらずローカル情報は消す
      setUserId(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={userId ? <Menu logout={logout} /> : <Navigate to="/login" />} />

        <Route path="/dashboard" element={userId ? <Dashboard /> : <Navigate to="/login" />} />

        <Route path="/history" element={userId ? <History /> : <Navigate to="/login" />} />

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
        <Route path="/login" element={<Login setUserId={setUserId} />} />
        <Route path="/register" element={<Register setUserId={setUserId} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
