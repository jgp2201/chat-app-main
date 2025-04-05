import React, { useEffect } from "react";
import { Stack } from "@mui/material";
import { Navigate, Outlet } from "react-router-dom";
import useResponsive from "../../hooks/useResponsive";
import SideNav from "./SideNav";
import { useDispatch, useSelector } from "react-redux";
import { FetchUserProfile, SelectConversation, showSnackbar } from "../../redux/slices/app";
import { socket, connectSocket } from "../../socket";
import {
  UpdateDirectConversation,
  AddDirectConversation,
  AddDirectMessage,
  FetchGroupConversations,
  AddGroupConversation,
  UpdateGroupConversation,
  AddGroupMessage,
  RemoveGroupConversation
} from "../../redux/slices/conversation";
import AudioCallNotification from "../../sections/dashboard/Audio/CallNotification";
import VideoCallNotification from "../../sections/dashboard/video/CallNotification";
import {
  PushToAudioCallQueue,
  UpdateAudioCallDialog,
} from "../../redux/slices/audioCall";
import AudioCallDialog from "../../sections/dashboard/Audio/CallDialog";
import VideoCallDialog from "../../sections/dashboard/video/CallDialog";
import { PushToVideoCallQueue, UpdateVideoCallDialog } from "../../redux/slices/videoCall";
import axiosInstance from "../../utils/axios";
import { store } from "../../redux/store";  // Import Redux store directly

