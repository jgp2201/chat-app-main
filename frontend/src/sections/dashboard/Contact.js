import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Typography,
  Slide,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  AvatarGroup,
} from "@mui/material";
import {
  Bell,
  CaretRight,
  Phone,
  Prohibit,
  Star,
  Trash,
  VideoCamera,
  X,
  Users,
  Crown,
} from "phosphor-react";
import useResponsive from "../../hooks/useResponsive";
import AntSwitch from "../../components/AntSwitch";
import { useDispatch, useSelector } from "react-redux";
import { ToggleSidebar, UpdateSidebarType } from "../../redux/slices/app";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const BlockDialog = ({ open, handleClose }) => {
  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleClose}
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle>Block this contact</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-slide-description">
          Are you sure you want to block this Contact?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleClose}>Yes</Button>
      </DialogActions>
    </Dialog>
  );
};

const DeleteChatDialog = ({ open, handleClose }) => {
  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleClose}
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle>Delete this chat</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-slide-description">
          Are you sure you want to delete this chat?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleClose}>Yes</Button>
      </DialogActions>
    </Dialog>
  );
};

const LeaveGroupDialog = ({ open, handleClose }) => {
  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleClose}
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle>Leave this group</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-slide-description">
          Are you sure you want to leave this group?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleClose}>Yes</Button>
      </DialogActions>
    </Dialog>
  );
};

