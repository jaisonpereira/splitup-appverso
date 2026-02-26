import {
  Card,
  CardContent,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Chip,
} from "@mui/material";
import {
  People as PeopleIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface MembersListProps {
  members: Member[];
  userRole: string;
  onRemoveMember: (memberId: string) => void;
}

export function MembersList({
  members,
  userRole,
  onRemoveMember,
}: MembersListProps) {
  return (
    <Card className="glass-card" sx={{ flex: 1 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <PeopleIcon />
          <Typography variant="h6" fontWeight="600">
            Membros ({members.length})
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <List>
          {members.map((member) => (
            <ListItem
              key={member.user.id}
              secondaryAction={
                userRole === "admin" && member.role !== "admin" ? (
                  <IconButton
                    edge="end"
                    onClick={() => onRemoveMember(member.user.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                ) : null
              }
            >
              <ListItemAvatar>
                <Avatar>{member.user.name.charAt(0).toUpperCase()}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {member.user.name}
                    {member.role === "admin" && (
                      <Chip label="Admin" size="small" color="primary" />
                    )}
                  </Box>
                }
                secondary={member.user.email}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
