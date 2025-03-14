import React from "react";
import {
  Stack,
  Box,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  Divider,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { DotsThreeVertical, DownloadSimple, Image, Star } from "phosphor-react";
import { Message_options } from "../../data";
import Embed from "react-embed";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "../../socket";
import { ToggleStarMessage } from "../../redux/slices/conversation";

const MessageOption = ({ message }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const dispatch = useDispatch();
  const { current_conversation } = useSelector((state) => state.conversation.direct_chat);
  const user_id = window.localStorage.getItem("user_id");

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuAction = (action) => {
    switch (action) {
      case "Reply":
        // Implement reply functionality
        socket.emit("reply_message", {
          message_id: message.id,
          conversation_id: current_conversation.id,
          from: user_id,
          to: current_conversation.user_id,
        });
        break;

      case "React to message":
        // Implement reaction functionality
        socket.emit("react_message", {
          message_id: message.id,
          conversation_id: current_conversation.id,
          from: user_id,
          to: current_conversation.user_id,
        });
        break;

      case "Forward message":
        // Implement forward functionality
        socket.emit("forward_message", {
          message_id: message.id,
          conversation_id: current_conversation.id,
          from: user_id,
          to: current_conversation.user_id,
        });
        break;

      case "Star message":
        // Toggle star message in Redux
        dispatch(ToggleStarMessage(message.id));
        // Emit socket event for real-time sync
        socket.emit("star_message", {
          message_id: message.id,
          conversation_id: current_conversation.id,
          from: user_id,
          to: current_conversation.user_id,
        });
        break;

      case "Report":
        // Implement report functionality
        socket.emit("report_message", {
          message_id: message.id,
          conversation_id: current_conversation.id,
          from: user_id,
          to: current_conversation.user_id,
        });
        break;

      case "Delete Message":
        // Implement delete functionality
        socket.emit("delete_message", {
          message_id: message.id,
          conversation_id: current_conversation.id,
          from: user_id,
          to: current_conversation.user_id,
        });
        break;

      default:
        break;
    }
    handleClose();
  };

  return (
    <>
      <DotsThreeVertical
        size={20}
        id="basic-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      />
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        <Stack spacing={1} px={1}>
          {Message_options.map((el, idx) => (
            <MenuItem 
              key={el.id || idx} 
              onClick={() => handleMenuAction(el.title)}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                {el.title === "Star message" && message.starred && (
                  <Star size={16} weight="fill" color="#FFD700" />
                )}
                <Typography>{el.title}</Typography>
              </Stack>
            </MenuItem>
          ))}
        </Stack>
      </Menu>
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
      {menu && <MessageOption message={el} />}
    </Stack>
  );
};
const MediaMsg = ({ el, menu }) => {
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
        <Stack spacing={1}>
          <img
            src={el.img}
            alt={el.message}
            style={{ maxHeight: 210, borderRadius: "10px" }}
          />
          <Typography
            variant="body2"
            color={el.incoming ? theme.palette.text : "#fff"}
          >
            {el.message}
          </Typography>
        </Stack>
      </Box>
      {menu && <MessageOption message={el} />}
    </Stack>
  );
};
const DocMsg = ({ el, menu }) => {
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
        <Stack spacing={2}>
          <Stack
            p={2}
            direction="row"
            spacing={3}
            alignItems="center"
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 1,
            }}
          >
            <Image size={48} />
            <Typography variant="caption">Abstract.png</Typography>
            <IconButton>
              <DownloadSimple />
            </IconButton>
          </Stack>
          <Typography
            variant="body2"
            color={el.incoming ? theme.palette.text : "#fff"}
          >
            {el.message}
          </Typography>
        </Stack>
      </Box>
      {menu && <MessageOption message={el} />}
    </Stack>
  );
};
const LinkMsg = ({ el, menu }) => {
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
        <Stack spacing={2}>
          <Stack
            p={2}
            direction="column"
            spacing={3}
            alignItems="start"
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 1,
            }}
          >
            <Stack direction={"column"} spacing={2}>
              <Embed
                width="300px"
                isDark
                url={`https://youtu.be/xoWxBR34qLE`}
              />
            </Stack>
          </Stack>
          <Typography
            variant="body2"
            color={el.incoming ? theme.palette.text : "#fff"}
          >
            <div dangerouslySetInnerHTML={{ __html: el.message }}></div>
          </Typography>
        </Stack>
      </Box>
      {menu && <MessageOption message={el} />}
    </Stack>
  );
};
const ReplyMsg = ({ el, menu }) => {
  const theme = useTheme();
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
        }}
      >
        <Stack spacing={2}>
          <Stack
            p={2}
            direction="column"
            spacing={3}
            alignItems="center"
            sx={{
              backgroundColor: alpha(theme.palette.background.paper, 1),

              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color={theme.palette.text}>
              {el.message}
            </Typography>
          </Stack>
          <Typography
            variant="body2"
            color={el.incoming ? theme.palette.text : "#fff"}
          >
            {el.reply}
          </Typography>
        </Stack>
      </Box>
      {menu && <MessageOption message={el} />}
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