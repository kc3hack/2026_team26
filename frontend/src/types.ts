// src/types.ts
export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
}

export interface FatigueLog {
  id: string;
  user_id: string;
  game_id: string;
  face_score: number;
  voice_score: number;
  recorded_at: string;
}

export interface FatigueListResponse {
  items: FatigueLog[];
}

export interface ApiErrorResponse {
  message: string;
  error?: string;
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

// --- チーム機能用の型定義 ---

// チームメンバーの情報
export interface TeamMember {
  user_id: string;
  display_name: string;
  latest_face_score?: number; // まだ測定していない場合は undefined
  latest_voice_score?: number;
  last_updated?: string;
}

// チーム自体の情報
export interface Team {
  id: string;
  name: string;
  invite_code: string; // 参加用のコード
  members: TeamMember[];
}

// チーム作成時のリクエスト
export interface CreateTeamRequest {
  name: string;
}

// チーム参加時のリクエスト
export interface JoinTeamRequest {
  invite_code: string;
}

// ログアウトを追加
export interface LogoutRequest {
  refresh_token: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}
