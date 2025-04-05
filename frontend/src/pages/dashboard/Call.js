import {
  Box,
  Divider,
  IconButton,
  Stack,
  Typography,
  Link,
} from "@mui/material";
import { MagnifyingGlass, Phone } from "phosphor-react";
import React, { useEffect, useState } from "react";
import {
  Search,
  SearchIconWrapper,
  StyledInputBase,
} from "../../components/Search";

import { useTheme } from "@mui/material/styles";
import { SimpleBarStyle } from "../../components/Scrollbar";
import { CallLogElement } from "../../components/CallElement";
import StartCall from "../../sections/dashboard/StartCall";
import { useDispatch, useSelector } from "react-redux";
import { FetchCallLogs } from "../../redux/slices/app";

const Call = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(FetchCallLogs());
  }, []);
  const { call_logs } = useSelector((state) => state.app);
  const [openDialog, setOpenDialog] = useState(false);

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };
  const theme = useTheme();
  return (
    <>
      <Stack direction="row" sx={{ width: "100%" }}>
        {/* Left */}

        <Box
          sx={{
            overflowY: "auto",
            height: "100vh",
            width: 340,
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? "#F8FAFF"
                : theme.palette.background,
            boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
            borderRight: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
            "&::-webkit-scrollbar": {
              width: "8px",
              borderRadius: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.mode === "light" 
                ? "rgba(0,0,0,0.2)" 
                : "rgba(255,255,255,0.2)",
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: theme.palette.mode === "light" 
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
          <Stack p={3} spacing={2} sx={{ maxHeight: "100vh" }}>
            <Stack
              alignItems={"center"}
              justifyContent="space-between"
              direction="row"
            >
              <Typography variant="h5" fontWeight="600">Call Log</Typography>
            </Stack>

            <Stack
              justifyContent={"space-between"}
              alignItems={"center"}
              direction={"row"}
              sx={{
                p: 1.5,
                borderRadius: 1,
                backgroundColor: theme.palette.mode === 'light' 
                  ? 'rgba(0,0,0,0.02)' 
                  : 'rgba(255,255,255,0.02)',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'light' 
                    ? 'rgba(0,0,0,0.04)' 
                    : 'rgba(255,255,255,0.04)',
                  cursor: 'pointer'
                },
                transition: 'background-color 0.2s ease-in-out'
              }}
            >
              <Typography variant="subtitle2" sx={{}} component={Link}>
                Start a conversation
              </Typography>
              <IconButton 
                onClick={handleOpenDialog}
                sx={{
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'light' 
                      ? 'rgba(0,0,0,0.04)' 
                      : 'rgba(255,255,255,0.04)'
                  }
                }}
              >
                <Phone style={{ color: theme.palette.primary.main }} />
              </IconButton>
            </Stack>
            
            <Divider sx={{ 
              borderColor: theme.palette.mode === 'light' 
                ? 'rgba(0,0,0,0.08)' 
                : 'rgba(255,255,255,0.08)',
              width: '100%'
            }} />
            
            <Stack sx={{ 
              flexGrow: 1, 
              overflow: "auto", 
              height: "100%",
              "&::-webkit-scrollbar": {
                width: "6px",
                borderRadius: "6px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: theme.palette.mode === "light" 
                  ? "rgba(0,0,0,0.2)" 
                  : "rgba(255,255,255,0.2)",
                borderRadius: "6px",
                "&:hover": {
                  backgroundColor: theme.palette.mode === "light" 
                    ? "rgba(0,0,0,0.3)" 
                    : "rgba(255,255,255,0.3)",
                }
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "transparent",
              }
            }}>
              <Stack spacing={2.4}>
                {call_logs.map((el, idx) => {
                  return <CallLogElement key={idx} {...el} />;
                })}
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Stack>
      {openDialog && (
        <StartCall open={openDialog} handleClose={handleCloseDialog} />
      )}
    </>
  );
};

export default Call;