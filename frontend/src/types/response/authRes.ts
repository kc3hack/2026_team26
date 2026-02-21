import type User from '../user';

export default interface AuthRes {
  user: User;
  access_token: string;
  refresh_token?: string;
}
