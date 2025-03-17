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
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { 
  DotsThreeVertical, 
  DownloadSimple, 
  Image,
  Star,
  ArrowsClockwise,
  TrashSimple,
  Copy,
  Export
} from "phosphor-react";
import { useDispatch } from "react-redux";
import { ToggleStarMessage, DeleteMessage } from "../../redux/slices/conversation";
import { getLinkPreview } from "link-preview-js";
import axios from "axios";

const MessageOption = ({ messageId, starred }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStarMessage = () => {
    dispatch(ToggleStarMessage(messageId));
    handleClose();
  };

  const handleReplyMessage = () => {
    // TODO: Implement reply functionality
    handleClose();
  };

  const handleForwardMessage = () => {
    // TODO: Implement forward functionality
    handleClose();
  };

  const handleCopyMessage = () => {
    // TODO: Implement copy functionality
    handleClose();
  };

  const handleDeleteMessage = () => {
    dispatch(DeleteMessage(messageId));
    handleClose();
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
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      />
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
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
      {menu && <MessageOption messageId={el.id} starred={el.starred} />}
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
      {menu && <MessageOption messageId={el.id} starred={el.starred} />}
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
      {menu && <MessageOption messageId={el.id} starred={el.starred} />}
    </Stack>
  );
};


const LinkMsg = ({ el, menu }) => {
  const theme = useTheme();
  const url = (el.message.match(/(https?:\/\/[^\s]+)/g) || [])[0] || "";
  const [previewData, setPreviewData] = useState(null);

  // Fetch Open Graph data
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const { data } = await axios.get(`https://api.linkpreview.net/?key=YOUR_API_KEY&q=${url}`);
        setPreviewData(data);
      } catch (error) {
        console.error("Error fetching link preview:", error);
      }
    };

    if (url) fetchMetadata();
  }, [url]);

  return (
    <Box display="flex" justifyContent={el.incoming ? "start" : "end"}>
      <Box
        px={2}
        py={1.5}
        sx={{
          backgroundColor: el.incoming
            ? theme.palette.background.paper
            : theme.palette.primary.main,
          color: el.incoming ? theme.palette.text.primary : "#fff",
          borderRadius: 2,
          maxWidth: "350px",
          wordBreak: "break-word",
        }}
      >
        {/* Clickable Link */}
        <Typography variant="body2">
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: el.incoming ? theme.palette.primary.main : "#fff",
              textDecoration: "underline",
              fontWeight: 500,
              "&:hover": {
                textDecoration: "none",
              },
            }}
          >
            {url}
          </Link>
        </Typography>

        {/* Link Preview */}
        {previewData && (
          <Card
            sx={{
              mt: 1,
              borderRadius: "8px",
              backgroundColor: theme.palette.background.default,
            }}
          >
            {previewData.image && (
              <CardMedia
                component="img"
                height="140"
                image={previewData.image}
                alt={previewData.title}
                sx={{ borderTopLeftRadius: "8px", borderTopRightRadius: "8px" }}
              />
            )}
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold">
                {previewData.title}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {previewData.description}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
      {menu && <MessageOption messageId={el.id} starred={el.starred} />}
    </Box>
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
      {menu && <MessageOption messageId={el.id} starred={el.starred} />}
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