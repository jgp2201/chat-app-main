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
    reply: null,
    original_message: null
  },
};

const slice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    // Direct chat reducers
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
    },

    // Group chat reducers
    fetchGroupConversations(state, action) {
      const groups = action.payload.groups || [];
      const list = groups.map((group) => {
        const lastMessage = group.messages && group.messages.length > 0 
          ? group.messages[group.messages.length - 1] 
          : null;
        
        // Get avatar URL - handle both S3 and local paths
        let avatarUrl = '';
        if (group.avatar) {
          if (group.avatar.startsWith('http')) {
            avatarUrl = group.avatar;
          } else {
            avatarUrl = `${window.location.protocol}//${window.location.host}/${group.avatar.replace(/\\/g, '/')}`;
          }
        }
        
        return {
          id: group._id,
          name: group.name,
          img: avatarUrl,
          msg: lastMessage?.text || "No messages yet",
          time: lastMessage ? formatMessageTimestamp(lastMessage.created_at) : "",
          unread: 0,
          pinned: false,
          members: group.members.map(member => ({
            id: member.user._id,
            name: `${member.user.firstName} ${member.user.lastName}`,
            img: member.user.avatar ? `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${member.user.avatar}` : '',
            joined_at: member.joined_at
          })),
          admins: group.admins.map(admin => admin._id),
          created_by: group.created_by._id,
          description: group.description || "",
          lastMessageTime: lastMessage?.created_at || group.updatedAt || group.createdAt,
        };
      });

      // Sort by most recent activity
      list.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      
      state.group_chat.conversations = list;
    },
    updateGroupConversation(state, action) {
      const updatedGroup = action.payload.group;
      state.group_chat.conversations = state.group_chat.conversations.map(group => {
        if (group.id !== updatedGroup._id) {
          return group;
        } else {
          const lastMessage = updatedGroup.messages && updatedGroup.messages.length > 0 
            ? updatedGroup.messages[updatedGroup.messages.length - 1] 
            : null;
          
          // Get avatar URL - handle both S3 and local paths
          let avatarUrl = '';
          if (updatedGroup.avatar) {
            if (updatedGroup.avatar.startsWith('http')) {
              avatarUrl = updatedGroup.avatar;
            } else {
              avatarUrl = `${window.location.protocol}//${window.location.host}/${updatedGroup.avatar.replace(/\\/g, '/')}`;
            }
          }
          
          return {
            id: updatedGroup._id,
            name: updatedGroup.name,
            img: avatarUrl,
            msg: lastMessage?.text || "No messages yet",
            time: lastMessage ? formatMessageTimestamp(lastMessage.created_at) : "",
            unread: 0,
            pinned: false,
            members: updatedGroup.members.map(member => ({
              id: member.user._id,
              name: `${member.user.firstName} ${member.user.lastName}`,
              img: member.user.avatar ? `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${member.user.avatar}` : '',
              joined_at: member.joined_at
            })),
            admins: updatedGroup.admins.map(admin => admin._id),
            created_by: updatedGroup.created_by._id,
            description: updatedGroup.description || "",
            lastMessageTime: lastMessage?.created_at || updatedGroup.updatedAt || updatedGroup.createdAt,
          };
        }
      });
    },
    addGroupConversation(state, action) {
      const newGroup = action.payload.group;
      
      // Remove existing group with same ID if any
      state.group_chat.conversations = state.group_chat.conversations.filter(
        group => group.id !== newGroup._id
      );

      // Get avatar URL - handle both S3 and local paths
      let avatarUrl = '';
      if (newGroup.avatar) {
        if (newGroup.avatar.startsWith('http')) {
          avatarUrl = newGroup.avatar;
        } else {
          avatarUrl = `${window.location.protocol}//${window.location.host}/${newGroup.avatar.replace(/\\/g, '/')}`;
        }
      }
      
      // Add new group
      state.group_chat.conversations.push({
        id: newGroup._id,
        name: newGroup.name,
        img: avatarUrl,
        msg: "Group created",
        time: formatMessageTimestamp(newGroup.createdAt),
        unread: 0,
        pinned: false,
        members: newGroup.members.map(member => ({
          id: member.user._id,
          name: `${member.user.firstName} ${member.user.lastName}`,
          img: member.user.avatar ? `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${member.user.avatar}` : '',
          joined_at: member.joined_at
        })),
        admins: newGroup.admins.map(admin => admin._id),
        created_by: newGroup.created_by._id,
        description: newGroup.description || "",
        lastMessageTime: newGroup.createdAt,
      });

      // Re-sort conversations
      state.group_chat.conversations.sort((a, b) => 
        new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );
    },
    setCurrentGroupConversation(state, action) {
      state.group_chat.current_conversation = action.payload;
    },
    fetchGroupMessages(state, action) {
      const messages = action.payload.messages || [];
      
      const formatted_messages = messages.map((el) => {
        if (!el || !el._id) return null;
        
        const baseMessage = {
          id: el._id,
          type: "msg",
          subtype: el.type,
          message: el.text || "",
          incoming: el.from._id !== user_id,
          outgoing: el.from._id === user_id,
          from: {
            id: el.from._id,
            name: `${el.from.firstName} ${el.from.lastName}`,
            img: el.from.avatar ? `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${el.from.avatar}` : ''
          },
          time: formatMessageTimestamp(el.created_at),
          starred: el.starred || false
        };

        if (el.file) {
          baseMessage.file = {
            url: el.file.url,
            originalname: el.file.originalname,
            mimetype: el.file.mimetype,
            size: el.file.size
          };
        }

        return baseMessage;
      }).filter(Boolean);
      
      // Remove duplicates
      const uniqueMessages = formatted_messages.reduce((acc, current) => {
        const exists = acc.find(item => item.id === current.id);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      // Sort messages by time
      uniqueMessages.sort((a, b) => new Date(a.time) - new Date(b.time));
      
      state.group_chat.current_messages = uniqueMessages;
    },
    addGroupMessage(state, action) {
      const message = action.payload;
      
      // Check if message already exists
      const messageExists = state.group_chat.current_messages.some(
        msg => msg.id === message.id
      );
      
      if (!messageExists) {
        state.group_chat.current_messages.push({
          ...message,
          time: formatMessageTimestamp(message.created_at),
          starred: false
        });
        
        // Sort messages by time after adding new one
        state.group_chat.current_messages.sort((a, b) => 
          new Date(a.time) - new Date(b.time)
        );
      }
    },
    setGroupReplyMessage(state, action) {
      state.group_chat.reply = action.payload;
      state.group_chat.original_message = action.payload;
    },
    clearGroupReplyMessage(state) {
      state.group_chat.reply = null;
      state.group_chat.original_message = null;
    },
    deleteGroupMessage(state, action) {
      state.group_chat.current_messages = state.group_chat.current_messages.filter(
        message => message.id !== action.payload
      );
    }
  },
});

