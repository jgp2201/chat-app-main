import {
  Box,
  Fab,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  Camera,
  File,
  Image,
  LinkSimple,
  PaperPlaneTilt,
  Smiley,
  Sticker,
  User,
} from "phosphor-react";
import { useTheme, styled } from "@mui/material/styles";
import React, { useRef, useState } from "react";
import useResponsive from "../../hooks/useResponsive";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { socket } from "../../socket";
import { useSelector, useDispatch } from "react-redux";
import { UpdateSidebarType } from "../../redux/slices/app";
import { getLinkPreview } from 'link-preview-js';

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
  const { current_conversation } = useSelector((state) => state.conversation.direct_chat);
  const user_id = window.localStorage.getItem("user_id");
  const { room_id } = useSelector((state) => state.app);

  const handleFileSelect = (event, actionType) => {
    const file = event.target.files[0];
    if (!file || !current_conversation) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversation_id', room_id);
    formData.append('from', user_id);
    formData.append('to', current_conversation?.user_id);

    let messageType = 'Text';
    if (file.type.startsWith('image/')) {
      messageType = 'Media';
    } else if (file.type.startsWith('video/')) {
      messageType = 'Media';
    } else {
      messageType = 'Document';
    }

    socket.emit('file_message', {
      file: formData,
      type: messageType,
      conversation_id: room_id,
      from: user_id,
      to: current_conversation?.user_id,
    });

    event.target.value = '';
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
            <Stack sx={{ width: "max-content" }}>
              <Stack
                sx={{
                  position: "relative",
                  display: openActions ? "inline-block" : "none",
                }}
              >
                {Actions.map((el) => (
                  <Tooltip placement="right" title={el.title}>
                    <Fab
                      onClick={() => {
                        setOpenActions(!openActions);
                      }}
                      sx={{
                        position: "absolute",
                        top: -el.y,
                        backgroundColor: el.color,
                      }}
                      aria-label="add"
                    >
                      {el.icon}
                    </Fab>
                  </Tooltip>
                ))}
              </Stack>

              <InputAdornment>
                <IconButton
                  onClick={() => {
                    setOpenActions(!openActions);
                  }}
                >
                  <LinkSimple />
                </IconButton>
              </InputAdornment>
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
  const { current_conversation } = useSelector(
    (state) => state.conversation.direct_chat
  );

  const user_id = window.localStorage.getItem("user_id");
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const { sidebar, room_id } = useSelector((state) => state.app);

  const [openPicker, setOpenPicker] = React.useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  const sendMessage = async () => {
    if (value.trim() === "" || !current_conversation) return;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const foundUrls = value.match(urlRegex);
    let previewData = null;

    if (foundUrls) {
      try {
        previewData = await getLinkPreviewData(foundUrls[0]); // Fetch metadata
      } catch (error) {
        console.error("Error fetching link preview:", error);
      }
    }

    socket.emit("text_message", {
      message: value.trim(),
      conversation_id: room_id,
      from: user_id,
      to: current_conversation?.user_id,
      type: foundUrls ? "Link" : "Text",
      preview: previewData, // Attach preview metadata
    });

    setValue(""); // Clear input field
  };


  return (
    <Box sx={{ position: "relative", backgroundColor: "transparent !important" }}>
      <Box
        p={isMobile ? 1 : 2}
        width={"100%"}
        sx={{
          backgroundColor: theme.palette.mode === "light" ? "#F8FAFF" : theme.palette.background,
          boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
        }}
      >
        <Stack direction="row" alignItems={"center"} spacing={isMobile ? 1 : 3}>
          <Stack sx={{ width: "100%" }}>
            <Box
              style={{
                zIndex: 10,
                position: "fixed",
                display: openPicker ? "inline" : "none",
                bottom: 81,
                right: isMobile ? 20 : sidebar.open ? 420 : 100,
              }}
            >
              <Picker
                theme={theme.palette.mode}
                data={data}
                onEmojiSelect={(emoji) => {
                  setValue((prev) => prev + emoji.native);
                }}
              />
            </Box>
            <ChatInput
              inputRef={inputRef}
              value={value}
              setValue={setValue}
              openPicker={openPicker}
              setOpenPicker={setOpenPicker}
              sendMessage={sendMessage}
            />
          </Stack>
          <Box
            sx={{
              height: 48,
              width: 48,
              backgroundColor: theme.palette.primary.main,
              borderRadius: 1.5,
            }}
          >
            <Stack sx={{ height: "100%" }} alignItems={"center"} justifyContent="center">
              <IconButton onClick={sendMessage}>
                <PaperPlaneTilt color="#ffffff" />
              </IconButton>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default Footer;
