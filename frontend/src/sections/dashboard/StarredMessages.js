import React from "react";
import { useTheme } from "@mui/material/styles";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { ArrowLeft, CaretLeft, Star } from "phosphor-react";
import useResponsive from "../../hooks/useResponsive";
import { useDispatch, useSelector } from "react-redux";
import { UpdateSidebarType } from "../../redux/slices/app";
import { Conversation } from "../../pages/dashboard/Conversation";

// Helper function to format message timestamp
const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";
  
  const date = new Date(timestamp);
  const now = new Date();
  
  // Check if the message is from today
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Check if the message is from this year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  // Message is from a previous year
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

const StarredMessages = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDesktop = useResponsive("up", "md");
  
  // Get chat type
  const { chat_type } = useSelector((state) => state.app);
  
  // Get current messages based on chat type
  const { direct_chat, group_chat } = useSelector((state) => state.conversation);
  const current_messages = chat_type === "individual" 
    ? direct_chat.current_messages 
    : group_chat.current_messages;
  
  // Filter starred messages
  const starredMessages = current_messages.filter((msg) => msg.starred);
  const starredCount = starredMessages.length;

  // Handler to unstar a message
  const handleUnstar = (msg) => {
    // Here you would implement the logic to unstar a message
    // For example, dispatch an action to update the message in Redux
    console.log("Unstarring message:", msg.id);
    // Implement the actual unstar logic here
  };

  return (
    <Box
      sx={{
        width: 320,
        height: "100vh",
        backgroundColor: theme.palette.mode === "light" 
          ? "#F8FAFF" 
          : theme.palette.background,
        boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
        borderRight: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
        overflowY: "auto",
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
        }
      }}
    >
      <Stack p={3} spacing={3}>
        <Stack
          direction="row"
          alignItems={"center"}
          justifyContent="space-between"
          sx={{ width: "100%" }}
        >
          <IconButton
            onClick={() => {
              dispatch(UpdateSidebarType("CONTACT"));
            }}
          >
            <CaretLeft size={24} color={theme.palette.text.primary} />
          </IconButton>
          <Typography variant="h5" fontWeight={600}>
            Starred Messages
          </Typography>
          <IconButton sx={{ width: "24px", height: "24px" }} />
        </Stack>
        <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>
          {starredCount} Starred {starredCount === 1 ? "Message" : "Messages"}
        </Typography>
        <Stack spacing={2}>
          {starredMessages.map((msg) => (
            <MessageItem
              key={msg.id}
              msg={msg}
              chat_type={chat_type}
              handleUnstar={handleUnstar}
            />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

const MessageItem = ({ msg, chat_type, handleUnstar }) => {
  const theme = useTheme();
  
  const isYou = msg.from === window.localStorage.getItem("user_id");
  const fromDetails = chat_type === "individual" 
    ? isYou ? { name: "You" } : msg?.from // In individual chat, show "You" or the sender's name
    : { name: msg?.fromName || "User" }; // In group chat, show the sender's name
    
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        p: 1.5,
        backgroundColor: theme.palette.mode === "light" 
          ? "rgba(0,0,0,0.02)" 
          : "rgba(255,255,255,0.02)",
        borderRadius: 1.5,
        '&:hover': {
          backgroundColor: theme.palette.mode === "light" 
            ? "rgba(0,0,0,0.04)" 
            : "rgba(255,255,255,0.04)",
        },
        transition: 'background-color 0.2s ease-in-out'
      }}
    >
      <Stack spacing={1}>
        <Stack direction={"row"} alignItems="center" spacing={1}>
          <Typography variant="subtitle2" fontWeight={600}>
            {fromDetails.name}
          </Typography>
          <Typography variant="caption" fontWeight={400} sx={{ color: theme.palette.text.secondary }}>
            {formatMessageTime(msg.created_at)}
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            maxWidth: "220px",
          }}
        >
          {msg.message}
        </Typography>
      </Stack>
      <IconButton onClick={() => handleUnstar(msg)} sx={{
        '&:hover': {
          backgroundColor: theme.palette.mode === "light" 
            ? "rgba(0,0,0,0.04)" 
            : "rgba(255,255,255,0.04)",
        }
      }}>
        <Star size={20} weight="fill" color={theme.palette.warning.main} />
      </IconButton>
    </Stack>
  );
};

export default StarredMessages;