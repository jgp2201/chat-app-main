import React, { useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Divider,
  Fade,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  styled,
  Typography,
  AvatarGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Slide,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CaretDown, MagnifyingGlass, Phone, VideoCamera, Users, ArrowClockwise, Translate } from "phosphor-react";
import useResponsive from "../../hooks/useResponsive";
import { ToggleSidebar, UpdateSidebarType } from "../../redux/slices/app";
import { useDispatch, useSelector } from "react-redux";
import { StartAudioCall } from "../../redux/slices/audioCall";
import { StartVideoCall } from "../../redux/slices/videoCall";
import { 
  RemoveDirectConversation, 
  RemoveGroupConversation,
  ClearDirectMessages,
  ClearGroupMessages
} from "../../redux/slices/conversation";
import { socket } from "../../socket";
import WallpaperDialog from "../../sections/dashboard/Settings/WallpaperDialog";
import { FetchCurrentMessages, FetchGroupMessages } from "../../redux/slices/conversation";
import TranslationDialog from "./TranslationDialog";

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Conversation_Menu = [
  {
    title: "Contact info",
  },
  {
    title: "Chat Wallpaper",
  },
  {
    title: "Clear messages",
  },
  {
    title: "Delete chat",
  },
];

const Group_Menu = [
  {
    title: "Group info",
  },
  {
    title: "Chat Wallpaper",
  },
  {
    title: "Clear messages",
  },
  {
    title: "Leave group",
  },
];