// Reducer
export default slice.reducer;

// ----------------------------------------------------------------------

// Direct Chat Action Creators
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

// Group Chat Action Creators
export const FetchGroupConversations = ({ groups }) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.fetchGroupConversations({ groups }));
  };
};

export const AddGroupConversation = ({ group }) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.addGroupConversation({ group }));
  };
};

export const UpdateGroupConversation = ({ group }) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateGroupConversation({ group }));
  };
};

export const SetCurrentGroupConversation = (current_conversation) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setCurrentGroupConversation(current_conversation));
  };
};

export const FetchGroupMessages = ({ messages }) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.fetchGroupMessages({ 
      messages: Array.isArray(messages) ? messages : [] 
    }));
  };
};

export const AddGroupMessage = (message) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.addGroupMessage(message));
  };
};

export const DeleteGroupMessage = (messageId) => {
  return async (dispatch, getState) => {
    const { current_conversation } = getState().conversation.group_chat;
    
    if (!current_conversation) {
      console.error("No group conversation found");
      return;
    }

    const groupId = current_conversation.id || current_conversation._id;

    if (!groupId) {
      console.error("No valid group ID found");
      return;
    }

    // Send delete request to backend first
    socket.emit("delete_group_message", {
      group_id: groupId,
      message_id: messageId
    }, (response) => {
      // Only delete from Redux if server confirms deletion
      if (response && response.success) {
        dispatch(slice.actions.deleteGroupMessage(messageId));
      } else {
        console.error("Failed to delete group message:", response?.error || "Unknown error");
      }
    });
  };
};

export const { 
  SetReplyMessage,
  ClearReplyMessage,
  setGroupReplyMessage: SetGroupReplyMessage,
  clearGroupReplyMessage: ClearGroupReplyMessage
} = slice.actions;