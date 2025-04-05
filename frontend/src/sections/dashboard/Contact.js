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
  Grid,
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
import { RemoveDirectConversation, RemoveGroupConversation } from "../../redux/slices/conversation";
import { socket } from "../../socket";
import styled from "@emotion/styled";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const BlockDialog = ({ open, handleClose }) => {
  const dispatch = useDispatch();
  const { chat_type } = useSelector((state) => state.app);
  const { direct_chat } = useSelector((state) => state.conversation);
  const current_conversation = direct_chat.current_conversation;
  const user_id = window.localStorage.getItem("user_id");

  const handleBlock = () => {
    if (current_conversation?.id) {
      socket.emit("block_user", {
        user_id: user_id,
        blocked_user_id: current_conversation.user_id
      }, (data) => {
        if (data.success) {
          // Remove conversation from Redux state
          dispatch(RemoveDirectConversation(current_conversation.id));
          
          // Close sidebar and go back to chat list
          dispatch(ToggleSidebar());
          dispatch(UpdateSidebarType("CONTACT"));
          
          // Show success notification (you can implement this with toast library)
          console.log("User blocked successfully");
        } else {
          console.error("Failed to block user:", data.error);
        }
      });
    }
    handleClose();
  };

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
          Are you sure you want to block this Contact? You won't receive messages from them anymore.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleBlock} color="error">Block</Button>
      </DialogActions>
    </Dialog>
  );
};

const DeleteChatDialog = ({ open, handleClose }) => {
  const dispatch = useDispatch();
  const { chat_type } = useSelector((state) => state.app);
  const { direct_chat } = useSelector((state) => state.conversation);
  const current_conversation = direct_chat.current_conversation;
  const user_id = window.localStorage.getItem("user_id");

  const handleDeleteChat = () => {
    if (current_conversation?.id) {
      socket.emit("delete_conversation", {
        user_id: user_id,
        conversation_id: current_conversation.id
      }, (data) => {
        if (data.success) {
          // Remove conversation from Redux state
          dispatch(RemoveDirectConversation(current_conversation.id));
          
          // Close sidebar and go back to chat list
          dispatch(ToggleSidebar());
          dispatch(UpdateSidebarType("CONTACT"));
          
          // Show success notification (you can implement this with toast library)
          console.log("Chat deleted successfully");
        } else {
          console.error("Failed to delete chat:", data.error);
        }
      });
    }
    handleClose();
  };

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
          Are you sure you want to delete this chat? This will remove all messages between you and {current_conversation?.name}.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleDeleteChat} color="error">Delete</Button>
      </DialogActions>
    </Dialog>
  );
};

