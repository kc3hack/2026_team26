// ==========================================
// 共通エラーレスポンス
// ==========================================
export interface ApiErrorResponse {
  message: string;
  error?: string;
}

// ==========================================
// チーム機能関連 (Team)
// ==========================================
export interface TeamMember {
  user_id: string;
  display_name: string;
  latest_face_score?: number; // まだ測定していない場合は undefined
  latest_voice_score?: number;
  last_updated?: string;
}

export interface Team {
  id: string;
  name: string;
  invite_code: string; // 参加用のコード
  members: TeamMember[];
}

export interface CreateTeamRequest {
  name: string;
}

export interface JoinTeamRequest {
  invite_code: string;
}
