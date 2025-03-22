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
    <Box 
      sx={{ 
        width: !isDesktop ? "100vw" : 320, 
        maxHeight: "100vh",
        background: theme.palette.mode === "light" 
          ? "linear-gradient(180deg, #F8FAFF 0%, #F0F4FA 100%)"
          : "linear-gradient(180deg, #1A1A1A 0%, #2D2D2D 100%)",
      }}
    >
      <Stack sx={{ height: "100%" }}>
        <Box
          sx={{
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
            width: "100%",
            background: theme.palette.mode === "light"
              ? "rgba(255, 255, 255, 0.8)"
              : "rgba(45, 45, 45, 0.8)",
            backdropFilter: "blur(10px)",
            borderBottom: `1px solid ${
              theme.palette.mode === "light"
                ? "rgba(0, 0, 0, 0.1)"
                : "rgba(255, 255, 255, 0.1)"
            }`,
          }}
        >
          <Stack
            sx={{ 
              height: "100%", 
              p: 2,
              transition: "all 0.3s ease",
              "&:hover": {
                background: theme.palette.mode === "light"
                  ? "rgba(0, 0, 0, 0.02)"
                  : "rgba(255, 255, 255, 0.02)",
              }
            }}
            direction="row"
            alignItems={"center"}
            spacing={3}
          >
            <IconButton
              onClick={() => {
                dispatch(UpdateSidebarType("CONTACT"));
              }}
              sx={{
                transition: "all 0.3s ease",
                "&:hover": {
                  background: theme.palette.mode === "light"
                    ? "rgba(0, 0, 0, 0.05)"
                    : "rgba(255, 255, 255, 0.05)",
                  transform: "translateX(-2px)",
                }
              }}
            >
              <ArrowLeft />
            </IconButton>
            <Typography 
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: theme.palette.mode === "light"
                  ? "rgba(0, 0, 0, 0.8)"
                  : "rgba(255, 255, 255, 0.8)",
              }}
            >
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
            background: "transparent",
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: theme.palette.mode === "light" 
                ? "rgba(0, 0, 0, 0.1)"
                : "rgba(255, 255, 255, 0.1)",
              borderRadius: "3px",
            },
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