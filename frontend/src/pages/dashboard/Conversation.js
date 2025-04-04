import { Stack, Box } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
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
  AddDirectMessage,
} from "../../redux/slices/conversation";
import { socket } from "../../socket";

const Conversation = ({ isMobile, menu, starred = false }) => {
  const dispatch = useDispatch();
  const { conversations, current_messages } = useSelector(
    (state) => state.conversation.direct_chat
  );
  const { room_id, user_id } = useSelector((state) => state.app);
  const theme = useTheme();
  
  // Force re-render when messages change
  const [messageCount, setMessageCount] = useState(0);
  
  useEffect(() => {
    setMessageCount(current_messages.length);
  }, [current_messages]);
  
  useEffect(() => {
    const current = conversations.find((el) => el?.id === room_id);
    if (!current?.id) return;

    // Set current conversation
    dispatch(SetCurrentConversation(current));

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
  }, [conversations, room_id, dispatch]);

  // Separate effect for socket listeners
  useEffect(() => {
    if (!room_id) return;
    
    const formatMessage = (message) => ({
      id: message._id,
      type: "msg",
      subtype: message.type || "Text",
      message: message.text || "",
      incoming: message.to === user_id,
      outgoing: message.from === user_id,
      time: message.created_at,
      created_at: message.created_at,
      starred: message.starred || false,
      reply: message.reply || null,
      ...(message.file && { file: message.file }),
      ...(message.preview && { preview: message.preview })
    });

    // Handle new messages
    const handleNewMessage = ({ conversation_id, message }) => {
      console.log("New message received:", message);
      if (conversation_id === room_id) {
        dispatch(AddDirectMessage(formatMessage(message)));
      }
    };

    // Handle sent messages
    const handleSentMessage = ({ conversation_id, message }) => {
      console.log("Message sent confirmation:", message);
      if (conversation_id === room_id) {
        dispatch(AddDirectMessage(formatMessage(message)));
      }
    };

    // Set up socket listeners
    socket.on("new_message", handleNewMessage);
    socket.on("message_sent", handleSentMessage);

    // Listen for when this user sends a message and handle it immediately
    socket.on("user_sent_message", ({ conversation_id, message }) => {
      console.log("User sent message:", message);
      if (conversation_id === room_id) {
        dispatch(AddDirectMessage(formatMessage(message)));
        
        // Force a re-render by dispatching an action to update current_messages
        const formattedMsg = formatMessage(message);
        dispatch(FetchCurrentMessages({ 
          messages: [...current_messages, formattedMsg] 
        }));
      }
    });

    // Cleanup function
    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_sent", handleSentMessage);
      socket.off("user_sent_message");
    };
  }, [room_id, user_id, dispatch, current_messages]);

  // Filter messages if starred prop is true
  const displayMessages = starred
    ? current_messages.filter((msg) => msg.starred === true)
    : current_messages;

  return (
    <Box 
      p={isMobile ? 1 : 3}
      sx={{
        height: "100%",
        overflowY: "visible",
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
  const [lastMessageCount, setLastMessageCount] = useState(0);

  const { current_messages } = useSelector(
    (state) => state.conversation.direct_chat
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageListRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = messageListRef.current;
      const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 100;
      
      // Only auto-scroll if user is already near the bottom
      if (isScrolledToBottom) {
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      }
    }
    
    // Update the message count to track changes
    setLastMessageCount(current_messages.length);
  }, [current_messages]);

  // Scroll to bottom
  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  // Force scroll on initial render only
  useEffect(() => {
    // Initial scroll to bottom
    scrollToBottom();
    
    return () => {};
  }, []);

  return (
    <Stack
      height={"100%"}
      maxHeight={"100vh"}
      width={isMobile ? "100vw" : "auto"}
      sx={{
        background: theme.palette.mode === "light" 
          ? "linear-gradient(180deg, #F8FAFF 0%, #F0F4FA 100%)"
          : "linear-gradient(180deg, #1A1A1A 0%, #2D2D2D 100%)",
        position: "relative",
      }}
    >
      <ChatHeader />
      <Box
        ref={messageListRef}
        width={"100%"}
        sx={{
          position: "relative",
          flexGrow: 1,
          overflowY: "auto",
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
        <SimpleBarStyle timeout={500} clickOnTrack={false} autoHide={false}>
          <Conversation key={current_messages.length} menu={true} isMobile={isMobile} />
        </SimpleBarStyle>
      </Box>

      <ChatFooter />
    </Stack>
  );
};

export default ChatComponent;

export { Conversation };