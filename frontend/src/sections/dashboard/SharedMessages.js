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
  Alert,
  Collapse,
  Button
} from "@mui/material";
import { ArrowLeft, DownloadSimple, Image, Bug } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";
import { UpdateSidebarType } from "../../redux/slices/app";
import { DocMsg, LinkMsg } from "../../sections/dashboard/Conversation";

// Utility function to create safe message objects with all required properties
const createSafeMessage = (message) => {
  if (!message) return {
    id: '',
    type: 'msg',
    subtype: 'Text',
    message: '',
    from: {},
    file: {},
    incoming: true,
    created_at: Date.now()
  };
  
  // Get file object with safe defaults
  const file = message.file || {};
  
  // Return a complete message object with fallbacks for all properties
  return {
    id: message.id || '',
    type: message.type || 'msg',
    subtype: message.subtype || 'Text',
    message: message.message || '',
    incoming: message.incoming !== undefined ? message.incoming : true,
    outgoing: message.outgoing !== undefined ? message.outgoing : false,
    created_at: message.created_at || message.time || Date.now(),
    time: message.time || '',
    
    // Handle from being either a string ID or an object
    from: typeof message.from === 'object' ? 
      { ...message.from, name: message.from?.name || 'User' } : 
      { id: message.from || '', name: message.fromName || 'User' },
    
    // Ensure fromName is available
    fromName: message.fromName || (typeof message.from === 'object' ? message.from?.name : '') || 'User',
    
    // Ensure file properties are handled safely
    file: {
      url: file.url || '',
      originalname: file.originalname || '',
      mimetype: file.mimetype || '',
      size: file.size || 0
    },
    
    // Ensure reply exists if needed
    reply: message.reply || null,
    
    // Add preview if it exists
    ...(message.preview && { preview: message.preview }),
    
    // Add starred status
    starred: message.starred || false
  };
};

const SharedMessages = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { sharedTab } = useSelector((state) => state.app);
  const [value, setValue] = useState(sharedTab);
  const [debugOpen, setDebugOpen] = useState(false);

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

  // eslint-disable-next-line no-unused-vars
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

  // eslint-disable-next-line no-unused-vars
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
          <IconButton 
            onClick={() => setDebugOpen(!debugOpen)}
            sx={{ 
              width: "24px", 
              height: "24px", 
              color: debugOpen ? theme.palette.primary.main : theme.palette.text.secondary 
            }}
          >
            <Bug size={20} />
          </IconButton>
        </Stack>
        
        {/* Debug Information */}
        <Collapse in={debugOpen}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Debug Information
            </Typography>
            <Typography variant="caption" display="block" sx={{ wordBreak: 'break-all' }}>
              Chat Type: {chat_type}
            </Typography>
            <Typography variant="caption" display="block" sx={{ wordBreak: 'break-all' }}>
              Media Messages: {mediaMessages.length}
            </Typography>
            <Typography variant="caption" display="block" sx={{ wordBreak: 'break-all' }}>
              Link Messages: {linkMessages.length}
            </Typography>
            <Typography variant="caption" display="block" sx={{ wordBreak: 'break-all' }}>
              Doc Messages: {docMessages.length}
            </Typography>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => console.log("Media Messages:", mediaMessages)}
              sx={{ mt: 1, mr: 1 }}
            >
              Log Media
            </Button>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => console.log("Link Messages:", linkMessages)}
              sx={{ mt: 1, mr: 1 }}
            >
              Log Links
            </Button>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => console.log("Doc Messages:", docMessages)}
              sx={{ mt: 1 }}
            >
              Log Docs
            </Button>
          </Alert>
        </Collapse>
        
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
              label={getTabLabel("Media", mediaMessages.length)}
              sx={{
                fontWeight: 600,
                color: value === 0 ? theme.palette.primary.main : theme.palette.text.secondary
              }}
            />
            <Tab 
              label={getTabLabel("Links", linkMessages.length)}
              sx={{
                fontWeight: 600,
                color: value === 1 ? theme.palette.primary.main : theme.palette.text.secondary
              }}
            />
            <Tab 
              label={getTabLabel("Docs", docMessages.length)}
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
                {mediaMessages.map((message, index) => {
                  if (!message) return null;
                  const file = message.file || {};
                  
                  // Skip invalid media files
                  if (!file.url) {
                    console.warn("Media message missing URL:", message);
                    return null;
                  }
                  
                  // Create safe message to avoid undefined errors
                  const safeMessage = createSafeMessage(message);
                  
                  return (
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
                      {file.mimetype?.startsWith('image/') ? (
                        <img
                          src={getFullUrl(file.url)}
                          alt={file.originalname || safeMessage.message || 'Image'}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : file.mimetype?.startsWith('video/') ? (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: "100%",
                          height: "100%",
                          backgroundColor: theme.palette.mode === 'light' ? '#f0f4fa' : '#1a2027'
                        }}>
                          <Typography variant="body2" align="center">
                            Video
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: "100%",
                          height: "100%",
                          backgroundColor: theme.palette.mode === 'light' ? '#f0f4fa' : '#1a2027'
                        }}>
                          <Typography variant="body2" align="center">
                            Media
                          </Typography>
                        </Box>
                      )}
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
                            {safeMessage.created_at ? new Date(safeMessage.created_at).toLocaleDateString() : ''}
                          </Typography>
                          <IconButton 
                            component="a"
                            href={getFullUrl(file.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            size="small"
                          >
                            <DownloadSimple color="#fff" size={16} />
                          </IconButton>
                        </Stack>
                      </Box>
                    </Stack>
                  </Grid>
                  );
                })}
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
                {linkMessages.map((message, index) => {
                  if (!message || !message.message) return null;
                  const safeMessage = createSafeMessage(message);
                  
                  return (
                  <Box key={index} sx={{ p: 1, backgroundColor: theme.palette.mode === 'light' ? 'background.paper' : 'background.default', borderRadius: 1 }}>
                    <LinkMsg el={safeMessage} menu={false} preview={message.preview || null} />
                  </Box>
                  );
                })}
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
                {docMessages.map((message, index) => {
                  if (!message) return null;
                  const file = message.file || {};
                  const safeMessage = createSafeMessage(message);
                  
                  // Skip invalid doc files
                  if (!file.url) {
                    console.warn("Document message missing URL:", message);
                    return null;
                  }
                  
                  return (
                  <Box key={index} sx={{ p: 1, backgroundColor: theme.palette.mode === 'light' ? 'background.paper' : 'background.default', borderRadius: 1 }}>
                    <DocMsg el={safeMessage} menu={false} />
                  </Box>
                  );
                })}
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