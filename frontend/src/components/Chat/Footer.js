import {
  Box,
  Fab,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  FetchCurrentMessages,
  AddDirectMessage,
  ClearReplyMessage,
} from "../../redux/slices/conversation";
import {
  Camera,
  File,
  Image,
  LinkSimple,
  PaperPlaneTilt,
  Smiley,
  Sticker,
  User,
  X,
} from "phosphor-react";
import { useTheme, styled } from "@mui/material/styles";
import React, { useRef, useState, useEffect } from "react";
import { alpha } from "@mui/material/styles";
import { socket } from "../../socket";
import { useSelector, useDispatch } from "react-redux";
import { getLinkPreview } from 'link-preview-js';
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

const StyledInput = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-input": {
    paddingTop: "12px !important",
    paddingBottom: "12px !important",
  },
}));

const Actions = [
  {
    color: "#4da5fe",
    icon: <Image size={24} />,
    y: 102,
    title: "Photo/Video",
    type: "media",
    accept: "image/*,video/*",
  },
  {
    color: "#1b8cfe",
    icon: <Sticker size={24} />,
    y: 172,
    title: "Stickers",
  },
  {
    color: "#0172e4",
    icon: <Camera size={24} />,
    y: 242,
    title: "Image",
    type: "image",
    accept: "image/*",
  },
  {
    color: "#0159b2",
    icon: <File size={24} />,
    y: 312,
    title: "Document",
    type: "document",
    accept: ".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx",
  },
  {
    color: "#013f7f",
    icon: <User size={24} />,
    y: 382,
    title: "Contact",
  },
];

const ChatInput = ({
  openPicker,
  setOpenPicker,
  setValue,
  value,
  inputRef,
  sendMessage,
}) => {
  const [openActions, setOpenActions] = React.useState(false);
  const fileInputRef = useRef(null);
  const actionsRef = useRef(null);
  const { current_conversation } = useSelector((state) => state.conversation.direct_chat);
  const user_id = window.localStorage.getItem("user_id");
  const { room_id } = useSelector((state) => state.app);
  const { token } = useSelector((state) => state.auth);
  const theme = useTheme();

  // Handle click outside of actions menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setOpenActions(false);
      }
    };

    if (openActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActions]);

  const handleFileSelect = async (event, actionType) => {
    const file = event.target.files[0];
    if (!file || !current_conversation) return;

    try {
      console.log('Starting file upload:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        conversationId: room_id,
        to: current_conversation?.user_id
      });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversation_id', room_id);
      formData.append('to', current_conversation?.user_id);

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Upload file to server
      const response = await fetch('http://localhost:3001/api/v1/files/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'File upload failed');
      }

      const data = await response.json();
      console.log('File upload response:', data);

      if (!data.data || !data.data.file) {
        throw new Error('Invalid response from server');
      }

      const uploadedFile = data.data.file;

      // Determine message type based on file type
      let messageType = 'Document';
      if (file.type.startsWith('image/')) {
        messageType = 'Media';
      } else if (file.type.startsWith('video/')) {
        messageType = 'Media';
      }

      console.log('Emitting file message:', {
        conversation_id: room_id,
        from: user_id,
        to: current_conversation?.user_id,
        file: uploadedFile,
        type: messageType
      });

      // Emit socket event with file reference
      socket.emit('file_message', {
        conversation_id: room_id,
        from: user_id,
        to: current_conversation?.user_id,
        file: uploadedFile,
        type: messageType
      });

      event.target.value = ''; // Clear the input
    } catch (error) {
      console.error('Error in file upload:', error);
      // You might want to show an error message to the user here
      alert('Failed to upload file: ' + error.message);
    }
  };

  const handleActionClick = (action) => {
    if (action.type) {
      fileInputRef.current.accept = action.accept;
      fileInputRef.current.click();
    }
    setOpenActions(false);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e, fileInputRef.current.accept)}
      />
      <StyledInput
        inputRef={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        fullWidth
        placeholder="Write a message..."
        variant="filled"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
          }
        }}
        InputProps={{
          disableUnderline: true,
          startAdornment: (
            <Stack sx={{ position: 'relative' }} ref={actionsRef}>
              {openActions && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    mb: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    zIndex: 10,
                  }}
                >
                  {Actions.map((el) => (
                    <Tooltip key={el.title} placement="right" title={el.title}>
                      <Fab
                        onClick={() => handleActionClick(el)}
                        sx={{
                          backgroundColor: el.color,
                          width: 40,
                          height: 40,
                          minHeight: 40,
                          '&:hover': {
                            backgroundColor: alpha(el.color, 0.8)
                          },
                          boxShadow: theme.shadows[2],
                        }}
                        aria-label={el.title}
                        size="small"
                      >
                        {el.icon}
                      </Fab>
                    </Tooltip>
                  ))}
                </Box>
              )}
              <IconButton
                onClick={() => {
                  setOpenActions(!openActions);
                }}
                sx={{
                  color: theme.palette.primary.main,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                <LinkSimple weight="fill" />
              </IconButton>
            </Stack>
          ),
          endAdornment: (
            <Stack sx={{ position: "relative" }}>
              <InputAdornment position="end">
                <IconButton onClick={() => setOpenPicker(!openPicker)}>
                  <Smiley />
                </IconButton>
              </InputAdornment>
            </Stack>
          ),
        }}
      />
    </>
  );
};

