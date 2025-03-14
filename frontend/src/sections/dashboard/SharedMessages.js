import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  IconButton,
  Stack,
  Typography,
  Tabs,
  Tab,
  Grid,
} from "@mui/material";
import { ArrowLeft } from "phosphor-react";
import useResponsive from "../../hooks/useResponsive";
import { useDispatch, useSelector } from "react-redux";
import { UpdateSidebarType } from "../../redux/slices/app";
import { DocMsg, LinkMsg, MediaMsg } from "../../sections/dashboard/Conversation";

const SharedMessages = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDesktop = useResponsive("up", "md");
  const { sharedTab } = useSelector((state) => state.app);
  const [value, setValue] = useState(sharedTab);

  // Get all messages from Redux state
  const { current_messages } = useSelector((state) => state.conversation.direct_chat);

  // Filter messages based on subtypes
  const mediaMessages = current_messages.filter((msg) => msg.type === "msg" && msg.subtype === "img");
  const linkMessages = current_messages.filter((msg) => msg.type === "msg" && msg.subtype === "link");
  const docMessages = current_messages.filter((msg) => msg.type === "msg" && msg.subtype === "doc");

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  // Update tab when sharedTab from Redux changes
  useEffect(() => {
    setValue(sharedTab);
  }, [sharedTab]);

  const getTabLabel = (label, count) => (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography variant="body2">{label}</Typography>
      <Typography variant="caption" color="text.secondary">
        ({count})
      </Typography>
    </Stack>
  );

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
            <Typography variant="subtitle2">Shared Messages</Typography>
          </Stack>
        </Box>

        <Stack sx={{ height: "100%", position: "relative", flexGrow: 1, overflow: "scroll" }}>
          <Tabs
            sx={{ px: 2, pt: 2 }}
            value={value}
            onChange={handleChange}
          >
            <Tab label={getTabLabel("Media", mediaMessages.length)} />
            <Tab label={getTabLabel("Links", linkMessages.length)} />
            <Tab label={getTabLabel("Docs", docMessages.length)} />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {(() => {
              switch (value) {
                case 0:
                  return mediaMessages.length > 0 ? (
                    <Grid container spacing={2}>
                      {mediaMessages.map((el, idx) => (
                        <Grid item xs={4} key={idx}>
                          <MediaMsg el={el} menu={true} />
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      No media messages
                    </Typography>
                  );
                case 1:
                  return linkMessages.length > 0 ? (
                    <Stack spacing={2}>
                      {linkMessages.map((el, idx) => (
                        <LinkMsg key={idx} el={el} menu={true} />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      No link messages
                    </Typography>
                  );
                case 2:
                  return docMessages.length > 0 ? (
                    <Stack spacing={2}>
                      {docMessages.map((el, idx) => (
                        <DocMsg key={idx} el={el} menu={true} />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      No document messages
                    </Typography>
                  );
                default:
                  return null;
              }
            })()}
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

export default SharedMessages;