import React from "react";
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
  
  // Get current messages from Redux store
  const { current_messages } = useSelector((state) => state.conversation.direct_chat);
  
  // Count starred messages
  const starredCount = current_messages.filter(msg => msg.starred === true).length;

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
              Starred Messages ({starredCount})
            </Typography>
          </Stack>
        </Box>
        <Stack
          sx={{
            height: "100%",
            position: "relative",
            flexGrow: 1,
            overflow: "scroll",
            backgroundColor: theme.palette.mode === "light" ? "#F0F4FA" : theme.palette.background,
          }}
          spacing={3}
        >
          <Conversation menu={true} isMobile={!isDesktop} starred={true} />
        </Stack>
      </Stack>
    </Box>
  );
};

export default StarredMessages;