async function getLinkPreviewData(url) {
  try {
    const data = await getLinkPreview(url);
    return {
      title: data.title || '',
      description: data.description || '',
      image: data.image || '',
      favicon: data.favicon || '',
      siteName: data.siteName || '',
      url: data.url || url
    };
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return null;
  }
}

async function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex) || [];

  if (urls.length === 0) return text;

  // Get preview data for all URLs
  const previewData = await Promise.all(
    urls.map(url => getLinkPreviewData(url))
  );

  // Replace URLs with preview HTML
  let result = text;
  urls.forEach((url, index) => {
    const data = previewData[index];
    if (data) {
      const previewHtml = `
        <div class="link-preview" style="
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 12px;
          margin: 8px 0;
          background: #f8f9fa;
        ">
          <div style="display: flex; gap: 12px;">
            ${data.image ? `
              <div style="width: 120px; height: 80px; overflow: hidden; border-radius: 4px;">
                <img src="${data.image}" alt="${data.title}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
            ` : ''}
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                ${data.favicon ? `<img src="${data.favicon}" alt="favicon" style="width: 16px; height: 16px;">` : ''}
                <span style="font-size: 14px; color: #666;">${data.siteName}</span>
              </div>
              <a href="${data.url}" target="_blank" style="
                color: #1976d2;
                text-decoration: none;
                font-weight: 500;
                font-size: 16px;
                margin-bottom: 4px;
                display: block;
              ">${data.title}</a>
              ${data.description ? `
                <p style="
                  color: #666;
                  font-size: 14px;
                  margin: 0;
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                ">${data.description}</p>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      result = result.replace(url, previewHtml);
    } else {
      result = result.replace(url, `<a href="${url}" target="_blank">${url}</a>`);
    }
  });

  return result;
}

function containsUrl(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return urlRegex.test(text);
}

