import { createSlice } from "@reduxjs/toolkit";
import { socket } from "../../socket";
import axios from "../../utils/axios";

const initialState = {
  open_audio_dialog: false,
  open_audio_notification_dialog: false,
  call_queue: [], // can have max 1 call at any point of time
  incoming: false,
  call_status: "idle", // idle, connecting, ongoing, ended, failed
  current_call_id: null,
  zego_token: null,
  error: null,
};

const slice = createSlice({
  name: "audioCall",
  initialState,
  reducers: {
    pushToAudioCallQueue(state, action) {
      // check audio_call_queue in redux store
      if (state.call_queue.length === 0) {
        state.call_queue.push(action.payload.call);
        state.current_call_id = action.payload.call.id || null;
        state.call_status = "connecting";
        
        if (action.payload.incoming) {
          state.open_audio_notification_dialog = true; // this will open up the call dialog
          state.incoming = true;
        }
        else {
          state.open_audio_dialog = true;
          state.incoming = false;
        }
      } else {
        // if queue is not empty then emit user_is_busy => in turn server will send this event to sender of call
        socket.emit("user_is_busy_audio_call", { ...action.payload });
      }
    },
    resetAudioCallQueue(state, action) {
      state.call_queue = [];
      state.open_audio_notification_dialog = false;
      state.incoming = false;
      state.call_status = "idle";
      state.current_call_id = null;
      state.error = null;
    },
    closeNotificationDialog(state, action) {
      state.open_audio_notification_dialog = false;
    },
    updateCallDialog(state, action) {
      state.open_audio_dialog = action.payload.state;
      state.open_audio_notification_dialog = false;
    },
    updateCallStatus(state, action) {
      state.call_status = action.payload.status;
      if (action.payload.error) {
        state.error = action.payload.error;
      }
    },
    setZegoToken(state, action) {
      state.zego_token = action.payload.token;
    },
  },
});

// Reducer
export default slice.reducer;

// ----------------------------------------------------------------------

export const StartAudioCall = (id) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.resetAudioCallQueue());
    
    try {
      const response = await axios.post(
        "/user/start-audio-call",
        { id },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getState().auth.token}`,
          },
        }
      );
      
      console.log(response);
      
      dispatch(
        slice.actions.pushToAudioCallQueue({
          call: response.data.data,
          incoming: false,
        })
      );
      
      return response.data.data;
    } catch (err) {
      console.error("Error starting audio call:", err);
      dispatch(
        slice.actions.updateCallStatus({
          status: "failed",
          error: err.message || "Failed to start call"
        })
      );
      return null;
    }
  };
};

export const PushToAudioCallQueue = (call) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.pushToAudioCallQueue({ call, incoming: true }));
  };
};

export const ResetAudioCallQueue = () => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.resetAudioCallQueue());
  };
};

export const CloseAudioNotificationDialog = () => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.closeNotificationDialog());
  };
};

export const UpdateAudioCallDialog = ({ state }) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateCallDialog({ state }));
  };
};

export const UpdateCallStatus = (status, error = null) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.updateCallStatus({ status, error }));
  };
};

export const SetZegoToken = (token) => {
  return async (dispatch, getState) => {
    dispatch(slice.actions.setZegoToken({ token }));
  };
};