const Contact = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDesktop = useResponsive("up", "md");

  const [openBlock, setOpenBlock] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openLeaveGroup, setOpenLeaveGroup] = useState(false);

  const handleCloseBlock = () => {
    setOpenBlock(false);
  };
  
  const handleCloseDelete = () => {
    setOpenDelete(false);
  };
  
  const handleCloseLeaveGroup = () => {
    setOpenLeaveGroup(false);
  };

  // Get chat type and current conversation
  const { chat_type } = useSelector((state) => state.app);
  const { direct_chat, group_chat } = useSelector((state) => state.conversation);
  const user_id = window.localStorage.getItem("user_id");
  
  // Get the correct conversation based on chat type
  const current_conversation = chat_type === "individual" 
    ? direct_chat.current_conversation 
    : group_chat.current_conversation;
  
  // Get current messages based on chat type
  const current_messages = chat_type === "individual" 
    ? direct_chat.current_messages 
    : group_chat.current_messages;
    
  // Filter messages based on subtypes
  const mediaMessages = current_messages.filter((msg) => msg.type === "msg" && msg.subtype === "Media");
  const linkMessages = current_messages.filter((msg) => msg.type === "msg" && msg.subtype === "Link");
  const docMessages = current_messages.filter((msg) => msg.type === "msg" && msg.subtype === "Document");

  // Check if the current user is an admin in the group
  const isGroupAdmin = chat_type === "group" && current_conversation?.admins?.includes(user_id);
  const isGroupCreator = chat_type === "group" && current_conversation?.created_by === user_id;

  return (
    <Box sx={{ width: !isDesktop ? "100vw" : 320, maxHeight: "100vh" }}>
      <Stack sx={{ height: "100%" }}>
        <Box
          sx={{
            boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
            width: "100%",
            backgroundColor:
              theme.palette.mode === "light"
                ? "#F8FAFF"
                : theme.palette.background,
          }}
        >
          <Stack
            sx={{ height: "100%", p: 2 }}
            direction="row"
            alignItems={"center"}
            justifyContent="space-between"
            spacing={3}
          >
            <Typography variant="subtitle2">
              {chat_type === "individual" ? "Contact Info" : "Group Info"}
            </Typography>
            <IconButton
              onClick={() => {
                dispatch(ToggleSidebar());
              }}
            >
              <X />
            </IconButton>
          </Stack>
        </Box>
        <Stack
          sx={{
            height: "100%",
            position: "relative",
            flexGrow: 1,
            overflow: "scroll",
          }}
          p={3}
          spacing={3}
        >
          {/* Profile Section */}
          <Stack alignItems="center" direction="row" spacing={2}>
            {chat_type === "individual" ? (
              // Individual contact avatar
              <Avatar
                src={current_conversation?.img}
                alt={current_conversation?.name}
                sx={{ height: 64, width: 64 }}
              />
            ) : (
              // Group avatar or avatar group
              current_conversation?.members?.length > 3 ? (
                <Avatar
                  src={current_conversation?.img}
                  alt={current_conversation?.name}
                  sx={{ height: 64, width: 64 }}
                />
              ) : (
                <AvatarGroup max={3} sx={{ height: 64 }}>
                  {current_conversation?.members?.map((member) => (
                    <Avatar 
                      key={member.id} 
                      src={member.img} 
                      alt={member.name} 
                    />
                  ))}
                </AvatarGroup>
              )
            )}
            <Stack spacing={0.5}>
              <Typography variant="article" fontWeight={600}>
                {current_conversation?.name}
              </Typography>
              {chat_type === "individual" && (
                <Typography variant="body2" fontWeight={500}>
                  {current_conversation?.online ? "Online" : "Offline"}
                </Typography>
              )}
              {chat_type === "group" && (
                <Typography variant="body2" fontWeight={500}>
                  {current_conversation?.members?.length || 0} members
                </Typography>
              )}
            </Stack>
          </Stack>

          {/* Call Actions (only for individual chats) */}
          {chat_type === "individual" && (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent={"space-evenly"}
            >
              <Stack alignItems={"center"} spacing={1}>
                <IconButton>
                  <Phone />
                </IconButton>
                <Typography variant="overline">Voice</Typography>
              </Stack>
              <Stack alignItems={"center"} spacing={1}>
                <IconButton>
                  <VideoCamera />
                </IconButton>
                <Typography variant="overline">Video</Typography>
              </Stack>
            </Stack>
          )}
          <Divider />

          {/* About / Description */}
          <Stack spacing={0.5}>
            <Typography variant="article" fontWeight={600}>
              {chat_type === "individual" ? "About" : "Description"}
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {chat_type === "individual" 
                ? current_conversation?.about || "No about information"
                : current_conversation?.description || "No description available"
              }
            </Typography>
          </Stack>
          <Divider />

          {/* Group Members (only for group chats) */}
          {chat_type === "group" && (
            <>
              <Stack spacing={1}>
                <Typography variant="article" fontWeight={600}>
                  Members
                </Typography>
                <List dense sx={{ width: '100%', maxHeight: 200, overflow: 'auto' }}>
                  {current_conversation?.members?.map((member) => (
                    <ListItem key={member.id} alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar alt={member.name} src={member.img} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="subtitle2">
                              {member.name}
                            </Typography>
                            {current_conversation?.created_by === member.id && (
                              <Crown size={16} weight="fill" color={theme.palette.warning.main} />
                            )}
                            {current_conversation?.admins?.includes(member.id) && !
                              (current_conversation?.created_by === member.id) && (
                              <Typography variant="caption" color="primary">
                                Admin
                              </Typography>
                            )}
                          </Stack>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Stack>
              <Divider />
            </>
          )}

          {/* Shared Media */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent={"space-between"}
          >
            <Typography variant="subtitle2">Media, Links & Docs</Typography>
            <Button
              onClick={() => {
                dispatch(UpdateSidebarType("SHARED"));
              }}
              endIcon={<CaretRight />}
            >
              {linkMessages.length + mediaMessages.length + docMessages.length}
            </Button>
          </Stack>
          <Divider />

          {/* Starred Messages */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent={"space-between"}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Star size={21} />
              <Typography variant="subtitle2">Starred Messages</Typography>
            </Stack>

            <IconButton
              onClick={() => {
                dispatch(UpdateSidebarType("STARRED"));
              }}
            >
              <CaretRight />
            </IconButton>
          </Stack>
          <Divider />

          {/* Mute Notifications */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent={"space-between"}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Bell size={21} />
              <Typography variant="subtitle2">Mute Notifications</Typography>
            </Stack>
            <AntSwitch />
          </Stack>
          <Divider />

          {/* Common Groups (only for individual chats) */}
          {chat_type === "individual" && (
            <>
              <Typography variant="body2">1 group in common</Typography>
              <Stack direction="row" alignItems={"center"} spacing={2}>
                <Avatar alt="Group Member" />
                <Stack direction="column" spacing={0.5}>
                  <Typography variant="subtitle2">Camel's Gang</Typography>
                  <Typography variant="caption">
                    Owl, Parrot, Rabbit, You
                  </Typography>
                </Stack>
              </Stack>
              <Divider />
            </>
          )}

          {/* Action Buttons */}
          <Stack direction="row" alignItems={"center"} spacing={2}>
            {chat_type === "individual" ? (
              // Individual chat actions
              <>
                <Button
                  onClick={() => {
                    setOpenBlock(true);
                  }}
                  fullWidth
                  startIcon={<Prohibit />}
                  variant="outlined"
                >
                  Block
                </Button>
                <Button
                  onClick={() => {
                    setOpenDelete(true);
                  }}
                  fullWidth
                  startIcon={<Trash />}
                  variant="outlined"
                >
                  Delete
                </Button>
              </>
            ) : (
              // Group chat actions
              <Button
                onClick={() => {
                  setOpenLeaveGroup(true);
                }}
                fullWidth
                color="error"
                startIcon={<Users />}
                variant="outlined"
              >
                Leave Group
              </Button>
            )}
          </Stack>
        </Stack>
      </Stack>
      {openBlock && <BlockDialog open={openBlock} handleClose={handleCloseBlock} />}
      {openDelete && <DeleteChatDialog open={openDelete} handleClose={handleCloseDelete} />}
      {openLeaveGroup && <LeaveGroupDialog open={openLeaveGroup} handleClose={handleCloseLeaveGroup} />}
    </Box>
  );
};

export default Contact;
