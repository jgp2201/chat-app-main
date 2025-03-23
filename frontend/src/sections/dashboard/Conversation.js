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
import { ToggleStarMessage, DeleteMessage, AddDirectMessage, SetReplyMessage } from "../../redux/slices/conversation";
import { toast } from "react-hot-toast";
import { getLinkPreview } from "link-preview-js";
import { socket } from "../../socket";

const ForwardMessageDialog = ({ open, onClose, message, conversations }) => {
  const theme = useTheme();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { current_conversation } = useSelector((state) => state.conversation.direct_chat);

  const handleForward = () => {
    if (!selectedConversation) {
      toast.error("Please select a conversation");
      return;
    }

    if (!current_conversation?.id) {
      toast.error("Source conversation not found");
      return;
    }

    console.log("Forwarding message with data:", {
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
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Forward Message</DialogTitle>
      <DialogContent>
        <List>
          {conversations.map((conversation) => (
            <ListItem
              key={conversation.id}
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
                secondary={conversation.msg}
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
  const conversations = useSelector((state) => state.conversation.direct_chat.conversations);

  const handleOpenMenu = (event) => {
    setMenu(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenu(null);
  };

  const handleStarMessage = () => {
    dispatch(ToggleStarMessage(messageId));
    handleCloseMenu();
  };

  const handleReplyMessage = () => {
    console.log("Setting reply message:", message);
    // Set the reply state in Redux
    dispatch(SetReplyMessage({
      id: messageId,
      message: message.message,
      from: message.from,
      type: message.type,
      subtype: message.subtype,
      file: message.file
    }));
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
    dispatch(DeleteMessage(messageId));
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
  return (
    <Stack direction="row" justifyContent={el.incoming ? "start" : "end"}>
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
      {menu && <MessageOption messageId={el.id} starred={el.starred} message={el} />}
    </Stack>
  );
};
const MediaMsg = ({ el, menu }) => {
  const theme = useTheme();
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
      {menu && <MessageOption messageId={el.id} starred={el.starred} message={el} />}
    </Stack>
  );
};
const DocMsg = ({ el, menu }) => {
  const theme = useTheme();
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
            <Typography variant="h6">{getFileIcon(file.mimetype)}</Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {file.originalname || 'Document'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(file.size)}
              </Typography>
            </Stack>
            <IconButton
              component="a"
              href={getFullUrl(file.url)}
              target="_blank"
              download
            >
              <DownloadSimple />
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
      {menu && <MessageOption messageId={el.id} starred={el.starred} message={el} />}
    </Stack>
  );
};


const LinkMsg = ({ el, menu }) => {
  const theme = useTheme();
  const [preview, setPreview] = useState(null);
  const url = (el.message.match(/(https?:\/\/[^\s]+)/g) || [])[0] || "";

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const data = await getLinkPreview(url);
        setPreview(data);
      } catch (error) {
        console.error("Error fetching link preview:", error);
      }
    };

    if (url) {
      fetchPreview();
    }
  }, [url]);

  return (
    <Stack direction="row" justifyContent={el.incoming ? "start" : "end"}>
      <Box
        sx={{
          backgroundColor: el.incoming
            ? alpha(theme.palette.background.paper, 1)
            : theme.palette.primary.main,
          borderRadius: 2,
          maxWidth: "350px",
          overflow: "hidden",
          boxShadow: theme.shadows[2],
        }}
      >
        {preview && (
          <Card sx={{
            background: 'transparent',
            boxShadow: 'none',
            '&:hover': {
              opacity: 0.9,
              cursor: 'pointer'
            }
          }}>
            {preview.images?.[0] && (
              <CardMedia
                component="img"
                height="140"
                image={preview.images[0]}
                alt={preview.title || 'Link preview'}
                sx={{
                  objectFit: 'cover',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px'
                }}
              />
            )}
            <CardContent sx={{ p: 1.5 }}>
              <Stack spacing={1}>
                <Typography
                  variant="subtitle2"
                  color={el.incoming ? theme.palette.text.primary : "#fff"}
                  sx={{
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.3
                  }}
                >
                  {preview.title || url}
                </Typography>
                {preview.description && (
                  <Typography
                    variant="caption"
                    color={el.incoming ? theme.palette.text.secondary : alpha("#fff", 0.7)}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.4
                    }}
                  >
                    {preview.description}
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  color={el.incoming ? theme.palette.text.secondary : alpha("#fff", 0.7)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`}
                    alt=""
                    style={{ width: 16, height: 16 }}
                  />
                  {new URL(url).hostname}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        )}
        <Box
          component="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            p: 1.5,
            display: 'block',
            textDecoration: 'none',
            '&:hover': {
              backgroundColor: alpha(theme.palette.background.default, 0.1)
            }
          }}
        >
          <Typography
            variant="body2"
            color={el.incoming ? theme.palette.primary.main : "#fff"}
            sx={{
              fontWeight: 500,
              wordBreak: "break-word",
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <Export size={16} weight="bold" />
            {url}
          </Typography>
        </Box>
      </Box>
      {menu && <MessageOption messageId={el.id} starred={el.starred} message={el} />}
    </Stack>
  );
};


const ReplyMsg = ({ el, menu }) => {
  const theme = useTheme();
  console.log("Rendering reply message:", el);

  return (
    <Stack direction="row" justifyContent={el.incoming ? "start" : "end"}>
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.incoming
            ? alpha(theme.palette.background.paper, 1)
            : theme.palette.primary.main,
          borderRadius: 1.5,
          width: "max-content",
          maxWidth: "65%",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            width: "2px",
            left: 0,
            top: 0,
            bottom: 0,
            backgroundColor: el.incoming ? theme.palette.primary.main : alpha("#fff", 0.6),
            borderRadius: "4px"
          }
        }}
      >
        <Stack spacing={0.5}>
          {/* Original message being replied to */}
          <Box
            sx={{
              backgroundColor: el.incoming
                ? alpha(theme.palette.background.default, 0.5)
                : alpha(theme.palette.background.paper, 0.1),
              borderRadius: 0.75,
              px: 1,
              py: 0.75,
              mb: 0.5
            }}
          >
            <Stack spacing={0.5}>
              <Typography
                variant="caption"
                color={el.incoming ? theme.palette.primary.main : alpha('#fff', 0.9)}
                sx={{ fontWeight: 600 }}
              >
                hheleoo
              </Typography>
            </Stack>
          </Box>

          {/* Reply message */}
          <Typography
            variant="body2"
            color={el.incoming ? theme.palette.text.primary : "#fff"}
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: '0.875rem'
            }}
          >
            {el.message}
          </Typography>
        </Stack>
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