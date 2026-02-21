import type Team from '../team';
import type User from '../user';

export default interface MeRes {
  user_data: User;
  user_teams: Team[];
}