const LeaveGroupDialog = ({ open, handleClose }) => {
  const dispatch = useDispatch();
  const { group_chat } = useSelector((state) => state.conversation);
  const current_conversation = group_chat.current_conversation;
  const user_id = window.localStorage.getItem("user_id");

  const handleLeaveGroup = () => {
    if (current_conversation?.id) {
      socket.emit("leave_group", {
        user_id: user_id,
        group_id: current_conversation.id
      }, (data) => {
        if (data.success) {
          // Remove group from Redux state
          dispatch(RemoveGroupConversation(current_conversation.id));
          
          // Close sidebar and go back to chat list
          dispatch(ToggleSidebar());
          dispatch(UpdateSidebarType("CONTACT"));
          
          // Show success notification (you can implement this with toast library)
          console.log("Left group successfully");
        } else {
          console.error("Failed to leave group:", data.error);
        }
      });
    }
    handleClose();
  };

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
          Are you sure you want to leave "{current_conversation?.name}"? You won't receive messages from this group anymore.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleLeaveGroup} color="error">Leave Group</Button>
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

  // Permission flag for admin features
  const canManageGroup = isGroupAdmin || isGroupCreator;

  return (
    <Box sx={{ 
      width: !isDesktop ? "100vw" : 320, 
      maxHeight: "100vh",
      boxShadow: theme.palette.mode === 'light' ? '0 0 16px rgba(0, 0, 0, 0.08)' : '0 0 16px rgba(0, 0, 0, 0.25)',
      backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper
    }}>
      <Stack sx={{ height: "100%" }}>
        <Box
          sx={{
            boxShadow: "0px 0px 4px rgba(0, 0, 0, 0.1)",
            width: "100%",
            backgroundColor:
              theme.palette.mode === "light"
                ? "#F8FAFF"
                : theme.palette.background.default,
            borderBottom: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <Stack
            sx={{ height: "100%", p: 2 }}
            direction="row"
            alignItems={"center"}
            justifyContent="space-between"
            spacing={3}
          >
            <Typography variant="subtitle2" fontWeight="bold">
              {chat_type === "individual" ? "Contact Info" : "Group Info"}
            </Typography>
            <IconButton
              onClick={() => {
                dispatch(ToggleSidebar());
              }}
              sx={{
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'
                }
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
            overflow: "auto",
            "&::-webkit-scrollbar": {
              width: "8px",
              borderRadius: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.mode === "light" 
                ? "rgba(0,0,0,0.2)" 
                : "rgba(255,255,255,0.2)",
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: theme.palette.mode === "light" 
                  ? "rgba(0,0,0,0.3)" 
                  : "rgba(255,255,255,0.3)",
              }
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
              borderRadius: "8px",
            },
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
                sx={{ 
                  height: 64, 
                  width: 64,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: `2px solid ${theme.palette.background.paper}`
                }}
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
          <Divider sx={{ 
            borderColor: theme.palette.mode === 'light' 
              ? 'rgba(0,0,0,0.08)' 
              : 'rgba(255,255,255,0.08)',
            width: '100%'
          }} />

          {/* About / Description */}
          <Stack spacing={0.5}>
            <Typography variant="article" fontWeight={600}>
              {chat_type === "individual" ? "About" : "Description"}
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight={500}
              sx={{
                backgroundColor: theme.palette.mode === 'light' 
                  ? 'rgba(0,0,0,0.02)' 
                  : 'rgba(255,255,255,0.02)',
                p: 1.5,
                borderRadius: 1,
              }}
            >
              {chat_type === "individual" 
                ? current_conversation?.about || "No about information"
                : current_conversation?.description || "No description available"
              }
            </Typography>
          </Stack>
          <Divider sx={{ 
            borderColor: theme.palette.mode === 'light' 
              ? 'rgba(0,0,0,0.08)' 
              : 'rgba(255,255,255,0.08)',
            width: '100%'
          }} />

          {/* Group Members (only for group chats) */}
          {chat_type === "group" && (
            <>
              <Stack spacing={1}>
                <Typography variant="article" fontWeight={600}>
                  Members
                </Typography>
                <List dense sx={{ 
                  width: '100%', 
                  maxHeight: 200, 
                  overflow: 'auto',
                  borderRadius: 1,
                  backgroundColor: theme.palette.mode === 'light' 
                    ? 'rgba(0,0,0,0.02)' 
                    : 'rgba(255,255,255,0.02)',
                  padding: 1,
                  "&::-webkit-scrollbar": {
                    width: "6px",
                    borderRadius: "6px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: theme.palette.mode === "light" 
                      ? "rgba(0,0,0,0.2)" 
                      : "rgba(255,255,255,0.2)",
                    borderRadius: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "transparent",
                  },
                  // Special styling for admin view
                  border: canManageGroup ? `1px solid ${theme.palette.primary.main}` : 'none',
                }}>
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
              <Divider sx={{ 
                borderColor: theme.palette.mode === 'light' 
                  ? 'rgba(0,0,0,0.08)' 
                  : 'rgba(255,255,255,0.08)',
                width: '100%'
              }} />
            </>
          )}

          {/* Shared Media */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent={"space-between"}
            sx={{
              backgroundColor: theme.palette.mode === 'light' 
                ? 'rgba(0,0,0,0.02)' 
                : 'rgba(255,255,255,0.02)',
              p: 1.5,
              borderRadius: 1,
            }}
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
          <Divider sx={{ 
            borderColor: theme.palette.mode === 'light' 
              ? 'rgba(0,0,0,0.08)' 
              : 'rgba(255,255,255,0.08)',
            width: '100%'
          }} />

          {/* Starred Messages */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent={"space-between"}
            sx={{
              backgroundColor: theme.palette.mode === 'light' 
                ? 'rgba(0,0,0,0.02)' 
                : 'rgba(255,255,255,0.02)',
              p: 1.5,
              borderRadius: 1,
            }}
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
          <Divider sx={{ 
            borderColor: theme.palette.mode === 'light' 
              ? 'rgba(0,0,0,0.08)' 
              : 'rgba(255,255,255,0.08)',
            width: '100%'
          }} />

          {/* Mute Notifications */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent={"space-between"}
            sx={{
              backgroundColor: theme.palette.mode === 'light' 
                ? 'rgba(0,0,0,0.02)' 
                : 'rgba(255,255,255,0.02)',
              p: 1.5,
              borderRadius: 1,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Bell size={21} />
              <Typography variant="subtitle2">Mute Notifications</Typography>
            </Stack>
            <AntSwitch />
          </Stack>
          <Divider sx={{ 
            borderColor: theme.palette.mode === 'light' 
              ? 'rgba(0,0,0,0.08)' 
              : 'rgba(255,255,255,0.08)',
            width: '100%'
          }} />

          {/* Common Groups (only for individual chats) */}
          {chat_type === "individual" && (
            <>
              <Typography variant="body2">
                {(() => {
                  try {
                    // Safety checks
                    if (!group_chat || !group_chat.conversations || !Array.isArray(group_chat.conversations) || !current_conversation) {
                      return "0 groups in common";
                    }
                    
                    // Count common groups
                    const count = group_chat.conversations.filter(group => 
                      group && group.members && Array.isArray(group.members) && 
                      group.members.some(member => member && member.id === current_conversation.user_id)
                    ).length;
                    
                    return `${count} ${count === 1 ? 'group' : 'groups'} in common`;
                  } catch (error) {
                    console.error("Error counting common groups:", error);
                    return "0 groups in common";
                  }
                })()}
              </Typography>
              
              {(() => {
                try {
                  // Safety checks
                  if (!group_chat || !group_chat.conversations || !Array.isArray(group_chat.conversations) || !current_conversation) {
                    return (
                      <Typography variant="body2" color="text.secondary">
                        No groups in common
                      </Typography>
                    );
                  }
                  
                  // Find common groups safely
                  const commonGroups = group_chat.conversations.filter(group => 
                    group && group.members && Array.isArray(group.members) && 
                    group.members.some(member => member && member.id === current_conversation.user_id)
                  );
                  
                  if (commonGroups.length === 0) {
                    return (
                      <Typography variant="body2" color="text.secondary">
                        No groups in common
                      </Typography>
                    );
                  }
                  
                  return (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      {commonGroups.map((group) => (
                        <Stack 
                          key={group.id} 
                          direction="row" 
                          alignItems={"center"} 
                          spacing={2}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            backgroundColor: theme.palette.mode === 'light' 
                              ? 'rgba(0,0,0,0.02)' 
                              : 'rgba(255,255,255,0.02)',
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'light' 
                                ? 'rgba(0,0,0,0.04)' 
                                : 'rgba(255,255,255,0.04)',
                              cursor: 'pointer'
                            },
                            transition: 'background-color 0.2s ease-in-out'
                          }}
                        >
                          <Avatar 
                            src={group.img} 
                            alt={group.name}
                            sx={{ 
                              width: 40, 
                              height: 40,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              border: `2px solid ${theme.palette.background.paper}`
                            }} 
                          />
                          <Stack direction="column" spacing={0.5} sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" noWrap>{group.name || "Unnamed Group"}</Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {(() => {
                                if (!group.members || !Array.isArray(group.members)) return "No members";
                                const memberNames = group.members
                                  .slice(0, 3)
                                  .filter(member => member && member.name)
                                  .map(member => member.name);
                                
                                return memberNames.join(', ') + 
                                  (group.members.length > 3 ? `, +${group.members.length - 3} more` : '');
                              })()}
                            </Typography>
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  );
                } catch (error) {
                  console.error("Error rendering common groups:", error);
                  return (
                    <Typography variant="body2" color="text.secondary">
                      Unable to display common groups
                    </Typography>
                  );
                }
              })()}
              <Divider sx={{ 
                borderColor: theme.palette.mode === 'light' 
                  ? 'rgba(0,0,0,0.08)' 
                  : 'rgba(255,255,255,0.08)',
                width: '100%'
              }} />
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
                  sx={{
                    borderRadius: 1.5,
                    py: 1,
                    color: theme.palette.error.main,
                    borderColor: theme.palette.error.main,
                    '&:hover': {
                      backgroundColor: `${theme.palette.error.lighter} !important`,
                      borderColor: theme.palette.error.main
                    }
                  }}
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
                  sx={{
                    borderRadius: 1.5,
                    py: 1,
                    borderColor: theme.palette.grey[500],
                    '&:hover': {
                      backgroundColor: `${theme.palette.grey[100]} !important`,
                      borderColor: theme.palette.grey[600]
                    }
                  }}
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
                sx={{
                  borderRadius: 1.5,
                  py: 1,
                  '&:hover': {
                    backgroundColor: `${theme.palette.error.lighter} !important`,
                    borderColor: theme.palette.error.main
                  }
                }}
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
