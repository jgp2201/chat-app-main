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
import { ArrowLeft, DownloadSimple, Image } from "phosphor-react";
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

  // Get chat type
  const { chat_type } = useSelector((state) => state.app);
  
  // Get current messages based on chat type
  const { direct_chat, group_chat } = useSelector((state) => state.conversation);
  const current_messages = chat_type === "individual" 
    ? direct_chat.current_messages 
    : group_chat.current_messages;

  // Filter messages based on subtypes
  const mediaMessages = current_messages.filter((msg) => msg.type === "msg" && msg.subtype === "Media");
  const linkMessages = current_messages.filter((msg) => msg.type === "msg" && msg.subtype === "Link");
  const docMessages = current_messages.filter((msg) => msg.type === "msg" && msg.subtype === "Document");

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

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:3001${url}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        {/* Header */}
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
            <ArrowLeft size={24} color={theme.palette.text.primary} />
          </IconButton>
          <Typography variant="h5" fontWeight={600}>
            Shared Messages
          </Typography>
          <IconButton sx={{ width: "24px", height: "24px" }} />
        </Stack>
        
        {/* Tabs */}
        <Stack sx={{ width: "100%" }}>
          <Tabs
            value={value}
            onChange={handleChange}
            variant="fullWidth"
            centered
            sx={{
              ".MuiTabs-indicator": {
                backgroundColor: theme.palette.primary.main
              },
            }}
          >
            <Tab 
              label="Media" 
              sx={{
                fontWeight: 600,
                color: value === 0 ? theme.palette.primary.main : theme.palette.text.secondary
              }}
            />
            <Tab 
              label="Links"
              sx={{
                fontWeight: 600,
                color: value === 1 ? theme.palette.primary.main : theme.palette.text.secondary
              }}
            />
            <Tab 
              label="Docs"
              sx={{
                fontWeight: 600,
                color: value === 2 ? theme.palette.primary.main : theme.palette.text.secondary
              }}
            />
          </Tabs>
        </Stack>
        
        {/* Content */}
        <Stack
          sx={{
            flexGrow: 1,
            height: "100%",
            overflow: "auto",
            "&::-webkit-scrollbar": {
              width: "6px",
              borderRadius: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.mode === "light" 
                ? "rgba(0,0,0,0.2)" 
                : "rgba(255,255,255,0.2)",
              borderRadius: "6px",
              "&:hover": {
                backgroundColor: theme.palette.mode === "light" 
                  ? "rgba(0,0,0,0.3)" 
                  : "rgba(255,255,255,0.3)",
              }
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
              borderRadius: "6px",
            }
          }}
        >
          {/* Media Tab */}
          {value === 0 && (
            mediaMessages && mediaMessages.length > 0 ? (
              <Grid container spacing={2}>
                {mediaMessages.map((message, index) => (
                  <Grid item xs={6} key={index}>
                    <Stack
                      alignItems="center"
                      sx={{
                        position: "relative",
                        borderRadius: 1.5,
                        overflow: "hidden",
                        width: 120,
                        height: 120,
                        "&:hover": {
                          "& .MuiBox-root": {
                            opacity: 1,
                          },
                        },
                      }}
                    >
                      <img
                        src={message.img}
                        alt={message.message}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                          p: 1,
                          transition: "all 0.3s ease",
                          opacity: 0,
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="caption" color="white">
                            {new Date(message.created_at).toLocaleDateString()}
                          </Typography>
                          <IconButton size="small">
                            <DownloadSimple color="#fff" size={16} />
                          </IconButton>
                        </Stack>
                      </Box>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Stack sx={{ height: "100%" }} alignItems="center" justifyContent="center">
                <Image size={86} color={theme.palette.text.secondary} opacity={0.3} />
                <Typography variant="body2" color={theme.palette.text.secondary} mt={1}>
                  No Media Shared
                </Typography>
              </Stack>
            )
          )}
          
          {/* Links Tab */}
          {value === 1 && (
            linkMessages && linkMessages.length > 0 ? (
              <Stack spacing={2}>
                {linkMessages.map((message, index) => (
                  <LinkMsg key={index} message={message} menu={false} />
                ))}
              </Stack>
            ) : (
              <Stack sx={{ height: "100%" }} alignItems="center" justifyContent="center">
                <Image size={86} color={theme.palette.text.secondary} opacity={0.3} />
                <Typography variant="body2" color={theme.palette.text.secondary} mt={1}>
                  No Links Shared
                </Typography>
              </Stack>
            )
          )}
          
          {/* Docs Tab */}
          {value === 2 && (
            docMessages && docMessages.length > 0 ? (
              <Stack spacing={2}>
                {docMessages.map((message, index) => (
                  <DocMsg key={index} message={message} menu={false} />
                ))}
              </Stack>
            ) : (
              <Stack sx={{ height: "100%" }} alignItems="center" justifyContent="center">
                <Image size={86} color={theme.palette.text.secondary} opacity={0.3} />
                <Typography variant="body2" color={theme.palette.text.secondary} mt={1}>
                  No Documents Shared
                </Typography>
              </Stack>
            )
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default SharedMessages;