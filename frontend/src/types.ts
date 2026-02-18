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
