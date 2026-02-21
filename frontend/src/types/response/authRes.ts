import type User from '../user';

export default interface AuthRes {
  user: User;
  refresh_token?: string;
}
