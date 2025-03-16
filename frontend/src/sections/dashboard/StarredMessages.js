import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { ArrowLeft } from "phosphor-react";
import useResponsive from "../../hooks/useResponsive";
import { useDispatch, useSelector } from "react-redux";
import { UpdateSidebarType } from "../../redux/slices/app";
import { Conversation } from "../../pages/dashboard/Conversation";

const StarredMessages = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDesktop = useResponsive("up", "md");
  
  // Get all messages from Redux state
  const { current_messages } = useSelector((state) => state.conversation.direct_chat);
  
  // Keep starred messages in local state
  const [starredMessages, setStarredMessages] = useState([]);
  
  // Update starred messages when current_messages changes
  useEffect(() => {
    const starred = current_messages.filter((msg) => msg.starred);
    setStarredMessages(starred);
  }, [current_messages]);

  return (
    <Box sx={{ width: !isDesktop ? "100vw" : 320, maxHeight: "100vh", backgroundColor: theme.palette.mode === "light" ? "#fcf3f2" : "#00000" }}>
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
            spacing={3}
          >
            <IconButton
              onClick={() => {
                dispatch(UpdateSidebarType("CONTACT"));
              }}
            >
              <ArrowLeft />
            </IconButton>
            <Typography variant="subtitle2">
              Starred Messages ({starredMessages.length})
            </Typography>
          </Stack>
        </Box>
        <Stack
          sx={{
            height: "100%",
            position: "relative",
            flexGrow: 1,
            overflow: "scroll",
          }}
          spacing={3}
        >
          {starredMessages.length > 0 ? (
            <Conversation messages={starredMessages} menu={true} />
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No starred messages
              </Typography>
            </Box>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default StarredMessages;