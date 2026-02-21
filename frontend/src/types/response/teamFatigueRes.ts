import type FatigueLog from "../fatigueLog";
import type Team from "../team";
import type User from "../user";

export default interface TeamFatigueRes {
  team_user: User[];
  team_data: Team;
  fatigue_logs: {
    [user_id: string]: FatigueLog[];
  };
}

