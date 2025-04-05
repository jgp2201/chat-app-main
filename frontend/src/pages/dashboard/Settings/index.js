import React, { useState } from "react";
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
  Keyboard,
  Info,
} from "phosphor-react";

import { useTheme } from "@mui/material/styles";
import { faker } from "@faker-js/faker";
import ThemeDialog from "../../../sections/dashboard/Settings/ThemeDialog";
import ShortcutDialog from "../../../sections/dashboard/Settings/ShortcutDialog";

const Settings = () => {
  const theme = useTheme();

  const [openTheme, setOpenTheme] = useState(false);

  const handleOpenTheme = () => {
    setOpenTheme(true);
  };

  const handleCloseTheme = () => {
    setOpenTheme(false);
  };
  const [openShortcuts, setOpenShortcuts] = useState(false);

  const handleOpenShortcuts = () => {
    setOpenShortcuts(true);
  };

  const handleCloseShortcuts = () => {
    setOpenShortcuts(false);
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
      onclick: () => {},
    },
    {
      key: 5,
      icon: <Note size={20} />,
      title: "Request Account Info",
      onclick: () => {},
    },
    {
      key: 6,
      icon: <Keyboard size={20} />,
      title: "Keyboard Shortcuts",
      onclick: handleOpenShortcuts,
    },
    {
      key: 7,
      icon: <Info size={20} />,
      title: "Help",
      onclick: () => {},
    },
  ];

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
              <IconButton>
                <CaretLeft size={24} color={"#4B4B4B"} />
              </IconButton>

              <Typography variant="h5" fontWeight="600">Settings</Typography>
            </Stack>

            {/* Profile */}
            <Stack 
              direction="row" 
              spacing={3}
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
                src={faker.image.avatar()}
                sx={{ 
                  height: 56, 
                  width: 56,
                  boxShadow: '0px 0px 5px rgba(0,0,0,0.1)',
                  border: (theme) => `3px solid ${theme.palette.background.paper}`,
                }}
              />
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" fontWeight="600">{`${faker.name.firstName()} ${faker.name.lastName()}`}</Typography>
                <Typography variant="body2">{faker.random.words()}</Typography>
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
                    {key !== 7 && <Divider sx={{ 
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
      {openShortcuts && <ShortcutDialog open={openShortcuts} handleClose={handleCloseShortcuts} /> }
      
    </>
  );
};

export default Settings;