const ChatHeader = () => {
  const dispatch = useDispatch();
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const theme = useTheme();
  
  const { chat_type } = useSelector((state) => state.app);
  const { direct_chat, group_chat } = useSelector((state) => state.conversation);
  const user_id = window.localStorage.getItem("user_id");
  
  // Dialog states
  const [openClearMessages, setOpenClearMessages] = useState(false);
  const [openDeleteChat, setOpenDeleteChat] = useState(false);
  const [openLeaveGroup, setOpenLeaveGroup] = useState(false);
  const [openWallpaper, setOpenWallpaper] = useState(false);
  const [openTranslationDialog, setOpenTranslationDialog] = useState(false);
  
  // Get the correct conversation based on chat type
  const current_conversation = chat_type === "individual" 
    ? direct_chat.current_conversation 
    : group_chat.current_conversation;

  const [conversationMenuAnchorEl, setConversationMenuAnchorEl] =
    React.useState(null);
  const openConversationMenu = Boolean(conversationMenuAnchorEl);
  const handleClickConversationMenu = (event) => {
    setConversationMenuAnchorEl(event.currentTarget);
  };
  const handleCloseConversationMenu = () => {
    setConversationMenuAnchorEl(null);
  };
  
  // Get the appropriate menu based on chat type
  const menuItems = chat_type === "individual" ? Conversation_Menu : Group_Menu;
  
  // Handle menu item click
  const handleMenuItemClick = (title) => {
    handleCloseConversationMenu();
    
    if (title === "Contact info" || title === "Group info") {
      dispatch(ToggleSidebar());
      dispatch(UpdateSidebarType("CONTACT"));
    } else if (title === "Chat Wallpaper") {
      setOpenWallpaper(true);
    } else if (title === "Clear messages") {
      setOpenClearMessages(true);
    } else if (title === "Delete chat") {
      setOpenDeleteChat(true);
    } else if (title === "Leave group") {
      setOpenLeaveGroup(true);
    }
  };
  
  // Handle clear messages
  const handleClearMessages = () => {
    if (current_conversation?.id) {
      const eventName = chat_type === "individual" ? "clear_messages" : "clear_group_messages";
      const dataObj = chat_type === "individual" 
        ? { user_id, conversation_id: current_conversation.id }
        : { user_id, group_id: current_conversation.id };
        
      socket.emit(eventName, dataObj, (data) => {
        if (data.success) {
          // Update Redux state based on chat type
          if (chat_type === "individual") {
            dispatch(ClearDirectMessages(current_conversation.id));
          } else {
            dispatch(ClearGroupMessages(current_conversation.id));
          }
          console.log(`${chat_type} messages cleared successfully`);
        } else {
          console.error(`Failed to clear ${chat_type} messages:`, data.error);
        }
      });
    }
    setOpenClearMessages(false);
  };
  
  // Handle delete chat
  const handleDeleteChat = () => {
    if (current_conversation?.id) {
      socket.emit("delete_conversation", {
        user_id,
        conversation_id: current_conversation.id
      }, (data) => {
        if (data.success) {
          dispatch(RemoveDirectConversation(current_conversation.id));
          console.log("Chat deleted successfully");
        } else {
          console.error("Failed to delete chat:", data.error);
        }
      });
    }
    setOpenDeleteChat(false);
  };
  
  // Handle leave group
  const handleLeaveGroup = () => {
    if (current_conversation?.id) {
      socket.emit("leave_group", {
        user_id,
        group_id: current_conversation.id
      }, (data) => {
        if (data.success) {
          dispatch(RemoveGroupConversation(current_conversation.id));
          console.log("Left group successfully");
        } else {
          console.error("Failed to leave group:", data.error);
        }
      });
    }
    setOpenLeaveGroup(false);
  };

  return (
    <Box
      p={2}
      sx={{
        width: "100%",
        backgroundColor:
          theme.palette.mode === "light"
            ? "#F8FAFF"
            : theme.palette.background.paper,
        boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
      }}
    >
      <Stack
        alignItems={"center"}
        direction="row"
        justifyContent={"space-between"}
        sx={{ width: "100%", height: "100%" }}
      >
        <Stack direction="row" alignItems={"center"} spacing={2}>
          {chat_type === "individual" ? (
            // For individual chats
            <Box>
              <StyledBadge
                overlap="circular"
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                variant={current_conversation?.online ? "dot" : "standard"}
              >
                <Avatar
                  alt={current_conversation?.name}
                  src={current_conversation?.img}
                />
              </StyledBadge>
            </Box>
          ) : (
            // For group chats
            <Box>
              {current_conversation?.members?.length > 2 ? (
                <AvatarGroup max={3} sx={{ cursor: "pointer" }}>
                  {current_conversation?.members?.map((member) => (
                    <Avatar key={member.id} src={member.img} alt={member.name} />
                  ))}
                </AvatarGroup>
              ) : (
                <Avatar
                  alt={current_conversation?.name}
                  src={current_conversation?.img}
                />
              )}
            </Box>
          )}
          <Stack spacing={0.2}>
            <Typography variant="subtitle2">
              {current_conversation?.name}
            </Typography>
            {chat_type === "individual" && current_conversation &&
              <Typography variant="caption">{current_conversation.online ? "Online" : "Offline"}</Typography>
            }
            {chat_type === "group" && current_conversation &&
              <Typography variant="caption">{current_conversation.members?.length || 0} members</Typography>
            }
          </Stack>
        </Stack>
        <Stack direction="row" alignItems={"center"} spacing={3}>
          <IconButton onClick={() => socket.emit("get_messages", { conversation_id: current_conversation?.id }, (data) => {
            console.log("Refreshed messages:", data);
            if (chat_type === "individual") {
              dispatch(FetchCurrentMessages({ messages: data }));
            } else {
              if (data?.messages) {
                dispatch(FetchGroupMessages({ messages: data.messages }));
              }
            }
          })} sx={{ color: theme.palette.primary.main }}>
            <ArrowClockwise size={24} />
          </IconButton>
          
          {chat_type === "individual" && (
            <>
              <IconButton onClick={() => {
                dispatch(StartVideoCall(current_conversation.user_id));
              }} sx={{ color: theme.palette.primary.main }}>
                <VideoCamera size={24} />
              </IconButton>
              <IconButton
                onClick={() => {
                  dispatch(StartAudioCall(current_conversation.user_id));
                }}
                sx={{ color: theme.palette.primary.main }}
              >
                <Phone size={24} />
              </IconButton>
            </>
          )}
          
          {!isMobile && (
            <Tooltip title="Translate messages">
              <IconButton 
                onClick={() => setOpenTranslationDialog(true)}
                sx={{ color: theme.palette.primary.main }}
              >
                <Translate size={24} />
              </IconButton>
            </Tooltip>
          )}
          <Divider orientation="vertical" flexItem />
          <IconButton
            id="conversation-positioned-button"
            aria-controls={
              openConversationMenu
                ? "conversation-positioned-menu"
                : undefined
            }
            aria-haspopup="true"
            aria-expanded={openConversationMenu ? "true" : undefined}
            onClick={handleClickConversationMenu}
          >
            <CaretDown />
          </IconButton>
          <Menu
            MenuListProps={{
              "aria-labelledby": "fade-button",
            }}
            TransitionComponent={Fade}
            id="conversation-positioned-menu"
            aria-labelledby="conversation-positioned-button"
            anchorEl={conversationMenuAnchorEl}
            open={openConversationMenu}
            onClose={handleCloseConversationMenu}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <Box p={1}>
              <Stack spacing={1}>
                {menuItems.map((el, index) => (
                  <MenuItem key={index} onClick={() => handleMenuItemClick(el.title)}>
                    <Stack
                      sx={{ minWidth: 100 }}
                      direction="row"
                      alignItems={"center"}
                      justifyContent="space-between"
                    >
                      <span>{el.title}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Stack>
            </Box>
          </Menu>
        </Stack>
      </Stack>
      
      {/* Clear Messages Dialog */}
      <Dialog
        open={openClearMessages}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setOpenClearMessages(false)}
        aria-describedby="clear-messages-dialog"
      >
        <DialogTitle>Clear all messages</DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-messages-dialog">
            Are you sure you want to clear all messages? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClearMessages(false)}>Cancel</Button>
          <Button onClick={handleClearMessages} color="error">Clear</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Chat Dialog */}
      <Dialog
        open={openDeleteChat}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setOpenDeleteChat(false)}
        aria-describedby="delete-chat-dialog"
      >
        <DialogTitle>Delete this chat</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-chat-dialog">
            Are you sure you want to delete this chat? All messages will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteChat(false)}>Cancel</Button>
          <Button onClick={handleDeleteChat} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      
      {/* Leave Group Dialog */}
      <Dialog
        open={openLeaveGroup}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setOpenLeaveGroup(false)}
        aria-describedby="leave-group-dialog"
      >
        <DialogTitle>Leave this group</DialogTitle>
        <DialogContent>
          <DialogContentText id="leave-group-dialog">
            Are you sure you want to leave this group? You will no longer receive messages from this group.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLeaveGroup(false)}>Cancel</Button>
          <Button onClick={handleLeaveGroup} color="error">Leave</Button>
        </DialogActions>
      </Dialog>
      
      {/* Chat Wallpaper Dialog */}
      {openWallpaper && <WallpaperDialog open={openWallpaper} handleClose={() => setOpenWallpaper(false)} />}
      
      <TranslationDialog 
        open={openTranslationDialog} 
        onClose={() => setOpenTranslationDialog(false)} 
      />
    </Box>
  );
};

export default ChatHeader;
