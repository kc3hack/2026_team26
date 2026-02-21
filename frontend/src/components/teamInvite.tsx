import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, Chip, Typography } from "@mui/material";
import { useState } from "react";
import type TeamInviteReq from "../types/request/teamInviteReq";
import type TeamInviteRes from "../types/response/teamInviteRes";

type Props = {
  team_id: string
  apiInvite: (_req: TeamInviteReq) => Promise<TeamInviteRes>
}

const TeamInvite = (props: Props) => {
  const [teamInvite, setTeamInvite] = useState<TeamInviteRes | undefined>(undefined)

  const invite = async () => {
    const req: TeamInviteReq = {
      team_id: props.team_id
    }
    const res = await props.apiInvite(req);
    setTeamInvite(res);
  }

  // ▼ 招待コードのコピー
  const copyCode = () => {
    if (teamInvite) {
      navigator.clipboard.writeText(teamInvite.invite_code);
      alert('招待コードをコピーしました');
    }
  }
  if (teamInvite) {
    return (
      <Box>
        <Typography variant="caption" display="block" color="text.secondary">
          招待コード
        </Typography>
        <Chip
          label={teamInvite.invite_code}
          onDelete={copyCode}
          deleteIcon={<ContentCopyIcon />}
          sx={{ fontWeight: 'bold', fontSize: '1.1rem', py: 2 }}
        />
      </Box>
    );
  }
  return (
    <Box>
      <Typography variant="caption" display="block" color="text.secondary">
        招待コード発行する
      </Typography>
      <AddIcon
        onClick={() => { console.log("CLICK"); invite() }}
      />
    </Box>
  )
}

export default TeamInvite;
