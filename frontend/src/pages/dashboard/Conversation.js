import { Stack, Box } from "@mui/material";
import React, { useEffect, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { SimpleBarStyle } from "../../components/Scrollbar";

import { ChatHeader, ChatFooter } from "../../components/Chat";
import useResponsive from "../../hooks/useResponsive";
import {
  DocMsg,
  LinkMsg,
  MediaMsg,
  ReplyMsg,
  TextMsg,
  Timeline,
} from "../../sections/dashboard/Conversation";
import { useDispatch, useSelector } from "react-redux";
import {
  FetchCurrentMessages,
  SetCurrentConversation,
} from "../../redux/slices/conversation";
import { socket } from "../../socket";

const Conversation = ({ isMobile, menu, starred = false }) => {
  const dispatch = useDispatch();
  const { conversations, current_messages } = useSelector(
    (state) => state.conversation.direct_chat
  );
  const { room_id } = useSelector((state) => state.app);
  const theme = useTheme();

  useEffect(() => {
    const current = conversations.find((el) => el?.id === room_id);

    if (!current?.id) return;

    // Clear existing messages before fetching new ones
    dispatch(FetchCurrentMessages({ messages: [] }));

    // Fetch messages for the current conversation
    socket.emit("get_messages", { conversation_id: current.id }, (data) => {
      console.log(data, "List of messages");
      
      // Remove duplicates based on message ID
      const uniqueMessages = data.reduce((acc, current) => {
        const exists = acc.find(item => item._id === current._id);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);

      dispatch(FetchCurrentMessages({ messages: uniqueMessages }));
    });

    dispatch(SetCurrentConversation(current));

    // Cleanup function to clear messages when component unmounts or conversation changes
    return () => {
      dispatch(FetchCurrentMessages({ messages: [] }));
    };
  }, [conversations, room_id, dispatch]);

  // Filter messages if starred prop is true
  const displayMessages = starred
    ? current_messages.filter((msg) => msg.starred === true)
    : current_messages;

  return (
    <Box 
      p={isMobile ? 1 : 3}
      sx={{
        "&::-webkit-scrollbar": {
          width: "6px",
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          background: theme.palette.mode === "light" 
            ? "rgba(0, 0, 0, 0.1)"
            : "rgba(255, 255, 255, 0.1)",
          borderRadius: "3px",
          "&:hover": {
            background: theme.palette.mode === "light"
              ? "rgba(0, 0, 0, 0.2)"
              : "rgba(255, 255, 255, 0.2)",
          }
        },
      }}
    >
      <Stack spacing={3}>
        {displayMessages.map((el, idx) => {
          switch (el.type) {
            case "divider":
              return <Timeline el={el} key={idx} />;

            case "msg":
              switch (el.subtype) {
                case "Media":
                  return <MediaMsg el={el} menu={menu} key={idx} />;

                case "Document":
                  return <DocMsg el={el} menu={menu} key={idx} />;

                case "Link":
                  return <LinkMsg el={el} menu={menu} preview={el.preview} key={idx} />;

                case "Reply":
                  return <ReplyMsg el={el} menu={menu} key={idx} />;

                default:
                  return <TextMsg el={el} menu={menu} key={idx} />;
              }

            default:
              return null; // Better than returning an empty fragment
          }
        })}
      </Stack>
    </Box>
  );
};

const ChatComponent = () => {
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const theme = useTheme();

  const messageListRef = useRef(null);

  const { current_messages } = useSelector(
    (state) => state.conversation.direct_chat
  );

  useEffect(() => {
    // Scroll to the bottom of the message list when new messages are added
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [current_messages]);

  return (
    <Stack
      height={"100%"}
      maxHeight={"100vh"}
      width={isMobile ? "100vw" : "auto"}
      sx={{
        background: theme.palette.mode === "light" 
          ? "linear-gradient(180deg, #F8FAFF 0%, #F0F4FA 100%)"
          : "linear-gradient(180deg, #1A1A1A 0%, #2D2D2D 100%)",
      }}
    >
      {/*  */}
      <ChatHeader />
      <Box
        ref={messageListRef}
        width={"100%"}
        sx={{
          position: "relative",
          flexGrow: 1,
          overflow: "scroll",
          background: "transparent",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: theme.palette.mode === "light" 
              ? "rgba(0, 0, 0, 0.1)"
              : "rgba(255, 255, 255, 0.1)",
            borderRadius: "3px",
            transition: "all 0.3s ease",
            "&:hover": {
              background: theme.palette.mode === "light"
                ? "rgba(0, 0, 0, 0.2)"
                : "rgba(255, 255, 255, 0.2)",
            }
          },
        }}
      >
        <SimpleBarStyle timeout={500} clickOnTrack={false}>
          <Conversation menu={true} isMobile={isMobile} />
        </SimpleBarStyle>
      </Box>

      {/*  */}
      <ChatFooter />
    </Stack>
  );
};

export default ChatComponent;

export { Conversation };