import { Avatar, Box, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useNavigate } from 'react-router-dom';

// 外部から受け取るデータの型
interface MenuCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  path: string;
}

export default function MenuCard({ title, description, icon, color, path }: MenuCardProps) {
  const navigate = useNavigate();

  return (
    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <Card
        elevation={4}
        sx={{
          height: '100%',
          transition: '0.3s',
          '&:hover': { transform: 'translateY(-5px)' },
        }}
      >
        <CardActionArea onClick={() => navigate(path)} sx={{ height: '100%', p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Avatar sx={{ bgcolor: color, width: 80, height: 80, mb: 3 }}>{icon}</Avatar>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom sx={{ fontWeight: 'bold' }}>
                {title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {description}
              </Typography>
            </CardContent>
          </Box>
        </CardActionArea>
      </Card>
    </Grid>
  );
}
