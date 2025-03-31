import { createSlice } from "@reduxjs/toolkit";
import { AWS_S3_REGION, S3_BUCKET_NAME } from "../../config";
import { socket } from "../../socket";

const user_id = window.localStorage.getItem("user_id");

const formatMessageTimestamp = (created_at) => {
  if (!created_at) return "";
  const now = new Date();
  const messageDate = new Date(created_at);
  
  // If message is from today, show time
  if (messageDate.toDateString() === now.toDateString()) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // If message is from yesterday, show "Yesterday"
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  
  // If message is from this year, show date without year
  if (messageDate.getFullYear() === now.getFullYear()) {
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  // For older messages, show full date
  return messageDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

const initialState = {
  direct_chat: {
    conversations: [],
    current_conversation: null,
    current_messages: [],
    reply: null,
    original_message: null
  },
  group_chat: {
    conversations: [],
    current_conversation: null,
    current_messages: [],
  },
};

const slice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    fetchDirectConversations(state, action) {
      const list = action.payload.conversations.map((el) => {
        const user = el.participants.find(
          (elm) => elm?._id?.toString() !== user_id
        );
        const lastMessage = el.messages[el.messages.length - 1];
        
        return {
          id: el._id,
          user_id: user?._id,
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          online: user?.status === "Online",
          img: user?.avatar ? `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${user.avatar}` : '',
          msg: lastMessage?.text || "", 
          time: formatMessageTimestamp(lastMessage?.created_at),
          unread: 0,
          pinned: false,
          about: user?.about,
          lastMessageTime: lastMessage?.created_at || new Date(),
        };
      }).filter(Boolean); // Remove any null entries

      // Sort conversations by most recent message
      list.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

      state.direct_chat.conversations = list;
    },
    updateDirectConversation(state, action) {
      const this_conversation = action.payload.conversation;
      state.direct_chat.conversations = state.direct_chat.conversations.map(
        (el) => {
          if (el?.id !== this_conversation._id) {
            return el;
          } else {
            const user = this_conversation.participants.find(
              (elm) => elm._id.toString() !== user_id
            );
            const lastMessage = this_conversation.messages[this_conversation.messages.length - 1];
            
            return {
              id: this_conversation._id._id,
              user_id: user?._id,
              name: `${user?.firstName} ${user?.lastName}`,
              online: user?.status === "Online",
              img: `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${user?.avatar}`,
              msg: lastMessage?.text || "",
              time: formatMessageTimestamp(lastMessage?.created_at),
              unread: 0,
              pinned: false,
              lastMessageTime: lastMessage?.created_at || new Date(),
            };
          }
        }
      );
    },
    addDirectConversation(state, action) {
      const this_conversation = action.payload.conversation;
      const user = this_conversation.participants.find(
        (elm) => elm._id.toString() !== user_id
      );
      const lastMessage = this_conversation.messages[this_conversation.messages.length - 1];

      state.direct_chat.conversations = state.direct_chat.conversations.filter(
        (el) => el?.id !== this_conversation._id
      );
      state.direct_chat.conversations.push({
        id: this_conversation._id._id,
        user_id: user?._id,
        name: `${user?.firstName} ${user?.lastName}`,
        online: user?.status === "Online",
        img: `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${user?.avatar}`,
        msg: lastMessage?.text || "",
        time: formatMessageTimestamp(lastMessage?.created_at),
        unread: 0,
        pinned: false,
        lastMessageTime: lastMessage?.created_at || new Date(),
      });

      // Re-sort conversations after adding new one
      state.direct_chat.conversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    },
    setCurrentConversation(state, action) {
      state.direct_chat.current_conversation = action.payload;
    },
    fetchCurrentMessages(state, action) {
      const messages = action.payload.messages || [];
      const formatted_messages = messages.map((el) => {
        if (!el || !el._id) return null;
        
        const baseMessage = {
          id: el._id,
          type: "msg",
          subtype: el.type,
          message: el.text || "",
          incoming: el.to === user_id,
          outgoing: el.from === user_id,
          time: formatMessageTimestamp(el.created_at),
          starred: el.starred || false,
          reply: el.reply || null
        };

        // Add file details if present
        if (el.file) {
          baseMessage.file = {
            url: el.file.url,
            originalname: el.file.originalname,
            mimetype: el.file.mimetype,
            size: el.file.size
          };
        }

        return baseMessage;
      }).filter(Boolean); // Remove any null messages
      
      // Remove duplicates based on message ID
      const uniqueMessages = formatted_messages.reduce((acc, current) => {
        const exists = acc.find(item => item.id === current.id);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      // Sort messages by time
      uniqueMessages.sort((a, b) => new Date(a.time) - new Date(b.time));
      
      state.direct_chat.current_messages = uniqueMessages;
    },
    addDirectMessage(state, action) {
      const message = {
        ...action.payload,
        time: formatMessageTimestamp(action.payload.created_at),
        starred: false
      };
      
      // Check if message already exists
      const messageExists = state.direct_chat.current_messages.some(
        msg => msg.id === message.id
      );
      
      if (!messageExists) {
        state.direct_chat.current_messages.push(message);
        // Sort messages by time after adding new one
        state.direct_chat.current_messages.sort((a, b) => new Date(a.time) - new Date(b.time));
      }
    },
    toggleStarMessage(state, action) {
      const messageId = action.payload;
      state.direct_chat.current_messages = state.direct_chat.current_messages.map(msg => {
        if (msg.id === messageId) {
          return { ...msg, starred: !msg.starred };
        }
        return msg;
      });
    },
    DeleteMessage(state, action) {
      state.direct_chat.current_messages = state.direct_chat.current_messages.filter(
        (message) => message.id !== action.payload
      );
    },
    SetReplyMessage(state, action) {
      state.direct_chat.reply = action.payload;
      state.direct_chat.original_message = action.payload;
    },
    ClearReplyMessage(state) {
      state.direct_chat.reply = null;
      state.direct_chat.original_message = null;
    }
  },
});

// Reducer
export default slice.reducer;

// ----------------------------------------------------------------------

export const FetchDirectConversations = ({ conversations }) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.fetchDirectConversations({ conversations }));
  };
};
export const AddDirectConversation = ({ conversation }) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.addDirectConversation({ conversation }));
  };
};
export const UpdateDirectConversation = ({ conversation }) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateDirectConversation({ conversation }));
  };
};

