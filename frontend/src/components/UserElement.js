import React, { useState } from "react";
import {
  Box,
  Badge,
  Stack,
  Avatar,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { Chat } from "phosphor-react";
import { socket } from "../socket";

const user_id = window.localStorage.getItem("user_id");

const StyledChatBox = styled(Box)(({ theme }) => ({
  "&:hover": {
    cursor: "pointer",
  },
}));

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

const UserElement = ({ img, firstName, lastName, online, _id }) => {
  const theme = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  const name = `${firstName || ''} ${lastName || ''}`.trim() || 'User';

  const handleSendRequest = () => {
    if (isProcessing || !_id || !user_id) return;
    
    setIsProcessing(true);
    socket.emit("friend_request", { to: _id, from: user_id }, (response) => {
      setIsProcessing(false);
      if (response && response.error) {
        alert(`Error: ${response.error}`);
      } else {
        alert("Request sent successfully");
      }
    });
  };

  return (
    <StyledChatBox
      sx={{
        width: "100%",
        borderRadius: 1,
        backgroundColor: theme.palette.background.paper,
      }}
      p={2}
    >
      <Stack
        direction="row"
        alignItems={"center"}
        justifyContent="space-between"
      >
        <Stack direction="row" alignItems={"center"} spacing={2}>
          {" "}
          {online ? (
            <StyledBadge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
            >
              <Avatar alt={name} src={img} />
            </StyledBadge>
          ) : (
            <Avatar alt={name} src={img} />
          )}
          <Stack spacing={0.3}>
            <Typography variant="subtitle2">{name}</Typography>
          </Stack>
        </Stack>
        <Stack direction={"row"} spacing={2} alignItems={"center"}>
          <Button
            onClick={handleSendRequest}
            disabled={isProcessing}
          >
            {isProcessing ? "Sending..." : "Send Request"}
          </Button>
        </Stack>
      </Stack>
    </StyledChatBox>
  );
};

const FriendRequestElement = ({
  img,
  firstName,
  lastName,
  incoming,
  missed,
  online,
  id,
  email,
}) => {
  const theme = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  const name = `${firstName || ''} ${lastName || ''}`.trim() || 'User';

  const handleAcceptRequest = () => {
    if (isProcessing || !id) return;
    
    setIsProcessing(true);
    socket.emit("accept_request", { request_id: id }, (response) => {
      setIsProcessing(false);
      if (response && response.error) {
        alert(`Error: ${response.error}`);
      }
    });
  };

  return (
    <StyledChatBox
      sx={{
        width: "100%",
        borderRadius: 1,
        backgroundColor: theme.palette.background.paper,
      }}
      p={2}
    >
      <Stack
        direction="row"
        alignItems={"center"}
        justifyContent="space-between"
      >
        <Stack direction="row" alignItems={"center"} spacing={2}>
          {" "}
          {online ? (
            <StyledBadge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
            >
              <Avatar alt={name} src={img} />
            </StyledBadge>
          ) : (
            <Avatar alt={name} src={img} />
          )}
          <Stack spacing={0.3}>
            <Typography variant="subtitle2">{name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {email || ""}
            </Typography>
          </Stack>
        </Stack>
        <Stack direction={"row"} spacing={2} alignItems={"center"}>
          <Button
            onClick={handleAcceptRequest}
            disabled={isProcessing}
          >
            {isProcessing ? "Accepting..." : "Accept Request"}
          </Button>
        </Stack>
      </Stack>
    </StyledChatBox>
  );
};

// FriendElement

const FriendElement = ({
  img,
  firstName,
  lastName,
  incoming,
  missed,
  online,
  _id,
}) => {
  const theme = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  const name = `${firstName || ''} ${lastName || ''}`.trim() || 'User';

  const handleStartConversation = () => {
    if (isProcessing || !_id || !user_id) return;
    
    setIsProcessing(true);
    socket.emit("start_conversation", { to: _id, from: user_id }, (response) => {
      setIsProcessing(false);
      if (response && response.error) {
        console.error("Error starting conversation:", response.error);
      }
    });
  };

  return (
    <StyledChatBox
      sx={{
        width: "100%",
        borderRadius: 1,
        backgroundColor: theme.palette.background.paper,
      }}
      p={2}
    >
      <Stack
        direction="row"
        alignItems={"center"}
        justifyContent="space-between"
      >
        <Stack direction="row" alignItems={"center"} spacing={2}>
          {" "}
          {online ? (
            <StyledBadge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
            >
              <Avatar alt={name} src={img} />
            </StyledBadge>
          ) : (
            <Avatar alt={name} src={img} />
          )}
          <Stack spacing={0.3}>
            <Typography variant="subtitle2">{name}</Typography>
          </Stack>
        </Stack>
        <Stack direction={"row"} spacing={2} alignItems={"center"}>
          <IconButton
            onClick={handleStartConversation}
            disabled={isProcessing}
          >
            <Chat />
          </IconButton>
        </Stack>
      </Stack>
    </StyledChatBox>
  );
};

export { UserElement, FriendRequestElement, FriendElement };
