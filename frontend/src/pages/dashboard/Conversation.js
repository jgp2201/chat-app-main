import { Stack, Box } from "@mui/material";
import React, { useEffect, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { SimpleBarStyle } from "../../components/Scrollbar";

import { ChatHeader, ChatFooter } from "../../components/Chat";
import useResponsive from "../../hooks/useResponsive";
import { Chat_History } from "../../data";
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

const Conversation = ({ messages }) => {
  const theme = useTheme();

  return (
    <Box p={3}>
      <Stack spacing={3}>
        {messages.map((el, idx) => {
          switch (el.type) {
            case "divider":
              return <Timeline key={idx} el={el} />;
            case "msg":
              switch (el.subtype) {
                case "img":
                  return <MediaMsg key={idx} el={el} menu={true} />;
                case "doc":
                  return <DocMsg key={idx} el={el} menu={true} />;
                case "link":
                  return <LinkMsg key={idx} el={el} menu={true} />;
                case "reply":
                  return <ReplyMsg key={idx} el={el} menu={true} />;
                default:
                  return <TextMsg key={idx} el={el} menu={true} />;
              }
            default:
              return null;
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

          backgroundColor:
            theme.palette.mode === "light"
              ? "#F0F4FA"
              : theme.palette.background,

          boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
        }}
      >
        <SimpleBarStyle timeout={500} clickOnTrack={false}>
          <Conversation messages={current_messages} />
        </SimpleBarStyle>
      </Box>

      <ChatFooter />
    </Stack>
  );
};

export default ChatComponent;

export { Conversation };