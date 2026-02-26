import {
  Box,
  Avatar,
  Typography,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Email as EmailIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { useState } from "react";

interface GroupHeaderProps {
  group: {
    name: string;
    description?: string;
    category?: string;
  };
  userRole: string;
  categories: Array<{ value: string; label: string }>;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onInviteMember: () => void;
  onGenerateInviteLink: () => void;
}

export function GroupHeader({
  group,
  userRole,
  categories,
  onBack,
  onEdit,
  onDelete,
  onInviteMember,
  onGenerateInviteLink,
}: GroupHeaderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [inviteAnchorEl, setInviteAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const open = Boolean(anchorEl);
  const inviteOpen = Boolean(inviteAnchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleInviteClick = (event: React.MouseEvent<HTMLElement>) => {
    setInviteAnchorEl(event.currentTarget);
  };

  const handleInviteClose = () => {
    setInviteAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit();
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete();
  };

  const handleInviteByEmail = () => {
    handleInviteClose();
    onInviteMember();
  };

  const handleGenerateLink = () => {
    handleInviteClose();
    onGenerateInviteLink();
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <IconButton onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar
          sx={{
            width: { xs: 48, md: 56 },
            height: { xs: 48, md: 56 },
            bgcolor: "primary.main",
          }}
        >
          {group.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant={isMobile ? "h5" : "h4"}
              component="h1"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {group.name}
            </Typography>
            {group.category && (
              <Chip
                label={
                  categories.find((c) => c.value === group.category)?.label ||
                  "Outros"
                }
                color="primary"
                variant="outlined"
                size={isMobile ? "small" : "medium"}
              />
            )}
          </Box>
          {group.description && !isMobile && (
            <Typography
              color="text.secondary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {group.description}
            </Typography>
          )}
        </Box>
        {userRole === "admin" && (
          <>
            {isMobile ? (
              // Mobile: Botão Convidar + Menu de 3 pontos
              <Box sx={{ display: "flex", gap: 1 }}>
                <IconButton
                  color="primary"
                  onClick={handleInviteClick}
                  sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                  }}
                >
                  <PersonAddIcon />
                </IconButton>
                <IconButton onClick={handleMenuClick}>
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                >
                  <MenuItem onClick={handleEdit}>
                    <ListItemIcon>
                      <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Editar</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText sx={{ color: "error.main" }}>
                      Excluir
                    </ListItemText>
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              // Desktop: Botões normais
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={onEdit}
                >
                  Editar
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={onDelete}
                >
                  Excluir
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={handleInviteClick}
                >
                  Convidar
                </Button>
              </Box>
            )}
            {/* Menu/Dialog de convite - Desktop usa Menu, Mobile usa Dialog */}
            {isMobile ? (
              <Dialog
                open={inviteOpen}
                onClose={handleInviteClose}
                fullWidth
                maxWidth="xs"
              >
                <DialogTitle>Convidar para o grupo</DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                  <List>
                    <ListItemButton onClick={handleGenerateLink}>
                      <ListItemIcon>
                        <LinkIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Gerar Link de Convite"
                        secondary="Compartilhe o link com qualquer pessoa"
                      />
                    </ListItemButton>
                    <ListItemButton onClick={handleInviteByEmail}>
                      <ListItemIcon>
                        <EmailIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Adicionar por Email"
                        secondary="Digite o email do membro"
                      />
                    </ListItemButton>
                  </List>
                </DialogContent>
              </Dialog>
            ) : (
              <Menu
                anchorEl={inviteAnchorEl}
                open={inviteOpen}
                onClose={handleInviteClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                <MenuItem onClick={handleGenerateLink}>
                  <ListItemIcon>
                    <LinkIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Gerar Link de Convite</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleInviteByEmail}>
                  <ListItemIcon>
                    <EmailIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Adicionar por Email</ListItemText>
                </MenuItem>
              </Menu>
            )}
          </>
        )}
      </Box>
      {group.description && isMobile && (
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{
            pl: { xs: 7, sm: 8 },
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {group.description}
        </Typography>
      )}
    </Box>
  );
}