const Footer = () => {
  const theme = useTheme();
  const { current_conversation, reply, original_message, current_messages } = useSelector(
    (state) => state.conversation.direct_chat
  );

  const user_id = window.localStorage.getItem("user_id");
  const { room_id } = useSelector((state) => state.app);
  const { token } = useSelector((state) => state.auth);

  const [openPicker, setOpenPicker] = React.useState(false);
  const [openActions, setOpenActions] = React.useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef(null);
  const pickerRef = useRef(null);
  const actionsRef = useRef(null);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  // Handle click outside of emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpenPicker(false);
      }
    };

    if (openPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openPicker]);

  // Handle click outside of actions menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setOpenActions(false);
      }
    };

    if (openActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActions]);

  const handleFileSelect = async (event, actionType) => {
    const file = event.target.files[0];
    if (!file || !current_conversation) return;

    try {
      console.log('Starting file upload:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        conversationId: room_id,
        to: current_conversation?.user_id
      });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversation_id', room_id);
      formData.append('to', current_conversation?.user_id);

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Upload file to server
      const response = await fetch('http://localhost:3001/api/v1/files/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'File upload failed');
      }

      const data = await response.json();
      console.log('File upload response:', data);

      if (!data.data || !data.data.file) {
        throw new Error('Invalid response from server');
      }

      const uploadedFile = data.data.file;

      // Determine message type based on file type
      let messageType = 'Document';
      if (file.type.startsWith('image/')) {
        messageType = 'Media';
      } else if (file.type.startsWith('video/')) {
        messageType = 'Media';
      }

      console.log('Emitting file message:', {
        conversation_id: room_id,
        from: user_id,
        to: current_conversation?.user_id,
        file: uploadedFile,
        type: messageType
      });

      // Emit socket event with file reference
      socket.emit('file_message', {
        conversation_id: room_id,
        from: user_id,
        to: current_conversation?.user_id,
        file: uploadedFile,
        type: messageType
      });

      event.target.value = ''; // Clear the input
    } catch (error) {
      console.error('Error in file upload:', error);
      alert('Failed to upload file: ' + error.message);
    }
  };

  const handleActionClick = (action) => {
    if (action.type) {
      fileInputRef.current.accept = action.accept;
      fileInputRef.current.click();
    }
    setOpenActions(false);
  };

  const sendMessage = async () => {
    if (value.trim() === "" || !current_conversation) return;

    console.log("Starting sendMessage with:", {
      value: value.trim(),
      current_conversation,
      reply
    });

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const foundUrls = value.match(urlRegex);
    let previewData = null;

    if (foundUrls) {
      try {
        previewData = await getLinkPreviewData(foundUrls[0]);
        console.log("Link preview data:", previewData);
      } catch (error) {
        console.error("Error fetching link preview:", error);
      }
    }

    const messageData = {
      message: value.trim(),
      conversation_id: room_id,
      from: user_id,
      to: current_conversation?.user_id,
      type: reply ? "Reply" : (foundUrls ? "Link" : "Text"),
      preview: previewData,
    };

    // If there's a reply, add reply data
    if (reply && original_message) {
      console.log("Adding reply data to message:", original_message);
      messageData.reply = {
        message_id: original_message.id,
        text: original_message.message,
        from: original_message.from,
        type: original_message.type,
        subtype: original_message.subtype,
        file: original_message.file
      };
    }

    console.log("Emitting text_message with data:", messageData);
    socket.emit("text_message", messageData);

    // Create and add temporary message to Redux state immediately
    const tempMessage = {
      id: Date.now().toString(),
      type: "msg",
      subtype: reply ? "Reply" : (foundUrls ? "Link" : "Text"),
      message: value.trim(),
      incoming: false,
      outgoing: true,
      time: new Date().toISOString(),
      created_at: new Date().toISOString(),
      starred: false,
      reply: messageData.reply,
      ...(previewData && { preview: previewData })
    };

    // Dispatch the message to Redux and ensure it's immediately visible
    dispatch(AddDirectMessage(tempMessage));
    
    // Force a full refresh of messages to ensure UI updates
    dispatch(FetchCurrentMessages({
      messages: [...current_messages, tempMessage]
    }));

    // Clear reply state after sending
    if (reply) {
      console.log("Clearing reply state");
      dispatch(ClearReplyMessage());
    }

    setValue(""); // Clear input field
  };

  // Handle escape key to clear reply
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && reply) {
        dispatch(ClearReplyMessage());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reply, dispatch]);

  return (
    <Box
      p={2}
      sx={{
        width: "100%",
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[2],
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e, fileInputRef.current.accept)}
      />
      
      {openPicker && (
        <Box
          ref={pickerRef}
          sx={{
            position: "fixed",
            bottom: "80px",
            right: "80px",
            zIndex: 10,
          }}
        >
          <Picker 
            data={data}
            onEmojiSelect={(emoji) => {
              setValue(value + emoji.native);
            }}
          />
        </Box>
      )}
      <Stack direction="row" spacing={2} alignItems="center">
        {/* Reply Preview */}
        {reply && (
          <Box
            sx={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              p: 1,
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Replying to:
              </Typography>
              <Typography variant="body2" noWrap>
                {original_message?.message || (original_message?.file?.originalname || 'Media')}
              </Typography>
            </Stack>
            <IconButton 
              size="small" 
              onClick={() => dispatch(ClearReplyMessage())}
              sx={{ 
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.error.main
                }
              }}
            >
              <X size={16} />
            </IconButton>
          </Box>
        )}

        {/* Actions Menu */}
        <Box sx={{ position: 'relative' }} ref={actionsRef}>
          {openActions && (
            <Box
              sx={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                mb: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                zIndex: 10,
              }}
            >
              {Actions.map((el) => (
                <Tooltip key={el.title} placement="right" title={el.title}>
                  <Fab
                    onClick={() => handleActionClick(el)}
                    sx={{
                      backgroundColor: el.color,
                      width: 40,
                      height: 40,
                      minHeight: 40,
                      '&:hover': {
                        backgroundColor: alpha(el.color, 0.8)
                      },
                      boxShadow: theme.shadows[2],
                    }}
                    aria-label={el.title}
                    size="small"
                  >
                    {el.icon}
                  </Fab>
                </Tooltip>
              ))}
            </Box>
          )}
          <IconButton
            onClick={() => setOpenActions(!openActions)}
            sx={{
              color: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <LinkSimple weight="fill" />
          </IconButton>
        </Box>

        {/* Emoji Picker Button */}
        <IconButton
          onClick={() => setOpenPicker(true)}
          sx={{
            color: theme.palette.primary.main,
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <Smiley size={24} />
        </IconButton>

        {/* Message Input */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
          <TextField
            fullWidth
            placeholder="Write a message..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            multiline
            maxRows={4}
            InputProps={{
              sx: {
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
              },
            }}
          />

          <IconButton
            onClick={sendMessage}
            disabled={!value.trim()}
            sx={{
              color: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <PaperPlaneTilt size={24} />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
};

export { ChatInput, linkify, containsUrl };
export default Footer;
