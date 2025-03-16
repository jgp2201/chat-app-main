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
import Embed from "react-embed";
import { getLinkPreview } from "link-preview-js";

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

const LinkPreview = ({ url }) => {
  const theme = useTheme();
  const [preview, setPreview] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPreview = async () => {
      try {
        const data = await getLinkPreview(url);
        setPreview(data);
      } catch (error) {
        console.error("Error fetching link preview:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (loading) {
    return (
      <Box sx={{ p: 2, backgroundColor: theme.palette.background.paper, borderRadius: 1 }}>
        <Typography variant="body2">Loading preview...</Typography>
      </Box>
    );
  }

  if (!preview) {
    return null;
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      {preview.images && preview.images.length > 0 && (
        <Box
          component="img"
          src={preview.images[0]}
          alt={preview.title || "Link preview"}
          sx={{
            width: "100%",
            height: 200,
            objectFit: "cover",
          }}
        />
      )}
      <Box sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 600,
            }}
          >
            {preview.title}
          </Typography>
          {preview.description && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {preview.description}
            </Typography>
          )}
          <Typography
            component="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            variant="caption"
            sx={{
              color: theme.palette.primary.main,
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            {preview.siteName || new URL(url).hostname}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

const LinkMsg = ({ el, menu }) => {
  const theme = useTheme();
  
  const getUrl = (text) => {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    return match ? match[0] : text;  // Return the text itself if no URL is found
  };

  const url = getUrl(el.message || el.text);  // Try el.message first, then fall back to el.text
  const isYouTubeLink = url.includes("youtube.com") || url.includes("youtu.be");

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
          maxWidth: "350px"
        }}
      >
        <Stack spacing={1}>
          <Box
            sx={{
              width: "100%",
              backgroundColor: theme.palette.background.paper,
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            {isYouTubeLink ? (
              <Box sx={{ width: "100%", aspectRatio: "16/9", overflow: "hidden" }}>
                <Embed 
                  url={url}
                  width="100%"
                  height="100%"
                />
              </Box>
            ) : (
              <LinkPreview url={url} />
            )}
          </Box>
          {(el.message || el.text) && url !== (el.message || el.text) && (
            <Typography
              variant="body2"
              color={el.incoming ? theme.palette.text : "#fff"}
              sx={{ wordBreak: "break-word" }}
            >
              {(el.message || el.text).replace(url, "").trim()}
            </Typography>
          )}
        </Stack>
      </Box>
      {menu && <MessageOption messageId={el.id} starred={el.starred} />}
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