import React, { useRef, useState } from "react";
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Slide,
  Stack,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";

import { ZegoExpressEngine } from "zego-express-engine-webrtc";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import axiosInstance from "../../../utils/axios";
import { useTheme } from "@mui/material/styles";
import { Phone, MicrophoneSlash, Microphone } from "phosphor-react";

import { socket } from "../../../socket";
import { ResetAudioCallQueue, UpdateCallStatus } from "../../../redux/slices/audioCall";
import { AWS_S3_REGION, S3_BUCKET_NAME } from "../../../config";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CallDialog = ({ open, handleClose }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user } = useSelector((state) => state.app);
  const audioStreamRef = useRef(null);
  const zgRef = useRef(null);
  const [callStatus, setCallStatus] = useState("connecting"); // connecting, ongoing, ended
  const [isMuted, setIsMuted] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const timerRef = useRef(null);

  //* Use params from call_details if available => like in case of receiver's end
  const [call_details] = useSelector((state) => state.audioCall.call_queue);
  const { incoming } = useSelector((state) => state.audioCall);
  const { token } = useSelector((state) => state.auth);

  const appID = 579088592;
  const server = "wss://webliveroom579088592-api.coolzcloud.com/ws";

  // roomID => ID of conversation => current_conversation.id
  // token => generate on backend & get on App
  // userID => ID of this user
  // userName => slug formed by user's name

  const roomID = call_details?.roomID;
  const userID = call_details?.userID;
  const userName = call_details?.userName;
  const streamID = call_details?.streamID;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMuteToggle = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.muteAudio(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const handleDisconnect = (event, reason) => {
    if (reason && reason === "backdropClick") {
      return;
    } else {
      setCallStatus("ended");
      dispatch(UpdateCallStatus("ended"));
      dispatch(ResetAudioCallQueue());

      // clean up event listeners
      socket?.off("audio_call_accepted");
      socket?.off("audio_call_denied");
      socket?.off("audio_call_missed");

      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Only perform ZegoCloud cleanup if zgRef is initialized
      if (zgRef.current) {
        try {
          // stop publishing local audio stream
          zgRef.current.stopPublishingStream(streamID);
          // stop playing a remote audio
          zgRef.current.stopPlayingStream(userID);
          // destroy stream if it exists
          if (audioStreamRef.current) {
            zgRef.current.destroyStream(audioStreamRef.current);
          }
          // log out of the room
          zgRef.current.logoutRoom(roomID);
        } catch (error) {
          console.error("Error cleaning up ZegoCloud:", error);
        }
      }

      // handle Call Disconnection
      handleClose();
    }
  };

  useEffect(() => {
    // Initialize the ZegoExpressEngine instance
    zgRef.current = new ZegoExpressEngine(appID, server);
    
    // Track call status in Redux
    dispatch(UpdateCallStatus("connecting"));

    // create a job to decline call automatically after 30 sec if not picked
    const callTimeoutTimer = setTimeout(() => {
      if (callStatus === "connecting") {
        socket.emit(
          "audio_call_not_picked",
          { to: streamID, from: userID },
          () => {
            // Call not picked, handle accordingly
          }
        );
      }
    }, 30 * 1000);

    socket.on("audio_call_missed", () => {
      setCallStatus("ended");
      dispatch(UpdateCallStatus("missed"));
      handleDisconnect();
    });

    socket.on("audio_call_accepted", () => {
      setCallStatus("ongoing");
      dispatch(UpdateCallStatus("ongoing"));
      clearTimeout(callTimeoutTimer);
      
      // Start call timer
      timerRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    });

    if (!incoming) {
      socket.emit("start_audio_call", {
        to: streamID,
        from: userID,
        roomID,
      });
    }

    socket.on("audio_call_denied", () => {
      setCallStatus("ended");
      dispatch(UpdateCallStatus("ended"));
      handleDisconnect();
    });

    // Fetch token and initialize ZegoCloud
    async function initializeCall() {
      try {
        // Get token from server
        const response = await axiosInstance.post(
          "/user/generate-zego-token",
          {
            userId: userID,
            room_id: roomID,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        const zegoToken = response.data.token;
        
        // Check system compatibility
        const result = await zgRef.current.checkSystemRequirements();
        const { webRTC, microphone } = result;
        
        if (!webRTC || !microphone) {
          console.error("System doesn't support WebRTC or microphone access");
          dispatch(UpdateCallStatus("failed", "Your system doesn't support audio calls"));
          handleDisconnect();
          return;
        }
        
        // Login to room
        await zgRef.current.loginRoom(
          roomID,
          zegoToken,
          { userID, userName },
          { userUpdate: true }
        );
        
        // Create local stream
        const localStream = await zgRef.current.createStream({
          camera: { audio: true, video: false },
        });
        
        audioStreamRef.current = localStream;
        
        // Get the audio tag and attach stream
        const localAudio = document.getElementById("local-audio");
        localAudio.srcObject = localStream;
        
        // Start publishing stream
        zgRef.current.startPublishingStream(streamID, localStream);
        
        // Setup ZegoCloud event listeners
        setupZegoEventListeners();
        
      } catch (error) {
        console.error("Error initializing call:", error);
        dispatch(UpdateCallStatus("failed", error.message));
        handleDisconnect();
      }
    }
    
    function setupZegoEventListeners() {
      // Publisher state updates
      zgRef.current.on("publisherStateUpdate", (result) => {
        console.log("Publisher state:", result);
      });
      
      // Room state updates
      zgRef.current.on("roomStateUpdate", (roomID, state, errorCode, extendedData) => {
        console.log(`Room state: ${state}`);
        if (state === "DISCONNECTED") {
          setCallStatus("ended");
        }
      });
      
      // Room user updates
      zgRef.current.on("roomUserUpdate", async (roomID, updateType, userList) => {
        console.log(`User ${updateType === "ADD" ? "joined" : "left"} room:`, userList);
        
        if (updateType !== "ADD") {
          // User left, end call
          handleDisconnect();
        } else {
          try {
            // Start playing remote stream
            const remoteStream = await zgRef.current.startPlayingStream(userID);
            const remoteAudio = document.getElementById("remote-audio");
            remoteAudio.srcObject = remoteStream;
            remoteAudio.play();
          } catch (error) {
            console.error("Error playing remote stream:", error);
          }
        }
      });
      
      // Stream updates
      zgRef.current.on("roomStreamUpdate", async (roomID, updateType, streamList) => {
        console.log(`Stream ${updateType}:`, streamList);
      });
    }
    
    initializeCall();

    // Cleanup function
    return () => {
      clearTimeout(callTimeoutTimer);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      socket.off("audio_call_accepted");
      socket.off("audio_call_denied");
      socket.off("audio_call_missed");
      handleDisconnect();
    };
  }, []);

  return (
    <>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleDisconnect}
        aria-describedby="alert-dialog-slide-description"
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'light' ? '#f8f9fa' : '#2d3843',
            width: 400,
          }
        }}
      >
        <DialogContent>
          <Stack spacing={3} alignItems="center" p={2}>
            {/* Call status */}
            <Typography variant="h6" fontWeight={600} color={theme.palette.primary.main}>
              {callStatus === "connecting" ? "Connecting..." : 
               callStatus === "ongoing" ? "Call in progress" : "Call ended"}
            </Typography>
            
            {/* Call timer */}
            {callStatus === "ongoing" && (
              <Typography variant="subtitle1" color="text.secondary">
                {formatTime(callTimer)}
              </Typography>
            )}
            
            {/* Avatars */}
            <Stack direction="row" spacing={4} justifyContent="center" alignItems="center">
              <Stack alignItems="center" spacing={1}>
                <Avatar
                  sx={{ 
                    height: 80, 
                    width: 80,
                    border: '2px solid',
                    borderColor: theme.palette.primary.main,
                    boxShadow: '0px 0px 8px rgba(0,0,0,0.15)'
                  }}
                  src={`https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${call_details?.from_user?.avatar}`}
                />
                <Typography variant="body2" fontWeight={500}>
                  {call_details?.from_user?.firstName || "Caller"}
                </Typography>
                <audio id="local-audio" controls={false} />
              </Stack>
              
              <Box sx={{ 
                position: 'relative',
                height: 40,
                width: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {callStatus === "connecting" ? (
                  <CircularProgress size={30} />
                ) : (
                  <Box sx={{
                    height: '2px',
                    width: '100%', 
                    bgcolor: theme.palette.primary.main
                  }} />
                )}
              </Box>
              
              <Stack alignItems="center" spacing={1}>
                <Avatar
                  sx={{ 
                    height: 80, 
                    width: 80,
                    border: '2px solid',
                    borderColor: theme.palette.primary.main,
                    boxShadow: '0px 0px 8px rgba(0,0,0,0.15)'
                  }}
                  src={`https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${user?.avatar}`}
                />
                <Typography variant="body2" fontWeight={500}>
                  {user?.firstName || "You"}
                </Typography>
                <audio id="remote-audio" controls={false} />
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          {callStatus === "ongoing" && (
            <Button 
              onClick={handleMuteToggle}
              variant="contained"
              color={isMuted ? "warning" : "primary"}
              sx={{ 
                borderRadius: '50%', 
                minWidth: '50px', 
                width: '50px', 
                height: '50px',
                mr: 2
              }}
            >
              {isMuted ? <MicrophoneSlash size={20} /> : <Microphone size={20} />}
            </Button>
          )}
          
          <Button 
            onClick={handleDisconnect} 
            variant="contained" 
            color="error"
            sx={{ 
              borderRadius: '50%', 
              minWidth: '50px', 
              width: '50px', 
              height: '50px'
            }}
          >
            <Phone size={20} weight="fill" />
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CallDialog;
