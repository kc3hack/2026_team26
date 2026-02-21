import BarChartIcon from '@mui/icons-material/BarChart';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import GroupIcon from '@mui/icons-material/Group';

export const menuItems = [
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
    icon: <GroupIcon sx={{ fontSize: 40 }} />,
    color: '#2196f3', // 青
    path: '/team',
  },
  {
    title: '疲労を測定する',
    description: 'カメラとマイクを使って現在の疲労度を測定します',
    icon: <CameraAltIcon sx={{ fontSize: 40 }} />,
    color: '#ff9800', // オレンジ
    path: '/measure',
  },
];
