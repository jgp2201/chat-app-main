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
import { ArrowLeft, DownloadSimple } from "phosphor-react";
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
              Shared Messages
            </Typography>
          </Stack>
        </Box>

        <Tabs
          sx={{ 
            pt: 2,
            "& .MuiTabs-indicator": {
              backgroundColor: theme.palette.primary.main,
            },
            "& .MuiTab-root": {
              minWidth: 'auto',
              minHeight: 'auto',
              padding: '8px 9px',
              color: theme.palette.mode === "light" 
                ? "rgba(0, 0, 0, 0.6)"
                : "rgba(255, 255, 255, 0.6)",
              "&.Mui-selected": {
                color: theme.palette.primary.main,
              },
            }
          }}
          value={value}
          onChange={handleChange}
        >
          <Tab label={getTabLabel("Media", mediaMessages.length)} />
          <Tab label={getTabLabel("Links", linkMessages.length)} />
          <Tab label={getTabLabel("Docs", docMessages.length)} />
        </Tabs>

        <Stack
          sx={{
            height: "100%",
            position: "relative",
            flexGrow: 1,
            overflow: "auto",
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
              "&:hover": {
                background: theme.palette.mode === "light"
                  ? "rgba(0, 0, 0, 0.2)"
                  : "rgba(255, 255, 255, 0.2)",
              }
            },
          }}
        >
          <Box sx={{ p: 2, pb: 3 }}>
            {(() => {
              switch (value) {
                case 0:
                  return mediaMessages.length > 0 ? (
                    <Grid container spacing={1}>
                      {mediaMessages.map((el, idx) => (
                        <Grid item xs={6} key={idx}>
                          <Box
                            component="a"
                            href={getFullUrl(el.file?.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              position: 'relative',
                              display: 'block',
                              width: '100%',
                              paddingTop: '100%', // 1:1 Aspect Ratio
                              borderRadius: 1,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              '&:hover': {
                                '& img': {
                                  transform: 'scale(1.05)',
                                },
                                '& .overlay': {
                                  opacity: 1,
                                }
                              }
                            }}
                          >
                            {el.file?.mimetype?.startsWith('image/') ? (
                              <img
                                src={getFullUrl(el.file.url)}
                                alt={el.file.originalname || 'Image'}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  transition: 'transform 0.3s ease',
                                }}
                              />
                            ) : el.file?.mimetype?.startsWith('video/') ? (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  bgcolor: 'black',
                                }}
                              >
                                <video
                                  src={getFullUrl(el.file.url)}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                />
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    color: 'white',
                                    fontSize: '48px',
                                  }}
                                >
                                  ▶
                                </Box>
                              </Box>
                            ) : null}
                            <Box
                              className="overlay"
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                p: 1,
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                                opacity: 0,
                                transition: 'opacity 0.3s ease',
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'white',
                                  display: 'block',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {el.file?.originalname || 'Media'}
                              </Typography>
                            </Box>
                          </Box>
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
                    <Stack spacing={1}>
                      {linkMessages.map((el, idx) => (
                        <LinkMsg key={idx} el={el} menu={false} />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      No link messages
                    </Typography>
                  );
                case 2:
                  return docMessages.length > 0 ? (
                    <Stack spacing={1}>
                      {docMessages.map((el, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            p: 2,
                            borderRadius: 1.5,
                            backgroundColor: theme.palette.mode === "light" 
                              ? "rgba(255, 255, 255, 0.9)"
                              : "rgba(45, 45, 45, 0.9)",
                            border: '1px solid',
                            borderColor: theme.palette.mode === "light" 
                              ? "rgba(0, 0, 0, 0.1)"
                              : "rgba(255, 255, 255, 0.1)",
                            boxShadow: theme.palette.mode === "light"
                              ? "0 2px 8px rgba(0,0,0,0.05)"
                              : "0 2px 8px rgba(0,0,0,0.2)",
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              borderColor: theme.palette.primary.main,
                              boxShadow: theme.palette.mode === "light"
                                ? "0 4px 12px rgba(0,0,0,0.1)"
                                : "0 4px 12px rgba(0,0,0,0.3)",
                            }
                          }}
                        >
                          <Stack direction="row" alignItems="center">
                            {/* File Icon */}
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: theme.palette.primary.main,
                                color: 'white',
                                fontSize: '24px',
                                fontWeight: 'bold'
                              }}
                            >
                              {el.file?.originalname?.slice(-3).toUpperCase() || 'DOC'}
                            </Box>

                            {/* File Info */}
                            <Box
                              component="a"
                              href={getFullUrl(el.file?.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                flexGrow: 1,
                                textDecoration: 'none',
                                color: 'inherit'
                              }}
                            >
                              <Stack spacing={0.5}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 600,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    color: theme.palette.mode === "light"
                                      ? "rgba(0, 0, 0, 0.9)"
                                      : "rgba(255, 255, 255, 0.9)",
                                  }}
                                >
                                  {el.file?.originalname || 'Document'}
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                  <Typography 
                                    variant="caption" 
                                    sx={{
                                      color: theme.palette.mode === "light"
                                        ? "rgba(0, 0, 0, 0.6)"
                                        : "rgba(255, 255, 255, 0.6)",
                                    }}
                                  >
                                    {formatFileSize(el.file?.size)}
                                  </Typography>
                                  <Typography 
                                    variant="caption"
                                    sx={{
                                      color: theme.palette.primary.main,
                                      fontWeight: 500
                                    }}
                                  >
                                    {el.file?.mimetype?.split('/')[1]?.toUpperCase() || 'FILE'}
                                  </Typography>
                                </Stack>
                              </Stack>
                            </Box>

                            {/* Download Button */}
                            <IconButton
                              component="a"
                              href={getFullUrl(el.file?.url)}
                              target="_blank"
                              download
                              sx={{
                                width: 36,
                                height: 36,
                                backgroundColor: theme.palette.mode === "light"
                                  ? "rgba(0, 0, 0, 0.05)"
                                  : "rgba(255, 255, 255, 0.05)",
                                color: theme.palette.primary.main,
                                '&:hover': {
                                  backgroundColor: theme.palette.mode === "light"
                                    ? "rgba(0, 0, 0, 0.1)"
                                    : "rgba(255, 255, 255, 0.1)",
                                  transform: 'scale(1.1)',
                                },
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <DownloadSimple weight="bold" />
                            </IconButton>
                          </Stack>
                        </Box>
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