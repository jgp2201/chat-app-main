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
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const { current_conversation } = useSelector((state) => state.conversation.direct_chat);
  const user_id = window.localStorage.getItem("user_id");
  const { room_id } = useSelector((state) => state.app);

  const handleLinkClick = () => {
    dispatch(UpdateSidebarType("SHARED"));
    dispatch({ type: "SET_SHARED_TAB", payload: 1 });
  };

  const handleFileSelect = (event, actionType) => {
    const file = event.target.files[0];
    if (!file) return;

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversation_id', room_id);
    formData.append('from', user_id);
    formData.append('to', current_conversation.user_id);

    // Determine message type based on file type
    let messageType = 'text';
    if (file.type.startsWith('image/')) {
      messageType = 'img';
    } else if (file.type.startsWith('video/')) {
      messageType = 'video';
    } else {
      messageType = 'doc';
    }

    // Emit socket event for file upload
    socket.emit('file_message', {
      file: formData,
      type: messageType,
      conversation_id: room_id,
      from: user_id,
      to: current_conversation.user_id,
    });

    // Reset file input
    event.target.value = '';
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
            <Stack sx={{ width: "max-content" }}>
              <InputAdornment position="start">
                <IconButton onClick={handleLinkClick}>
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
      {openActions && (
        <Box
          sx={{
            position: "absolute",
            bottom: 100,
            left: 0,
            zIndex: 1000,
          }}
        >
          {Actions.map((el, index) => (
            <Tooltip key={index} placement="right" title={el.title}>
              <Fab
                onClick={() => handleActionClick(el)}
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
        </Box>
      )}
    </>
  );
};

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(
    urlRegex,
    (url) => `<a href="${url}" target="_blank">${url}</a>`
  );
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
  const { sideBar, room_id } = useSelector((state) => state.app);

  const [openPicker, setOpenPicker] = React.useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  const sendMessage = () => {
    if (value.trim() === "") return; // Don't send empty messages

    socket.emit("text_message", {
      message: linkify(value),
      conversation_id: room_id,
      from: user_id,
      to: current_conversation.user_id,
      type: containsUrl(value) ? "Link" : "Text",
    });

    setValue(""); // Clear input field after sending
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
                right: isMobile ? 20 : sideBar.open ? 420 : 100,
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
            {/* Chat Input */}
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
