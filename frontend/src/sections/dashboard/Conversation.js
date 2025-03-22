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
      {menu && <MessageOption messageId={el.id} starred={el.starred} />}
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
      {menu && <MessageOption messageId={el.id} starred={el.starred} />}
    </Stack>
  );
};


const LinkMsg = ({ el, menu }) => {
  const theme = useTheme();
  const url = (el.message.match(/(https?:\/\/[^\s]+)/g) || [])[0] || "";

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