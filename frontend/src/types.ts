// ==========================================
// 共通エラーレスポンス
// ==========================================
export interface ApiErrorResponse {
  message: string;
  error?: string;
}

// ==========================================
// ユーザー・認証関連 (Auth)
// ==========================================
export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

// ==========================================
// 疲労モニタリング関連 (Fatigue)
// ==========================================
export interface FatigueLog {
  id: string;
  user_id: string;
  game_id: string | null;
  face_score: number;
  voice_score: number;
  recorded_at: string;
}

export interface FatigueListResponse {
  items: FatigueLog[];
}

export interface FatigueCreateRequest {
  user_id: string;
  game_id?: string | null;
  face_score: number;
  voice_score: number;
  recorded_at: string;
}

export interface FatigueCreateResponse {
  id: string;
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
