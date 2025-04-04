import React, { useEffect, useState } from "react";
import {
  Stack,
  Box,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  Link,
  CardContent,
  CardMedia,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import {
  DotsThreeVertical,
  DownloadSimple,
  Star,
  ArrowsClockwise,
  TrashSimple,
  Copy,
  Export,
  PaperPlaneTilt
} from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";
import { ToggleStarMessage, DeleteMessage, AddDirectMessage, SetReplyMessage, ToggleStarGroupMessage, DeleteGroupMessage, SetGroupReplyMessage } from "../../redux/slices/conversation";
import { toast } from "react-hot-toast";
import { getLinkPreview } from "link-preview-js";
import { socket } from "../../socket";

const ForwardMessageDialog = ({ open, onClose, message, conversations }) => {
  const theme = useTheme();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { chat_type } = useSelector((state) => state.app);
  const { direct_chat, group_chat } = useSelector((state) => state.conversation);
  const current_conversation = chat_type === "group" 
    ? group_chat.current_conversation 
    : direct_chat.current_conversation;
  const room_id = useSelector((state) => state.app.room_id);
  
  // Get all available conversations for forwarding
  const allConversations = [
    ...direct_chat.conversations.map(conv => ({
      ...conv,
      type: "individual"
    })),
    ...group_chat.conversations.map(conv => ({
      ...conv,
      type: "group"
    }))
  ];

  const handleForward = () => {
    if (!selectedConversation) {
      toast.error("Please select a conversation");
      return;
    }

    if (!current_conversation?.id && !room_id) {
      toast.error("Source conversation not found");
      return;
    }

    // Handle forwarding based on target conversation type
    if (selectedConversation.type === "group") {
      // Forward to group chat
      console.log("Forwarding to group:", {
        message_id: message.id,
        from_id: room_id,
        to_group_id: selectedConversation.id
      });
      
      toast.success("Message forwarded to group");
      onClose();
    } else {
      // Forward to individual chat
      if (chat_type === "group") {
        console.log("Forwarding group message to individual:", {
          message_id: message.id,
          from_group_id: room_id,
          to_conversation_id: selectedConversation.id,
          to_user_id: selectedConversation.user_id
        });

        socket.emit("forward_message", {
          message_id: message.id,
          from_conversation_id: room_id, // Using room_id which contains the group_id
          to_conversation_id: selectedConversation.id,
          to_user_id: selectedConversation.user_id
        }, (response) => {
          if (response && response.success) {
            toast.success("Message forwarded successfully");
            onClose();
          } else {
            toast.error(response?.error || "Failed to forward message");
          }
        });
      } else {
        console.log("Forwarding direct message to individual:", {
          message_id: message.id,
          from_conversation_id: current_conversation.id,
          to_conversation_id: selectedConversation.id,
          to_user_id: selectedConversation.user_id
        });

        socket.emit("forward_message", {
          message_id: message.id,
          from_conversation_id: current_conversation.id,
          to_conversation_id: selectedConversation.id,
          to_user_id: selectedConversation.user_id
        }, (response) => {
          if (response && response.success) {
            toast.success("Message forwarded successfully");
            onClose();
          } else {
            toast.error(response?.error || "Failed to forward message");
          }
        });
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Forward Message</DialogTitle>
      <DialogContent>
        <List>
          {allConversations.map((conversation) => (
            <ListItem
              key={conversation.id + (conversation.type || "")}
              button
              selected={selectedConversation?.id === conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              sx={{
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <ListItemAvatar>
                <Avatar src={conversation.img} alt={conversation.name}>
                  {conversation.name.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={conversation.name}
                secondary={
                  <>
                    {conversation.type === "group" && <span>Group • </span>}
                    {conversation.msg}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleForward}
          variant="contained"
          startIcon={<PaperPlaneTilt size={20} />}
          disabled={!selectedConversation}
        >
          Forward
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const MessageOption = ({ messageId, starred, message }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [menu, setMenu] = useState(null);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const { chat_type } = useSelector((state) => state.app);
  const { direct_chat, group_chat } = useSelector((state) => state.conversation);
  const conversations = chat_type === "group" 
    ? group_chat.conversations 
    : direct_chat.conversations;

  const handleOpenMenu = (event) => {
    setMenu(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenu(null);
  };

  const handleStarMessage = () => {
    if (chat_type === "group") {
      dispatch(ToggleStarGroupMessage(messageId));
    } else {
      dispatch(ToggleStarMessage(messageId));
    }
    handleCloseMenu();
  };

  const handleReplyMessage = () => {
    console.log("Setting reply message:", message);
    
    // Get the current user ID and current conversation
    const user_id = window.localStorage.getItem("user_id");
    const current_conversation = chat_type === "group" 
      ? group_chat.current_conversation 
      : direct_chat.current_conversation;
    
    // Create a properly formatted reply object based on message data
    const fromId = message.outgoing 
      ? user_id 
      : (message.from?.id || (chat_type === "individual" ? current_conversation?.user_id : "unknown"));
      
    const fromName = message.outgoing 
      ? "You" 
      : (message.from?.name || current_conversation?.name || "User");
    
    // Set the reply state in Redux based on chat type
    if (chat_type === "group") {
      dispatch(SetGroupReplyMessage({
        id: messageId,
        message: message.message,
        // Store the ID and name separately to display correctly in UI
        // but ensure server gets only the ID
        from: fromId,
        fromName: fromName, // Custom property for UI display
        type: message.type || "Text",
        subtype: message.subtype || "Text",
        file: message.file
      }));
    } else {
      dispatch(SetReplyMessage({
        id: messageId,
        message: message.message,
        from: fromId,
        fromName: fromName, // Custom property for UI display
        type: message.type || "Text",
        subtype: message.subtype || "Text",
        file: message.file
      }));
    }
    handleCloseMenu();
  };

  const handleForwardMessage = () => {
    setForwardDialogOpen(true);
    handleCloseMenu();
  };

  const handleCopyMessage = () => {
    // Get the message text based on the message type
    console.log(message);
    let textToCopy = "";
    if (message.subtype === "Text") {
      textToCopy = message.message;
    } else if (message.subtype === "Link") {
      textToCopy = message.message;
    } else if (message.subtype === "Document" || message.subtype === "Media") {
      textToCopy = message.file.originalname;
    }

    // Copy to clipboard
    navigator.clipboard.writeText(textToCopy).then(() => {
      // Show success notification
      toast.success("Message copied to clipboard");
    }).catch((err) => {
      // Show error notification
      toast.error("Failed to copy message");
      console.error("Failed to copy text: ", err);
    });

    handleCloseMenu();
  };

  const handleDeleteMessage = () => {
    if (chat_type === "group") {
      dispatch(DeleteGroupMessage(messageId));
    } else {
      dispatch(DeleteMessage(messageId));
    }
    handleCloseMenu();
  };

  const options = [
    {
      title: "Reply",
      onClick: handleReplyMessage,
      icon: <ArrowsClockwise size={18} />,
    },
    {
      title: starred ? "Unstar Message" : "Star Message",
      onClick: handleStarMessage,
      icon: <Star weight={starred ? "fill" : "regular"} size={18} />,
    },
    {
      title: "Forward",
      onClick: handleForwardMessage,
      icon: <Export size={18} />,
    },
    {
      title: "Copy",
      onClick: handleCopyMessage,
      icon: <Copy size={18} />,
    },
    {
      title: "Delete",
      onClick: handleDeleteMessage,
      icon: <TrashSimple size={18} />,
      color: theme.palette.error.main
    }
  ];

  return (
    <>
      <DotsThreeVertical
        size={20}
        id="basic-button"
        aria-controls={menu ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={menu ? "true" : undefined}
        onClick={handleOpenMenu}
        style={{ cursor: 'pointer' }}
      />
      <Menu
        id="basic-menu"
        anchorEl={menu}
        open={Boolean(menu)}
        onClose={handleCloseMenu}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Stack spacing={1} px={1}>
          {options.map((option, idx) => (
            <MenuItem
              key={idx}
              onClick={option.onClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: option.color || 'inherit',
                '&:hover': {
                  backgroundColor: option.color ? alpha(option.color, 0.1) : undefined
                }
              }}
            >
              {option.icon}
              <Typography variant="body2">{option.title}</Typography>
            </MenuItem>
          ))}
        </Stack>
      </Menu>
      <ForwardMessageDialog
        open={forwardDialogOpen}
        onClose={() => setForwardDialogOpen(false)}
        message={message}
        conversations={conversations}
      />
    </>
  );
};

const TextMsg = ({ el, menu }) => {
  const theme = useTheme();
  const { chat_type } = useSelector((state) => state.app);
  const isGroup = chat_type === "group";
  
  return (
    <Stack direction="row" justifyContent={el.incoming ? "start" : "end"}>
      <Box>
        {/* Show sender name for incoming messages in group chats */}
        {isGroup && el.incoming && el.from && (
          <Typography
            variant="caption"
            sx={{
              ml: 1.5,
              color: theme.palette.primary.main,
              fontWeight: 'bold'
            }}
          >
            {el.from.name}
          </Typography>
        )}
        <Box
          px={1.5}
          py={1.5}
          sx={{
            backgroundColor: el.incoming
              ? alpha(theme.palette.background.default, 1)
              : theme.palette.primary.main,
            borderRadius: 1.5,
            width: "max-content",
          }}
        >
          <Typography
            variant="body2"
            color={el.incoming ? theme.palette.text : "#fff"}
          >
            {el.message}
          </Typography>
        </Box>
      </Box>
      {menu && <MessageOption messageId={el.id} starred={el.starred} message={el} />}
    </Stack>
  );
};
const MediaMsg = ({ el, menu }) => {
  const theme = useTheme();
  const { chat_type } = useSelector((state) => state.app);
  const isGroup = chat_type === "group";
  const file = el.file || {};

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:3001${url}`;
  };

  return (
    <Stack direction="row" justifyContent={el.incoming ? "start" : "end"}>
      <Box>
        {/* Show sender name for incoming messages in group chats */}
        {isGroup && el.incoming && el.from && (
          <Typography
            variant="caption"
            sx={{
              ml: 1.5,
              color: theme.palette.primary.main,
              fontWeight: 'bold'
            }}
          >
            {el.from.name}
          </Typography>
        )}
        <Box
          px={1.5}
          py={1.5}
          sx={{
            backgroundColor: el.incoming
              ? alpha(theme.palette.background.default, 1)
              : theme.palette.primary.main,
            borderRadius: 1.5,
            width: "max-content",
          }}
        >
          <Stack spacing={1}>
            {file.mimetype?.startsWith('image/') ? (
              <Box
                component="a"
                href={getFullUrl(file.url)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  cursor: 'pointer',
                  display: 'block',
                  '&:hover': {
                    opacity: 0.9
                  }
                }}
              >
                <img
                  src={getFullUrl(file.url)}
                  alt={file.originalname || 'Image'}
                  style={{
                    maxHeight: 210,
                    maxWidth: 250,
                    borderRadius: "10px",
                    objectFit: 'contain'
                  }}
                />
              </Box>
            ) : file.mimetype?.startsWith('video/') ? (
              <video
                controls
                style={{
                  maxHeight: 210,
                  maxWidth: 300,
                  borderRadius: "10px"
                }}
              >
                <source src={getFullUrl(file.url)} type={file.mimetype} />
                Your browser does not support the video tag.
              </video>
            ) : null}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                variant="caption"
                color={el.incoming ? theme.palette.text : "#fff"}
                sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {file.originalname || 'Media'}
              </Typography>
              <Typography
                variant="caption"
                color={el.incoming ? theme.palette.text : "#fff"}
              >
                ({formatFileSize(file.size)})
              </Typography>
            </Stack>
            {el.message && (
              <Typography
                variant="body2"
                color={el.incoming ? theme.palette.text : "#fff"}
              >
                {el.message}
              </Typography>
            )}
          </Stack>
        </Box>
      </Box>
      {menu && <MessageOption messageId={el.id} starred={el.starred} message={el} />}
    </Stack>
  );
};
const DocMsg = ({ el, menu }) => {
  const theme = useTheme();
  const { chat_type } = useSelector((state) => state.app);
  const isGroup = chat_type === "group";
  const file = el.file || {};

  const getFileIcon = (mimetype) => {
    if (mimetype?.includes('pdf')) return '📄';
    if (mimetype?.includes('word')) return '📝';
    if (mimetype?.includes('excel')) return '📊';
    if (mimetype?.includes('powerpoint')) return '📑';
    return '📁';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:3001${url}`;
  };

  return (
    <Stack direction="row" justifyContent={el.incoming ? "start" : "end"}>
      <Box>
        {/* Show sender name for incoming messages in group chats */}
        {isGroup && el.incoming && el.from && (
          <Typography
            variant="caption"
            sx={{
              ml: 1.5,
              color: theme.palette.primary.main,
              fontWeight: 'bold'
            }}
          >
            {el.from.name}
          </Typography>
        )}
        <Box
          px={1}
          py={1}
          sx={{
            backgroundColor: el.incoming
              ? alpha(theme.palette.background.default, 1)
              : theme.palette.primary.main,
            borderRadius: 1.5,
            width: "max-content",
          }}
        >
          <Stack spacing={2}>
            <Stack
              p={1}
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: 1,
              }}
            >
              <Typography variant="h3">{getFileIcon(file.mimetype)}</Typography>
              <Stack spacing={0.5}>
                <Typography 
                  variant="caption" 
                  color={theme.palette.text.primary}
                  sx={{
                    fontWeight: 500,
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {file.originalname || 'Document'}
                </Typography>
                <Typography variant="caption" color={theme.palette.text.secondary}>
                  {formatFileSize(file.size || 0)}
                </Typography>
              </Stack>
              <IconButton
                component="a"
                href={getFullUrl(file.url)}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <DownloadSimple
                  size={20}
                  color={theme.palette.primary.main}
                />
              </IconButton>
            </Stack>
            {el.message && (
              <Typography
                variant="body2"
                color={el.incoming ? theme.palette.text : "#fff"}
              >
                {el.message}
              </Typography>
            )}
          </Stack>
        </Box>
      </Box>
      {menu && <MessageOption messageId={el.id} starred={el.starred} message={el} />}
    </Stack>
  );
};


const LinkMsg = ({ el, menu, preview }) => {
  const theme = useTheme();
  const { chat_type } = useSelector((state) => state.app);
  const isGroup = chat_type === "group";
  const [previewData, setPreviewData] = useState(preview || null);
  const [loading, setLoading] = useState(!preview);

  // Parse the URL from the message text
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const match = el.message.match(urlPattern);
  const url = match ? match[0] : null;

  useEffect(() => {
    const fetchPreview = async () => {
      if (!url || previewData) return;
      
      try {
        setLoading(true);
        // Use either a backend endpoint or client-side library for link previews
        const data = await getLinkPreview(url);
        setPreviewData(data);
      } catch (error) {
        console.error("Error fetching link preview:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreview();
  }, [url, previewData]);

  return (
    <Stack direction="row" justifyContent={el.incoming ? "start" : "end"}>
      <Box>
        {/* Show sender name for incoming messages in group chats */}
        {isGroup && el.incoming && el.from && (
          <Typography
            variant="caption"
            sx={{
              ml: 1.5,
              color: theme.palette.primary.main,
              fontWeight: 'bold'
            }}
          >
            {el.from.name}
          </Typography>
        )}
        <Box
          px={1.5}
          py={1.5}
          sx={{
            backgroundColor: el.incoming
              ? alpha(theme.palette.background.default, 1)
              : theme.palette.primary.main,
            borderRadius: 1.5,
            width: "max-content",
            maxWidth: 300
          }}
        >
          <Stack spacing={1}>
            <Typography
              variant="body2"
              color={el.incoming ? theme.palette.text : "#fff"}
              sx={{ wordBreak: "break-word" }}
            >
              {url ? (
                <>
                  {el.message.split(url)[0]} 
                  <Link 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{ 
                      color: el.incoming ? theme.palette.primary.main : theme.palette.primary.light, 
                      textDecoration: 'underline' 
                    }}
                  >
                    {url}
                  </Link>
                  {el.message.split(url)[1]}
                </>
              ) : (
                el.message
              )}
            </Typography>
            
            {previewData && url && (
              <Card sx={{ width: "100%", mt: 1 }}>
                {previewData.images && previewData.images.length > 0 && (
                  <CardMedia
                    component="img"
                    image={previewData.images[0]}
                    alt={previewData.title || "Link preview"}
                    sx={{ 
                      height: 150, 
                      objectFit: "cover",
                      borderTopLeftRadius: theme.shape.borderRadius,
                      borderTopRightRadius: theme.shape.borderRadius
                    }}
                  />
                )}
                <CardContent sx={{ py: 1 }}>
                  <Typography variant="subtitle2" noWrap>
                    {previewData.title || url}
                  </Typography>
                  {previewData.description && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: "text.secondary", 
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        mt: 0.5
                      }}
                    >
                      {previewData.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                    {previewData.siteName || new URL(url).hostname}
                  </Typography>
                </CardContent>
              </Card>
            )}
            
            {loading && (
              <Typography variant="caption" color={el.incoming ? "text.secondary" : "primary.light"}>
                Loading preview...
              </Typography>
            )}
          </Stack>
        </Box>
      </Box>
      {menu && <MessageOption messageId={el.id} starred={el.starred} message={el} />}
    </Stack>
  );
};


const ReplyMsg = ({ el, menu }) => {
  const theme = useTheme();
  const { chat_type } = useSelector((state) => state.app);
  const isGroup = chat_type === "group";
  
  // Handle cases where reply data might be incomplete
  const replyText = el.reply?.message || el.reply?.text || "Original message not available";
  
  // Get sender name with better fallback handling
  let replyFrom = "User";
  if (el.reply?.fromName) {
    // Use the fromName property if available (new format)
    replyFrom = el.reply.fromName;
  } else if (typeof el.reply?.from === 'object' && el.reply?.from?.name) {
    // Handle old format where from is an object
    replyFrom = el.reply.from.name;
  } else if (el.reply?.from === window.localStorage.getItem("user_id")) {
    // If the sender is the current user
    replyFrom = "You";
  }

  return (
    <Stack direction="row" justifyContent={el.incoming ? "start" : "end"}>
      <Box>
        {/* Show sender name for incoming messages in group chats */}
        {isGroup && el.incoming && el.from && (
          <Typography
            variant="caption"
            sx={{
              ml: 1.5,
              color: theme.palette.primary.main,
              fontWeight: 'bold'
            }}
          >
            {el.from.name}
          </Typography>
        )}
        <Box
          px={1.5}
          py={1.5}
          sx={{
            backgroundColor: el.incoming
              ? alpha(theme.palette.background.default, 1)
              : theme.palette.primary.main,
            borderRadius: 1.5,
            width: "max-content",
          }}
        >
          <Stack spacing={1}>
            <Stack
              p={1}
              direction="column"
              spacing={1}
              alignItems="start"
              sx={{
                backgroundColor: el.incoming
                  ? alpha(theme.palette.background.paper, 0.5)
                  : alpha(theme.palette.background.paper, 0.5),
                borderRadius: 1,
                borderLeft: `3px solid ${theme.palette.primary.main}`
              }}
            >
              <Typography
                variant="caption"
                color={theme.palette.primary.main}
                fontWeight={600}
              >
                {replyFrom}
              </Typography>
              <Typography
                variant="body2"
                color={theme.palette.text}
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical"
                }}
              >
                {replyText}
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              color={el.incoming ? theme.palette.text : "#fff"}
            >
              {el.message}
            </Typography>
          </Stack>
        </Box>
      </Box>
      {menu && <MessageOption messageId={el.id} starred={el.starred} message={el} />}
    </Stack>
  );
};
const Timeline = ({ el }) => {
  const theme = useTheme();
  return (
    <Stack direction="row" alignItems={"center"} justifyContent="space-between">
      <Divider width="46%" />
      <Typography variant="caption" sx={{ color: theme.palette.text }}>
        {el.text}
      </Typography>
      <Divider width="46%" />
    </Stack>
  );
};

export { Timeline, MediaMsg, LinkMsg, DocMsg, TextMsg, ReplyMsg };