export const SetCurrentConversation = (current_conversation) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setCurrentConversation(current_conversation));
  };
};


export const FetchCurrentMessages = ({messages}) => {
  return async(dispatch, getState) => {
    dispatch(slice.actions.fetchCurrentMessages({messages: Array.isArray(messages) ? messages : []}));
  }
}

export const AddDirectMessage = (message) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.addDirectMessage({message}));
  }
}

export const ToggleStarMessage = (messageId) => {
  return async (dispatch, getState) => {
    const { current_conversation, current_messages } = getState().conversation.direct_chat;
    console.log("Toggling star for message:", messageId);
    console.log("Current conversation:", current_conversation);

    if (!current_conversation) {
      console.error("No conversation found");
      return;
    }

    // Handle both possible ID structures
    const conversationId = current_conversation.id || current_conversation._id;

    if (!conversationId) {
      console.error("No valid conversation ID found");
      return;
    }

    // Find current star status of the message
    const message = current_messages.find(msg => msg.id === messageId);
    if (!message) {
      console.error("Message not found");
      return;
    }

    console.log("Using conversation ID:", conversationId);

    // Send star request to backend first
    socket.emit("toggle_star_message", {
      conversation_id: conversationId,
      message_id: messageId,
      starred: !message.starred
    }, (response) => {
      console.log("Toggle star response:", response);
      
      // Only update Redux if server confirms the change
      if (response && response.success) {
        dispatch(slice.actions.toggleStarMessage(messageId));
      } else {
        console.error("Failed to toggle star:", response?.error || "Unknown error");
      }
    });
  }
};

export const DeleteMessage = (messageId) => {
  return async (dispatch, getState) => {
    const { current_conversation } = getState().conversation.direct_chat;
    console.log("Deleting message:", messageId);
    console.log("Current conversation:", current_conversation);

    if (!current_conversation) {
      console.error("No conversation found");
      return;
    }

    // Handle both possible ID structures
    const conversationId = current_conversation.id || current_conversation._id;

    if (!conversationId) {
      console.error("No valid conversation ID found");
      return;
    }

    console.log("Using conversation ID:", conversationId);

    // Send delete request to backend first
    socket.emit("delete_message", {
      conversation_id: conversationId,
      message_id: messageId
    }, (response) => {
      console.log("Delete message response:", response);
      
      // Only delete from Redux if server confirms deletion
      if (response && response.success) {
        dispatch(slice.actions.DeleteMessage(messageId));
      } else {
        console.error("Failed to delete message:", response?.error || "Unknown error");
      }
    });
  }
};

export const { 
  SetReplyMessage,
  ClearReplyMessage
} = slice.actions;