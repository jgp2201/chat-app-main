import React from "react";
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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CaretDown, MagnifyingGlass, Phone, VideoCamera, Users } from "phosphor-react";
import useResponsive from "../../hooks/useResponsive";
import { ToggleSidebar } from "../../redux/slices/app";
import { useDispatch, useSelector } from "react-redux";
import { StartAudioCall } from "../../redux/slices/audioCall";
import { StartVideoCall } from "../../redux/slices/videoCall";

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

const Conversation_Menu = [
  {
    title: "Contact info",
  },
  {
    title: "Mute notifications",
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
    title: "Mute notifications",
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
  
  return (
    <>
      <Box
        p={2}
        width={"100%"}
        sx={{
          backgroundColor:
            theme.palette.mode === "light"
              ? "#F8FAFF"
              : theme.palette.background,
          boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
        }}
      >
        <Stack
          alignItems={"center"}
          direction={"row"}
          sx={{ width: "100%", height: "100%" }}
          justifyContent="space-between"
        >
          <Stack
            onClick={() => {
              dispatch(ToggleSidebar());
            }}
            spacing={2}
            direction="row"
            alignItems="center"
          >
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
          <Stack
            direction={"row"}
            alignItems="center"
            spacing={isMobile ? 1 : 3}
          >
            {chat_type === "individual" && (
              <>
                <IconButton onClick={() => {
                  dispatch(StartVideoCall(current_conversation.user_id));
                }}>
                  <VideoCamera />
                </IconButton>
                <IconButton
                  onClick={() => {
                    dispatch(StartAudioCall(current_conversation.user_id));
                  }}
                >
                  <Phone />
                </IconButton>
              </>
            )}
            {!isMobile && (
              <IconButton>
                <MagnifyingGlass />
              </IconButton>
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
                    <MenuItem key={index} onClick={handleCloseConversationMenu}>
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
      </Box>
    </>
  );
};

export default ChatHeader;
