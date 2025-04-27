import React, { useState, useEffect } from "react";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import {
  CaretLeft,
  Bell,
  Lock,
  Key,
  PencilCircle,
  Image,
  Note,
  Info,
} from "phosphor-react";

import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FetchUserProfile } from "../../../redux/slices/app";
import ThemeDialog from "../../../sections/dashboard/Settings/ThemeDialog";
import WallpaperDialog from "../../../sections/dashboard/Settings/WallpaperDialog";
import { AWS_S3_REGION, S3_BUCKET_NAME } from "../../../config";

const Settings = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.app);

  // Fetch user profile data when component mounts
  useEffect(() => {
    dispatch(FetchUserProfile());
  }, [dispatch]);

  const [openTheme, setOpenTheme] = useState(false);

  const handleOpenTheme = () => {
    setOpenTheme(true);
  };

  const handleCloseTheme = () => {
    setOpenTheme(false);
  };

  const [openWallpaper, setOpenWallpaper] = useState(false);

  const handleOpenWallpaper = () => {
    setOpenWallpaper(true);
  };

  const handleCloseWallpaper = () => {
    setOpenWallpaper(false);
  };

  const handleNavigateToProfile = () => {
    navigate("/profile");
  };

  const list = [
    {
      key: 0,
      icon: <Bell size={20} />,
      title: "Notifications",
      onclick: () => {},
    },
    {
      key: 1,
      icon: <Lock size={20} />,
      title: "Privacy",
      onclick: () => {},
    },
    {
      key: 2,
      icon: <Key size={20} />,
      title: "Security",
      onclick: () => {},
    },
    {
      key: 3,
      icon: <PencilCircle size={20} />,
      title: "Theme",
      onclick: handleOpenTheme,
    },
    {
      key: 4,
      icon: <Image size={20} />,
      title: "Chat Wallpaper",
      onclick: handleOpenWallpaper,
    },
    {
      key: 5,
      icon: <Note size={20} />,
      title: "Request Account Info",
      onclick: () => {},
    },
    {
      key: 6,
      icon: <Info size={20} />,
      title: "Help",
      onclick: () => {},
    },
  ];

  // Get user avatar URL
  const userAvatarUrl = user?.avatar 
    ? `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${user.avatar}`
    : '';

  return (
    <>
      <Stack direction="row" sx={{ width: "100%" }}>
        {/* LeftPane */}
        <Box
          sx={{
            overflowY: "auto",
            height: "100vh",
            width: 320,
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? "#F8FAFF"
                : theme.palette.background,
            boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
            borderRight: (theme) => `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
            "&::-webkit-scrollbar": {
              width: "8px",
              borderRadius: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: (theme) => theme.palette.mode === "light" 
                ? "rgba(0,0,0,0.2)" 
                : "rgba(255,255,255,0.2)",
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: (theme) => theme.palette.mode === "light" 
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
          
          <Stack p={4} spacing={5}>
            {/* Header */}
            <Stack direction="row" alignItems={"center"} spacing={3}>
              <IconButton onClick={() => navigate(-1)}>
                <CaretLeft size={24} color={"#4B4B4B"} />
              </IconButton>

              <Typography variant="h5" fontWeight="600">Settings</Typography>
            </Stack>

            {/* Profile */}
            <Stack 
              direction="row" 
              spacing={3}
              onClick={handleNavigateToProfile}
              sx={{
                p: 2.5,
                borderRadius: 1.5,
                backgroundColor: (theme) => theme.palette.mode === 'light' 
                  ? 'rgba(0,0,0,0.02)' 
                  : 'rgba(255,255,255,0.02)',
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.mode === 'light' 
                    ? 'rgba(0,0,0,0.04)' 
                    : 'rgba(255,255,255,0.04)',
                  cursor: 'pointer'
                },
                transition: 'background-color 0.2s ease-in-out'
              }}
            >
              <Avatar
                src={userAvatarUrl}
                sx={{ 
                  height: 56, 
                  width: 56,
                  boxShadow: '0px 0px 5px rgba(0,0,0,0.1)',
                  border: (theme) => `3px solid ${theme.palette.background.paper}`,
                }}
              />
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" fontWeight="600">
                  {user?.firstName || "User"} {user?.lastName || ""}
                </Typography>
                <Typography variant="body2">
                  {user?.about || "No status set"}
                </Typography>
              </Stack>
            </Stack>
            
            {/* List */}
            <Stack spacing={4}>
              {list.map(({ key, icon, title, onclick }) => {
                return (
                  <Stack
                    key={key}
                    onClick={onclick}
                    sx={{ 
                      cursor: "pointer",
                      p: 2,
                      borderRadius: 1,
                      backgroundColor: (theme) => theme.palette.mode === 'light' 
                        ? 'rgba(0,0,0,0.01)' 
                        : 'rgba(255,255,255,0.01)',
                      '&:hover': {
                        backgroundColor: (theme) => theme.palette.mode === 'light' 
                          ? 'rgba(0,0,0,0.03)' 
                          : 'rgba(255,255,255,0.03)',
                      },
                      transition: 'background-color 0.2s ease-in-out'
                    }}
                  >
                    <Stack alignItems={"center"} direction="row" spacing={2}>
                      {icon}
                      <Typography variant="body2" fontWeight="500">{title}</Typography>
                    </Stack>
                    {key !== 6 && <Divider sx={{ 
                      mt: 2,
                      borderColor: (theme) => theme.palette.mode === 'light' 
                        ? 'rgba(0,0,0,0.08)' 
                        : 'rgba(255,255,255,0.08)',
                    }} />}
                  </Stack>
                );
              })}
            </Stack>
          </Stack>
        </Box>
        {/* Right Pane */}
        <Box
          sx={{
            height: "100%",
            width: "calc(100vw - 420px )",
            backgroundColor:
              theme.palette.mode === "light"
                ? "#FFF"
                : theme.palette.background.paper,
            borderBottom: "6px solid #0162C4",
          }}
        ></Box>
      </Stack>
      {openTheme && (
        <ThemeDialog open={openTheme} handleClose={handleCloseTheme} />
      )}
      {openWallpaper && <WallpaperDialog open={openWallpaper} handleClose={handleCloseWallpaper} /> }
    </>
  );
};

export default Settings;