const DashboardLayout = () => {
  const isDesktop = useResponsive("up", "md");
  const dispatch = useDispatch();
  const {user_id, token} = useSelector((state) => state.auth);
  const { open_audio_notification_dialog, open_audio_dialog } = useSelector(
    (state) => state.audioCall
  );
  const { open_video_notification_dialog, open_video_dialog } = useSelector(
    (state) => state.videoCall
  );
  const { isLoggedIn } = useSelector((state) => state.auth);
  const { conversations, current_conversation, current_messages } = useSelector(
    (state) => state.conversation.direct_chat
  );

  useEffect(() => {
    dispatch(FetchUserProfile());
    
    // Fetch groups when component mounts
    if (token) {
      fetchGroups();
    }
  }, []);
  
  // Function to fetch groups from the backend
  const fetchGroups = async () => {
    try {
      const response = await axiosInstance.get('/api/group', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        dispatch(FetchGroupConversations({ groups: response.data.data }));
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      dispatch(showSnackbar({
        severity: "error",
        message: "Failed to fetch groups"
      }));
    }
  };

  const handleCloseAudioDialog = () => {
    dispatch(UpdateAudioCallDialog({ state: false }));
  };
  const handleCloseVideoDialog = () => {
    dispatch(UpdateVideoCallDialog({ state: false }));
  };

  useEffect(() => {
    if (isLoggedIn) {
      window.onload = function () {
        if (!window.location.hash) {
          window.location = window.location + "#loaded";
          window.location.reload();
        }
      };

      window.onload();

      if (!socket) {
        connectSocket(user_id);
      }

      socket.on("audio_call_notification", (data) => {
        // TODO => dispatch an action to add this in call_queue
        dispatch(PushToAudioCallQueue(data));
      });
      
      socket.on("video_call_notification", (data) => {
        // TODO => dispatch an action to add this in call_queue
        dispatch(PushToVideoCallQueue(data));
      });

      socket.on("new_message", (data) => {
        const message = data.message;
        console.log(current_conversation, data);
        // check if msg we got is from currently selected conversation
        if (current_conversation?.id === data.conversation_id) {
          // Determine the subtype based on the file type
          let subtype = message.type;
          if (message.file) {
            if (message.file.mimetype.startsWith('image/') || message.file.mimetype.startsWith('video/')) {
              subtype = 'Media';
            } else {
              subtype = 'Document';
            }
          }

          // Create the message object
          const newMessage = {
            id: message._id,
            type: "msg",
            subtype: subtype,
            message: message.text,
            incoming: message.to === user_id,
            outgoing: message.from === user_id,
            file: message.file ? {
              url: message.file.url,
              originalname: message.file.originalname,
              mimetype: message.file.mimetype,
              size: message.file.size
            } : null,
            time: new Date().toISOString()
          };

          // Check if message already exists in current messages
          const messageExists = current_messages.some(msg => msg.id === newMessage.id);
          
          if (!messageExists) {
            dispatch(AddDirectMessage(newMessage));
          }
        }
      });

      // Listen for new group messages
      socket.on("new_group_message", (data) => {
        if (!data || !data.message) {
          console.error("Received invalid group message data:", data);
          return;
        }
        
        const message = data.message;
        const groupId = data.group_id;
        
        if (!message || !groupId) {
          console.error("Missing required message data:", { message, groupId });
          return;
        }
        
        // Get current state from Redux store
        const state = store.getState();
        const currentGroupConversation = state.conversation.group_chat.current_conversation;
        
        if (currentGroupConversation?.id === groupId) {
          // Determine the subtype based on the file type
          let subtype = message.type || "Text";
          if (message.file) {
            if (message.file.mimetype && 
                (message.file.mimetype.startsWith('image/') || 
                 message.file.mimetype.startsWith('video/'))) {
              subtype = 'Media';
            } else {
              subtype = 'Document';
            }
          }

          // Create a safe from object
          let fromObject = { id: "", name: "Unknown User", img: "" };
          if (message.from) {
            if (typeof message.from === 'object') {
              fromObject = {
                id: message.from._id || "",
                name: `${message.from.firstName || ""} ${message.from.lastName || ""}`.trim() || "Unknown User",
                img: message.from.avatar || ""
              };
            } else {
              fromObject = { id: message.from, name: "Unknown User", img: "" };
            }
          }

          // Create the message object with safe fallback values
          const newMessage = {
            id: message._id || `temp-${Date.now()}`,
            type: "msg",
            subtype: subtype,
            message: message.text || "",
            incoming: fromObject.id !== user_id,
            outgoing: fromObject.id === user_id,
            from: fromObject,
            time: new Date().toISOString(),
            created_at: message.created_at || new Date().toISOString()
          };

          if (message.file) {
            newMessage.file = {
              url: message.file.url || "",
              originalname: message.file.originalname || "Unknown File",
              mimetype: message.file.mimetype || "application/octet-stream",
              size: message.file.size || 0
            };
          }
          
          if (message.reply) {
            newMessage.reply = message.reply;
          }

          dispatch(AddGroupMessage(newMessage));
        }
      });

      // Listen for group updates
      socket.on("group_updated", (data) => {
        dispatch(UpdateGroupConversation({ group: data }));
      });

      // Listen for when a user leaves a group
      socket.on("user_left_group", (data) => {
        console.log("User left group event received:", data);
        
        // If the current user is the one who left, remove the group from their list
        if (data.user_id === user_id) {
          dispatch(RemoveGroupConversation(data.group_id));
        } else {
          // Otherwise just update the group to reflect the member leaving
          dispatch(UpdateGroupConversation({ group: data.group }));
        }
      });

      // Listen for new group
      socket.on("new_group", (data) => {
        dispatch(AddGroupConversation({ group: data }));
      });

      socket.on("start_chat", (data) => {
        console.log(data);
        // add / update to conversation list
        const existing_conversation = conversations.find(
          (el) => el?.id === data._id
        );
        if (existing_conversation) {
          // update direct conversation
          dispatch(UpdateDirectConversation({ conversation: data }));
        } else {
          // add direct conversation
          dispatch(AddDirectConversation({ conversation: data }));
        }
        dispatch(SelectConversation({ room_id: data._id }));
      });

      socket.on("new_friend_request", (data) => {
        dispatch(
          showSnackbar({
            severity: "success",
            message: "New friend request received",
          })
        );
      });

      socket.on("request_accepted", (data) => {
        dispatch(
          showSnackbar({
            severity: "success",
            message: "Friend Request Accepted",
          })
        );
      });

      socket.on("request_sent", (data) => {
        dispatch(showSnackbar({ severity: "success", message: data.message }));
      });
    }

    // Remove event listener on component unmount
    return () => {
      socket?.off("new_friend_request");
      socket?.off("request_accepted");
      socket?.off("request_sent");
      socket?.off("start_chat");
      socket?.off("new_message");
      socket?.off("new_group_message");
      socket?.off("group_updated");
      socket?.off("user_left_group");
      socket?.off("new_group");
      socket?.off("audio_call_notification");
    };
  }, [isLoggedIn, socket]);

  if (!isLoggedIn) {
    return <Navigate to={"/auth/login"} />;
  }

  return (
    <>
      <Stack direction="row">
        {isDesktop && (
          // SideBar
          <SideNav />
        )}

        <Outlet />
      </Stack>
      {open_audio_notification_dialog && (
        <AudioCallNotification open={open_audio_notification_dialog} />
      )}
      {open_audio_dialog && (
        <AudioCallDialog
          open={open_audio_dialog}
          handleClose={handleCloseAudioDialog}
        />
      )}
      {open_video_notification_dialog && (
        <VideoCallNotification open={open_video_notification_dialog} />
      )}
      {open_video_dialog && (
        <VideoCallDialog
          open={open_video_dialog}
          handleClose={handleCloseVideoDialog}
        />
      )}
    </>
  );
};

export default DashboardLayout;