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
  FetchGroupMessages,
  AddGroupMessage,
} from "../../redux/slices/conversation";
import { socket } from "../../socket";

const Conversation = ({ isMobile, menu, starred = false }) => {
  const dispatch = useDispatch();
  const { chat_type, room_id, user_id } = useSelector((state) => state.app);
  const theme = useTheme();
  
  // Get the appropriate conversations and messages based on chat_type
  const { 
    direct_chat: { conversations: directConversations, current_messages: directMessages },
    group_chat: { conversations: groupConversations, current_messages: groupMessages, current_conversation: groupCurrentConversation }
  } = useSelector((state) => state.conversation);
  
  // Get the correct conversations and messages based on chat type
  const conversations = chat_type === "group" 
    ? (groupConversations || []) 
    : (directConversations || []);
  const current_messages = chat_type === "group" 
    ? (groupMessages || []) 
    : (directMessages || []);
  
  // Debug log messages
  useEffect(() => {
    console.log("Current messages:", current_messages);
    console.log("Room ID:", room_id);
    console.log("Chat type:", chat_type);
  }, [current_messages, room_id, chat_type]);
  
  // Force re-render when messages change
  const [messageCount, setMessageCount] = useState(0);
  
  useEffect(() => {
    setMessageCount(current_messages.length);
  }, [current_messages]);
  
  useEffect(() => {
    // Safety check for missing room_id or empty conversations
    if (!room_id || !conversations || conversations.length === 0) return;
    
    const current = conversations.find((el) => el?.id === room_id);
    if (!current?.id) return;

    if (chat_type === "individual") {
      // Set current conversation for direct chat
      dispatch(SetCurrentConversation(current));

      // Fetch messages for the current direct conversation
      socket.emit("get_messages", { conversation_id: current.id }, (data) => {
        console.log(data, "List of direct messages");
        
        // Check if data is valid before processing
        if (!data || !Array.isArray(data)) {
          console.error("Invalid response from get_messages:", data);
          dispatch(FetchCurrentMessages({ messages: [] }));
          return;
        }
        
        // Remove duplicates based on message ID
        const uniqueMessages = data.reduce((acc, current) => {
          if (!current || !current._id) return acc;
          const exists = acc.find(item => item._id === current._id);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);

        dispatch(FetchCurrentMessages({ messages: uniqueMessages }));
      });
    } else if (chat_type === "group") {
      // Fetch messages for the current group conversation
      socket.emit("get_group_messages", { group_id: current.id }, (data) => {
        console.log(data, "List of group messages");
        
        if (!data || !data.success || !Array.isArray(data.messages)) {
          console.error("Failed to fetch group messages:", data?.error || "Invalid response format");
          dispatch(FetchGroupMessages({ messages: [] }));
          return;
        }
        
        // Remove duplicates based on message ID
        const uniqueMessages = data.messages.reduce((acc, current) => {
          if (!current || !current._id) return acc;
          const exists = acc.find(item => item._id === current._id);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        dispatch(FetchGroupMessages({ messages: uniqueMessages }));
      });
    }
  }, [conversations, room_id, chat_type, dispatch]);

  // Separate effect for socket listeners
  useEffect(() => {
    if (!room_id) return;
    
    const formatDirectMessage = (message) => ({
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

    const formatGroupMessage = (message) => {
      // Ensure message is not null/undefined and has required properties
      if (!message || !message._id) {
        console.error("Invalid group message format:", message);
        return null;
      }

      // Handle case when from is an object or just an ID
      const fromId = message.from?._id || message.from;
      let fromName = '';
      let fromImg = '';
      
      // Case 1: from is a complete object with user details
      if (typeof message.from === 'object' && message.from !== null) {
        fromName = `${message.from.firstName || ''} ${message.from.lastName || ''}`.trim();
        fromImg = message.from.avatar || '';
      } else {
        // Case 2: Try to find the user in the current group conversation's members
        if (groupCurrentConversation && groupCurrentConversation.members) {
          const sender = groupCurrentConversation.members.find(member => member.id === fromId);
          if (sender) {
            fromName = sender.name;
            fromImg = sender.img || '';
          }
        }
      }
      
      // If name is still empty, use fallbacks
      if (!fromName) {
        fromName = fromId === user_id ? 'You' : 'User';
      }

      // Build complete message object
      const formattedMsg = {
        id: message._id,
        type: "msg",
        subtype: message.type || "Text",
        message: message.text || "",
        incoming: fromId !== user_id,
        outgoing: fromId === user_id,
        time: message.created_at,
        created_at: message.created_at,
        starred: message.starred || false,
        from: {
          id: fromId,
          name: fromName,
          img: fromImg
        },
        ...(message.file && { file: message.file })
      };
      
      // Handle reply messages
      if (message.reply) {
        // Try to enhance reply with sender name information
        let replyFromName = message.reply.fromName;
        const replyFromId = typeof message.reply.from === 'object' 
          ? message.reply.from.id 
          : message.reply.from;
        
        if (!replyFromName) {
          if (replyFromId === user_id) {
            replyFromName = 'You';
          } else if (groupCurrentConversation && groupCurrentConversation.members) {
            const replySender = groupCurrentConversation.members.find(member => member.id === replyFromId);
            if (replySender) {
              replyFromName = replySender.name;
            }
          }
        }
        
        formattedMsg.reply = {
          ...message.reply,
          fromName: replyFromName || 'User',
          // Ensure from field is just the ID to prevent circular objects
          from: replyFromId
        };
      }
      
      return formattedMsg;
    };

    // Handle new direct messages
    const handleNewDirectMessage = ({ conversation_id, message }) => {
      console.log("New direct message received:", message);
      if (conversation_id === room_id) {
        const formattedMessage = formatDirectMessage(message);
        console.log("Formatted direct message:", formattedMessage);
        dispatch(AddDirectMessage(formattedMessage));
      }
    };

    // Handle sent direct messages
    const handleSentDirectMessage = ({ conversation_id, message }) => {
      console.log("Direct message sent confirmation:", message);
      if (conversation_id === room_id) {
        const formattedMessage = formatDirectMessage(message);
        console.log("Formatted sent message:", formattedMessage);
        dispatch(AddDirectMessage(formattedMessage));
      }
    };

    // Handle new group messages
    const handleNewGroupMessage = ({ group_id, message }) => {
      console.log("New group message received:", message);
      if (group_id === room_id) {
        const formattedMessage = formatGroupMessage(message);
        if (formattedMessage) {
          dispatch(AddGroupMessage(formattedMessage));
        }
      }
    };

    // Set up socket listeners based on chat type
    if (chat_type === "individual") {
      socket.on("new_message", handleNewDirectMessage);
      socket.on("message_sent", handleSentDirectMessage);

      // Listen for when this user sends a message and handle it immediately
      socket.on("user_sent_message", ({ conversation_id, message }) => {
        console.log("User sent direct message:", message);
        if (conversation_id === room_id) {
          const formattedMsg = formatDirectMessage(message);
          dispatch(AddDirectMessage(formattedMsg));
          
          // Force a re-render by dispatching an action to update current_messages
          dispatch(FetchCurrentMessages({ 
            messages: [...directMessages, formattedMsg] 
          }));
        }
      });
    } else if (chat_type === "group") {
      socket.on("new_group_message", handleNewGroupMessage);
      
      // Listen for when this user sends a group message
      socket.on("user_sent_group_message", ({ group_id, message }) => {
        console.log("User sent group message:", message);
        if (group_id === room_id) {
          const formattedMsg = formatGroupMessage(message);
          if (formattedMsg) {
            dispatch(AddGroupMessage(formattedMsg));
          }
        }
      });
    }

    // Cleanup function
    return () => {
      if (chat_type === "individual") {
        socket.off("new_message", handleNewDirectMessage);
        socket.off("message_sent", handleSentDirectMessage);
        socket.off("user_sent_message");
      } else if (chat_type === "group") {
        socket.off("new_group_message", handleNewGroupMessage);
        socket.off("user_sent_group_message");
      }
    };
  }, [room_id, chat_type, dispatch, user_id, directMessages]);

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
            : "rgba(237, 235, 235, 0.1)",
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
        {displayMessages && displayMessages.length > 0 ? (
          displayMessages.map((el, idx) => {
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
          })
        ) : (
          <Box sx={{ width: "100%", textAlign: "center", py: 3 }}>
            {room_id ? "No messages yet" : "Select a conversation to start chatting"}
          </Box>
        )}
      </Stack>
    </Box>
  );
};

const ChatComponent = () => {
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const theme = useTheme();
  const { chat_type, room_id } = useSelector((state) => state.app);
  
  const messageListRef = useRef(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  
  // Helper function to get the correct wallpaper
  const getWallpaperFromStorage = () => {
    // Try to get the conversation-specific wallpaper first
    if (room_id) {
      const conversationKey = `wallpaper_${chat_type}_${room_id}`;
      const conversationWallpaper = localStorage.getItem(conversationKey);
      if (conversationWallpaper) {
        // Cache it in persistent storage
        try {
          localStorage.setItem(`wallpaper_cache_${conversationKey}`, conversationWallpaper);
          sessionStorage.setItem(`wallpaper_cache_${conversationKey}`, conversationWallpaper);
        } catch (error) {
          console.log("Storage error:", error);
        }
        return conversationWallpaper;
      }
      
      // Check for cached version
      const cachedWallpaper = localStorage.getItem(`wallpaper_cache_${conversationKey}`) || 
                             sessionStorage.getItem(`wallpaper_cache_${conversationKey}`);
      if (cachedWallpaper) {
        return cachedWallpaper;
      }
    }
    
    // Fall back to global wallpaper
    const globalWallpaper = localStorage.getItem('chat_wallpaper');
    if (globalWallpaper) {
      // Cache the global wallpaper too
      try {
        localStorage.setItem('wallpaper_cache_global', globalWallpaper);
        sessionStorage.setItem('wallpaper_cache_global', globalWallpaper);
      } catch (error) {
        console.log("Storage error:", error);
      }
      return globalWallpaper;
    }
    
    // Check for cached global wallpaper
    return localStorage.getItem('wallpaper_cache_global') || 
           sessionStorage.getItem('wallpaper_cache_global') || 
           null;
  };
  
  // Get conversation-specific wallpaper or fall back to global wallpaper
  const [wallpaper, setWallpaper] = useState(getWallpaperFromStorage);
  
  // Keep wallpaper in sessionStorage as a backup
  useEffect(() => {
    if (wallpaper) {
      sessionStorage.setItem('current_wallpaper', wallpaper);
    }
  }, [wallpaper]);

  // Listen for wallpaper changes
  useEffect(() => {
    const updateWallpaper = () => {
      // Check for conversation-specific wallpaper first
      if (room_id) {
        const conversationKey = `wallpaper_${chat_type}_${room_id}`;
        // Check primary location
        const conversationWallpaper = localStorage.getItem(conversationKey);
        
        if (conversationWallpaper) {
          // Update cache and set wallpaper
          try {
            localStorage.setItem(`wallpaper_cache_${conversationKey}`, conversationWallpaper);
            sessionStorage.setItem(`wallpaper_cache_${conversationKey}`, conversationWallpaper);
          } catch (error) {
            console.log("Storage error:", error);
          }
          setWallpaper(conversationWallpaper);
          return;
        }
        
        // Check cached version
        const cachedWallpaper = localStorage.getItem(`wallpaper_cache_${conversationKey}`) || 
                              sessionStorage.getItem(`wallpaper_cache_${conversationKey}`);
        if (cachedWallpaper) {
          setWallpaper(cachedWallpaper);
          return;
        }
      }
      
      // Fall back to global wallpaper
      const globalWallpaper = localStorage.getItem('chat_wallpaper');
      if (globalWallpaper) {
        // Update cache and set wallpaper
        try {
          localStorage.setItem('wallpaper_cache_global', globalWallpaper);
          sessionStorage.setItem('wallpaper_cache_global', globalWallpaper);
        } catch (error) {
          console.log("Storage error:", error);
        }
        setWallpaper(globalWallpaper);
        return;
      }
      
      // Check for cached global wallpaper
      const cachedGlobalWallpaper = localStorage.getItem('wallpaper_cache_global') || 
                                  sessionStorage.getItem('wallpaper_cache_global');
      if (cachedGlobalWallpaper) {
        setWallpaper(cachedGlobalWallpaper);
        return;
      }
      
      // As a last resort, check sessionStorage backup
      const backupWallpaper = sessionStorage.getItem('current_wallpaper');
      if (backupWallpaper && wallpaper !== backupWallpaper) {
        setWallpaper(backupWallpaper);
      }
    };
    
    // Run when component mounts or room_id/chat_type changes
    updateWallpaper();
    
    // Handle storage events (when wallpaper is changed from another tab)
    const handleStorageChange = (e) => {
      // Only update if the change is related to wallpaper
      if (e && (e.key === 'chat_wallpaper' || e.key?.startsWith('wallpaper_'))) {
        updateWallpaper();
      } else if (!e) {
        // Called directly without an event
        updateWallpaper();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Instead of polling, use a custom event for same-tab updates
    window.addEventListener('wallpaper_update', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wallpaper_update', handleStorageChange);
    };
  }, [room_id, chat_type]);

  const currentMessages = useSelector(
    (state) => {
      const messages = chat_type === "group" 
        ? state.conversation.group_chat.current_messages 
        : state.conversation.direct_chat.current_messages;
      return Array.isArray(messages) ? messages : [];
    }
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
    setLastMessageCount(currentMessages.length);
  }, [currentMessages]);

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
    
    // Cleanup any references when component unmounts
    return () => {
      // Release any references to DOM elements
      messageListRef.current = null;
    };
  }, []);

  return (
    <Stack
      height={"100%"}
      maxHeight={"100vh"}
      width={isMobile ? "100vw" : "auto"}
      sx={{
        background: wallpaper 
          ? 'none' 
          : (theme.palette.mode === "light" 
          ? "#dde5ed"
              : "linear-gradient(180deg, #1A1A1A 0%, #2D2D2D 100%)"),
        position: "relative",
        ...(wallpaper && {
          backgroundImage: `url(${wallpaper})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.palette.mode === "light"
              ? 'rgba(255, 255, 255, 0.6)'
              : 'rgba(0, 0, 0, 0.6)',
            zIndex: 0,
            pointerEvents: 'none', // Ensure overlay doesn't block interactions
          }
        })
      }}
    >
      {/* ChatHeader with higher z-index to stay above the wallpaper overlay */}
      <Box sx={{ position: "relative", zIndex: 5 }}>
      <ChatHeader />
      </Box>
      <Box
        ref={messageListRef}
        width={"100%"}
        sx={{
          position: "relative",
          flexGrow: 1,
          overflowY: "auto",
          background: "transparent",
          zIndex: 1,
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
          scrollBehavior: "auto",
        }}
      >
        <Stack spacing={3} sx={{ position: "relative", zIndex: 2, padding: 3 }}>
        <Conversation isMobile={isMobile} menu={true} />
        </Stack>
      </Box>
      {/* ChatFooter with higher z-index to stay above the wallpaper overlay */}
      <Box sx={{ position: "relative", zIndex: 5 }}>
      <ChatFooter />
      </Box>
    </Stack>
  );
};

export default ChatComponent;
export { Conversation };