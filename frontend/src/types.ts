// ==========================================
// 共通エラーレスポンス
// ==========================================
export interface ApiErrorResponse {
  message: string;
  error?: string;
}

// ==========================================
// ユーザー機能関連 (User)
// ==========================================
export interface User {
  id: string;
  email?: string;
  display_name: string; // name から修正
  created_at: string; // 追加
}

// ==========================================
// チーム機能関連 (Team)
// ==========================================
export interface TeamData {
  id: string;
  name: string;
  created_at: string;
  created_by?: string;
}

export interface TeamCreateRequest {
  name: string;
}

export interface TeamCreateResponse extends TeamData {}

export interface TeamJoinRequest {
  team_tag: string; // 仕様書に合わせて invite_code から team_tag に変更
}

export interface TeamJoinResponse extends TeamData {}

export interface TeamLeaveRequest {
  team_id: string;
}

export interface FatigueLog {
  id: string;
  user_id: string;
  game_id: string | null; // 追加
  face_score: number; // fatigue_level から修正
  voice_score: number; // 追加
  recorded_at: string;
}

export interface TeamFatigueResponse {
  team_data: TeamData;
  team_user: User[];
  fatigue_logs: {
    [userId: string]: FatigueLog[]; // ユーザーIDをキーにした疲労度ログの配列
  };
}
