import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Link,
  Divider,
} from "@mui/material";
import { MagnifyingGlass, Plus } from "phosphor-react";
import { useTheme } from "@mui/material/styles";
import { SimpleBarStyle } from "../../components/Scrollbar";
import { ChatList } from "../../data";
import ChatElement from "../../components/ChatElement";
import {
  Search,
  SearchIconWrapper,
  StyledInputBase,
} from "../../components/Search";
import NoChat from "../../assets/Illustration/NoChat";
import CreateGroup from "../../sections/dashboard/CreateGroup";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import ChatComponent from "./Conversation";
import Contact from "../../sections/dashboard/Contact";
import StarredMessages from "../../sections/dashboard/StarredMessages";
import Media from "../../sections/dashboard/SharedMessages";


const Group = () => {
  const [openDialog, setOpenDialog] = useState(false);

  const handleCloseDialog = () => {
    setOpenDialog(false);
  }
  const handleOpenDialog = () => {
    setOpenDialog(true);
  }
  const { sidebar, room_id, chat_type } = useSelector((state) => state.app);
  const { conversations, current_conversation } = useSelector((state) => state.conversation.group_chat);
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  return (
    <>
      <Stack direction="row" sx={{ width: "100%" }}>
        {/* Left */}
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
              <Typography variant="h5" fontWeight="600">Groups</Typography>
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
                Create New Group
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
                <Plus style={{ color: theme.palette.primary.main }} />
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
              <Typography variant="subtitle2" sx={{ color: "#676667", mb: 1 }}>
                All Groups
              </Typography>
              {/* Group List */}
              <Stack spacing={1.5}>
                {Array.isArray(conversations) && conversations.length > 0 ? 
                  conversations.filter((el) => el && !el.pinned).map((el, idx) => {
                    return <ChatElement key={el.id || idx} {...el} chatType="group" />;
                  })
                : 
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No groups available
                  </Typography>
                }
              </Stack>
            </Stack>
          </Stack>
        </Box>
        {/* Right */}
        <Box
          sx={{
            height: "100%",
            width: sidebar.open
              ? `calc(100vw - 740px )`
              : "calc(100vw - 420px )",
            backgroundColor:
              theme.palette.mode === "light"
                ? "#FFF"
                : theme.palette.background.paper,
            borderBottom:
              searchParams.get("type") === "individual-chat" &&
                searchParams.get("id")
                ? "0px"
                : "6px solid #0162C4",
          }}
        >
          {chat_type === "group" &&
            room_id !== null && current_conversation!=null ? (
            <ChatComponent />
          ) : (
            <Stack
              spacing={2}
              sx={{ height: "100%", width: "100%" }}
              alignItems="center"
              justifyContent={"center"}
            >
              <NoChat />
              <Typography variant="subtitle2">
                Select a conversation or start a{" "}
                <Link
                  style={{
                    color: theme.palette.primary.main,
                    textDecoration: "none",
                  }}
                  to="/"
                >
                  new one
                </Link>
              </Typography>
            </Stack>
          )}
        </Box>
        {sidebar.open &&
          (() => {
            switch (sidebar.type) {
              case "CONTACT":
                return <Contact />;

              case "STARRED":
                return <StarredMessages />;

              case "SHARED":
                return <Media />;

              default:
                break;
            }
          })()}
      </Stack>
      {openDialog && <CreateGroup open={openDialog} handleClose={handleCloseDialog} />}
    </>
  );
};

export default Group;