import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArchiveBox,
  CircleDashed,
  MagnifyingGlass,
  Users,
} from "phosphor-react";
import { SimpleBarStyle } from "../../components/Scrollbar";
import { useTheme } from "@mui/material/styles";
import useResponsive from "../../hooks/useResponsive";
import BottomNav from "../../layouts/dashboard/BottomNav";
import ChatElement from "../../components/ChatElement";
import {
  Search,
  SearchIconWrapper,
  StyledInputBase,
} from "../../components/Search";
import Friends from "../../sections/dashboard/Friends";
import { socket } from "../../socket";
import { useDispatch, useSelector } from "react-redux";
import { FetchDirectConversations } from "../../redux/slices/conversation";

const user_id = window.localStorage.getItem("user_id");

const Chats = () => {
  const theme = useTheme();
  const isDesktop = useResponsive("up", "md");

  const dispatch = useDispatch();

  const {conversations} = useSelector((state) => state.conversation.direct_chat);

  useEffect(() => {
    socket.emit("get_direct_conversations", { user_id }, (data) => {
      console.log(data); // this data is the list of conversations
      // dispatch action

      dispatch(FetchDirectConversations({ conversations: data }));
    });
  }, []);

  const [openDialog, setOpenDialog] = useState(false);

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  return (
    <>
      <Box
        sx={{
          position: "relative",
          height: "100%",
          width: isDesktop ? 320 : "100vw",
          backgroundColor:
            theme.palette.mode === "light"
              ? "#F8FAFF"
              : theme.palette.background,
          boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
          borderRight: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
        }}
      >
        {!isDesktop && (
          // Bottom Nav
          <BottomNav />
        )}

        <Stack p={3} spacing={2} sx={{ maxHeight: "100vh" }}>
          <Stack
            alignItems={"center"}
            justifyContent="space-between"
            direction="row"
          >
            <Typography variant="h5" fontWeight="600">Chats</Typography>

            <Stack direction={"row"} alignItems="center" spacing={1}>
              <IconButton
                onClick={() => {
                  handleOpenDialog();
                }}
                sx={{ 
                  width: "max-content",
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'light' 
                      ? 'rgba(0,0,0,0.04)' 
                      : 'rgba(255,255,255,0.04)'
                  }
                }}
              >
                <Users />
              </IconButton>
              <IconButton 
                sx={{ 
                  width: "max-content",
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'light' 
                      ? 'rgba(0,0,0,0.04)' 
                      : 'rgba(255,255,255,0.04)'
                  }
                }}
              >
                <CircleDashed />
              </IconButton>
            </Stack>
          </Stack>
          <Stack sx={{ width: "100%" }}>
            <Search>
              <SearchIconWrapper>
                <MagnifyingGlass color="#709CE6" />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search…"
                inputProps={{ "aria-label": "search" }}
              />
            </Search>
          </Stack>
          <Stack spacing={1}>
            <Stack 
              direction={"row"} 
              spacing={1.5} 
              alignItems="center"
              sx={{
                p: 1.5,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'light' 
                    ? 'rgba(0,0,0,0.04)' 
                    : 'rgba(255,255,255,0.04)',
                  cursor: 'pointer'
                },
                transition: 'background-color 0.2s ease-in-out'
              }}
            >
              <ArchiveBox size={24} />
              <Button variant="text">Archive</Button>
            </Stack>
            <Divider sx={{ 
              borderColor: theme.palette.mode === 'light' 
                ? 'rgba(0,0,0,0.08)' 
                : 'rgba(255,255,255,0.08)',
              width: '100%'
            }} />
          </Stack>
          <Stack sx={{ 
            flexGrow: 1, 
            overflow: "auto",
            height: "100%",
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
          }}>
            <SimpleBarStyle timeout={500} clickOnTrack={false}>
              <Stack spacing={2.4}>
                <Typography variant="subtitle2" sx={{ color: "#676667" }}>
                  All Chats
                </Typography>
                {/* Chat List */}
                {conversations.filter((el) => !el.pinned).map((el, idx) => {
                  return <ChatElement key={el.id} {...el} chatType="individual" />;
                })}
              </Stack>
            </SimpleBarStyle>
          </Stack>
        </Stack>
      </Box>
      {openDialog && (
        <Friends open={openDialog} handleClose={handleCloseDialog} />
      )}
    </>
  );
};

export default Chats;