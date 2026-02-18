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
