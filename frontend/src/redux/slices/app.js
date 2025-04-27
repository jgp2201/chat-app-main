import { createSlice } from "@reduxjs/toolkit";
import axios from "../../utils/axios";
import { v4 } from 'uuid';
import S3 from "../../utils/s3";
import { S3_BUCKET_NAME } from "../../config";
import { SetCurrentConversation, SetCurrentGroupConversation } from "./conversation";
// ----------------------------------------------------------------------

const initialState = {
  user: {
    status: null,
  },
  sidebar: {
    open: true,
    type: "CONTACT", // can be CONTACT, STARRED, SHARED
  },
  sharedTab: 0, // 0: Media, 1: Links, 2: Docs
  tab: 0, // [0, 1, 2, 3]
  snackbar: {
    open: null,
    severity: null,
    message: null,
  },
  users: [], // all users of app who are not friends and not requested yet
  all_users: [],
  friends: [], // all friends
  friendRequests: [], // all friend requests
  chat_type: null,
  room_id: null,
  call_logs: [],
  translationSettings: {
    sourceLang: 'auto',
    targetLang: 'en',
    enabled: false
  },
};

const slice = createSlice({
  name: "app",
  initialState,
  reducers: {
    fetchCallLogs(state, action) {
      state.call_logs = action.payload.call_logs;
    },
    fetchUser(state, action) {
      state.user = action.payload.user;
    },
    updateUser(state, action) {
      state.user = action.payload.user;
    },
    updateTranslationSettings(state, action) {
      state.translationSettings = {
        ...state.translationSettings,
        ...action.payload,
      };
    },
    // Toggle Sidebar
    ToggleSidebar(state) {
      state.sidebar.open = !state.sidebar.open;
    },
    UpdateSidebarType(state, action) {
      if (!state.sidebar) {
        state.sidebar = { open: true, type: action.payload };
      } else {
        state.sidebar.type = action.payload;
      }
    },
    SetSharedTab(state, action) {
      state.sharedTab = action.payload;
    },
    updateTab(state, action) {
      state.tab = action.payload.tab;
    },

    openSnackBar(state, action) {
      console.log(action.payload);
      state.snackbar.open = true;
      state.snackbar.severity = action.payload.severity;
      state.snackbar.message = action.payload.message;
    },
    closeSnackBar(state) {
      console.log("This is getting executed");
      state.snackbar.open = false;
      state.snackbar.message = null;
    },
    updateUsers(state, action) {
      state.users = action.payload.users;
    },
    updateAllUsers(state, action) {
      state.all_users = action.payload.users;
    },
    updateFriends(state, action) {
      state.friends = action.payload.friends;
    },
    updateFriendRequests(state, action) {
      state.friendRequests = action.payload.requests;
    },
    selectConversation(state, action) {
      state.chat_type = action.payload.chat_type || "individual";
      state.room_id = action.payload.room_id;
    },
  },
});

// Reducer
export default slice.reducer;

// ----------------------------------------------------------------------

export const closeSnackBar = () => async (dispatch, getState) => {
  dispatch(slice.actions.closeSnackBar());
};

export const showSnackbar =
  ({ severity, message }) =>
  async (dispatch, getState) => {
    dispatch(
      slice.actions.openSnackBar({
        message,
        severity,
      })
    );

    setTimeout(() => {
      dispatch(slice.actions.closeSnackBar());
    }, 4000);
  };

export const ToggleSidebar = () => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.ToggleSidebar());
  };
};

export const UpdateSidebarType = (type) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.UpdateSidebarType(type));
  };
};

export const SetSharedTab = (tab) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.SetSharedTab(tab));
  };
};

export function UpdateTab(tab) {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateTab({ tab }));
  };
}

export function FetchUsers() {
  return async (dispatch, getState) => {
    await axios
      .get(
        "/user/get-users",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getState().auth.token}`,
          },
        }
      )
      .then((response) => {
        console.log(response);
        dispatch(slice.actions.updateUsers({ users: response.data.data }));
      })
      .catch((err) => {
        console.log(err);
      });
  };
}
export function FetchAllUsers() {
  return async (dispatch, getState) => {
    await axios
      .get(
        "/user/get-all-verified-users",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getState().auth.token}`,
          },
        }
      )
      .then((response) => {
        console.log(response);
        dispatch(slice.actions.updateAllUsers({ users: response.data.data }));
      })
      .catch((err) => {
        console.log(err);
      });
  };
}
export function FetchFriends() {
  return async (dispatch, getState) => {
    await axios
      .get(
        "/user/get-friends",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getState().auth.token}`,
          },
        }
      )
      .then((response) => {
        console.log(response);
        dispatch(slice.actions.updateFriends({ friends: response.data.data }));
      })
      .catch((err) => {
        console.log(err);
      });
  };
}
export function FetchFriendRequests() {
  return async (dispatch, getState) => {
    await axios
      .get(
        "/user/get-requests",

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getState().auth.token}`,
          },
        }
      )
      .then((response) => {
        console.log(response);
        dispatch(
          slice.actions.updateFriendRequests({ requests: response.data.data })
        );
      })
      .catch((err) => {
        console.log(err);
      });
  };
}

export const SelectConversation = ({ room_id, chat_type = "individual" }) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.selectConversation({ room_id, chat_type }));
    
    // Find and set the current conversation based on chat_type
    const { conversation } = getState();
    
    if (chat_type === "individual") {
      const current = conversation.direct_chat.conversations.find(
        (el) => el.id === room_id
      );
      if (current) {
        dispatch(SetCurrentConversation(current));
      }
    } else if (chat_type === "group") {
      const current = conversation.group_chat.conversations.find(
        (el) => el.id === room_id
      );
      if (current) {
        dispatch(SetCurrentGroupConversation(current));
      }
    }
  };
};

export const FetchCallLogs = () => {
  return async (dispatch, getState) => {
    axios
      .get("/user/get-call-logs", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getState().auth.token}`,
        },
      })
      .then((response) => {
        console.log(response);
        dispatch(slice.actions.fetchCallLogs({ call_logs: response.data.data }));
      })
      .catch((err) => {
        console.log(err);
      });
  };
};
export const FetchUserProfile = () => {
  return async (dispatch, getState) => {
    axios
      .get("/user/get-me", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getState().auth.token}`,
        },
      })
      .then((response) => {
        console.log(response);
        dispatch(slice.actions.fetchUser({ user: response.data.data }));
      })
      .catch((err) => {
        console.log(err);
      });
  };
};
export const UpdateUserProfile = (formValues) => {
  return async (dispatch, getState) => {
    const file = formValues.avatar;

    const key = v4();

    try {
      S3.getSignedUrl(
        "putObject",
        { Bucket: S3_BUCKET_NAME, Key: key, ContentType: `image/${file.type}` },
        async (_err, presignedURL) => {
          await fetch(presignedURL, {
            method: "PUT",
  
            body: file,
  
            headers: {
              "Content-Type": file.type,
            },
          });
        }
      );
    }
    catch(error) {
      console.log(error);
    }

    

    axios
      .patch(
        "/user/update-me",
        { ...formValues, avatar: key },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getState().auth.token}`,
          },
        }
      )
      .then((response) => {
        console.log(response);
        dispatch(slice.actions.updateUser({ user: response.data.data }));
      })
      .catch((err) => {
        console.log(err);
      });
  };
};

export const UpdateTranslationSettings = (settings) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateTranslationSettings(settings));
  };
};