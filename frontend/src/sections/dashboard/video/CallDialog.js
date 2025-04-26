import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Slide,
  Stack,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Avatar,
} from "@mui/material";
import { ZegoExpressEngine } from "zego-express-engine-webrtc";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../../../utils/axios";
import { socket } from "../../../socket";
import { ResetVideoCallQueue } from "../../../redux/slices/videoCall";
import { Camera, VideoCameraSlash, MicrophoneSlash, Microphone, PhoneX } from "phosphor-react";
import { useTheme } from "@mui/material/styles";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CallDialog = ({ open, handleClose }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [callConnected, setCallConnected] = useState(false);
  const [playingStreams, setPlayingStreams] = useState(new Set()); // Track streams being played

  const audioStreamRef = useRef(null);
  const videoStreamRef = useRef(null);

  //* Use params from call_details if available => like in case of receiver's end

  const [call_details] = useSelector((state) => state.videoCall.call_queue);
  const { incoming } = useSelector((state) => state.videoCall);

  const { token } = useSelector((state) => state.auth);

  // Make sure this matches your APP ID in the .env file
  const appID = 579088592; // Updated to match your ZegoCloud project
  const server = "wss://webliveroom579088592-api.coolzcloud.com/ws"; // Updated to match your server URL

  // Public STUN/TURN servers for fallback
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ];

  // ZegoCloud connection options
  const zegoOptions = {
    logLevel: 'debug',
    remoteLogLevel: 'info',
    enablePlatformView: false,
    enableCamera: true,
    enableMicrophone: true,
    advancedConfig: {
      keepVideoDuringMute: true,
      disableAutoPlayDialog: true, // Disable browser auto-play dialog
      showAudioInputDeviceAuthorityRequireAlerts: false, // Prevent mic permission alerts
      showAudioOutputDeviceAuthorityRequireAlerts: false, // Prevent speaker permission alerts
      showCameraAuthorityRequireAlerts: false, // Prevent camera permission alerts
      showVideoQualityWarnings: false, // Prevent video quality warnings
      showNetworkPoorAlerts: false, // Prevent network alerts
      retry: {
        count: 5, // Retry 5 times
        timeout: 5000, // 5 seconds per attempt
        interval: 1000 // 1 second between retries
      },
      network: {
        timeout: 15000, // Longer network timeout (15 seconds)
        iceTimeout: 8000, // ICE negotiation timeout
        iceTimeoutForWaitingRelay: 10000 // Waiting for TURN relay timeout
      }
    }
  };

  // roomID => ID of conversation => current_conversation.id
  // token => generate on backend & get on App
  // userID => ID of this user
  // userName => slug formed by user's name

  const roomID = call_details?.roomID;
  const userID = call_details?.userID;
  const userName = call_details?.userName;

  // Define stream IDs correctly according to ZegoCloud format
  // ZegoCloud requires specific formats for stream IDs - just use the IDs directly
  // without prefixes to avoid mismatches between publishers and players
  const localStreamID = userID?.toString();
  const remoteStreamID = call_details?.streamID?.toString();
  
  console.log('Stream IDs:', { localStreamID, remoteStreamID });
  
  // For backwards compatibility with existing code that expects these variables
  const audioStreamID = localStreamID;
  const videoStreamID = localStreamID;
  
  // Clean helper function to get the expected remote stream ID
  const getRemoteStreamID = () => remoteStreamID;
  
  // For debugging purposes
  useEffect(() => {
    console.log("Call Details:", call_details);
    console.log("Stream IDs for debugging:", {
      localID: localStreamID,
      remoteID: remoteStreamID, 
      userID: userID?.toString(),
      roomID: roomID?.toString()
    });
  }, []);

  // References to the engine and streams
  const zgRef = useRef(null);
  const originalAlertRef = useRef(null);
  const originalEmitRef = useRef(null);

  // Suppress alerts
  useEffect(() => {
    // Store original alert function
    originalAlertRef.current = window.alert;
    
    // Replace window.alert with a version that only logs to console
    window.alert = function(message) {
      console.warn("Suppressed alert:", message);
    };
    
    // Restore original alert on component unmount
    return () => {
      window.alert = originalAlertRef.current;
    };
  }, []);

  const toggleAudio = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.muteAudio(isAudioMuted);
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.muteVideo(isVideoMuted);
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const handleDisconnect = (event, reason) => {
    if (reason && reason === "backdropClick") {
      return;
    }
    
    // If the call is ongoing and this isn't a receiver responding to a socket event
    if (callConnected && !incoming) {
      try {
        // Try to notify the other side that we're ending the call
        socket.emit("video_call_ended", { 
          to: call_details?.streamID, 
          from: userID 
        });
      } catch (error) {
        console.warn("Could not emit video_call_ended event:", error);
        // Continue with disconnection anyway
      }
    }
    
    // The cleanup will happen in the useEffect's return function
      dispatch(ResetVideoCallQueue());
      handleClose();
  };

  useEffect(() => {
    // Initialize ZegoExpressEngine only once with the proper options
    if (!zgRef.current) {
      console.log("Initializing ZegoExpressEngine with options:", zegoOptions);
      
      // Verify required parameters before initializing
      if (!appID) {
        console.error("Missing ZegoCloud APP ID - this will cause alerts");
      }
      
      // Safely initialize ZegoExpressEngine with proper error handling
      try {
        zgRef.current = new ZegoExpressEngine(appID, server, zegoOptions);
        
        // Add custom error handler to suppress alerts
        if (zgRef.current) {
          // Attempt to override the ZegoCloud error handler if it exists
          try {
            // If a setLogConfig method exists, set a custom error handler
            if (typeof zgRef.current.setLogConfig === 'function') {
              zgRef.current.setLogConfig({
                logLevel: 'debug',
                remoteLogLevel: 'info',
                logURLs: [], // Don't send logs to remote server
                logCallback: (level, message) => {
                  // Special handling for specific error messages
                  if (message && message.includes("appid userid token not exist")) {
                    console.error("ZegoCloud Auth Error: AppID, UserID or Token missing");
                    return true; // Prevent alert
                  }
                  
                  // Just log to console instead of showing alerts
                  if (level === 'error') {
                    console.error("ZegoCloud Error:", message);
                  } else if (level === 'warn') {
                    console.warn("ZegoCloud Warning:", message);
                  } else {
                    console.log(`ZegoCloud [${level}]:`, message);
                  }
                  // Return true to prevent default handling (alerts)
                  return true;
                }
              });
            }
          } catch (err) {
            console.warn("Could not set custom error handler:", err);
          }
        }
      } catch (initError) {
        console.error("Error initializing ZegoExpressEngine:", initError);
        // Create a dummy object to prevent further errors
        zgRef.current = {
          on: () => {},
          setLogConfig: () => {},
          setDebugVerbose: () => {},
          checkSystemRequirements: async () => ({ webRTC: false }),
          loginRoom: async () => false,
          // Add other methods as needed
        };
      }
    }
    
    const zg = zgRef.current;
    let timer;

    // create a job to decline call automatically after 30 sec if not picked
    if (!incoming) {
      timer = setTimeout(() => {
      socket.emit(
        "video_call_not_picked",
        { to: call_details?.streamID, from: userID },
        () => {
          // TODO abort call => Call verdict will be marked as Missed
        }
      );
    }, 30 * 1000);
    }

    // Error handler for socket issues
    const handleSocketError = (error) => {
      console.warn("Socket error occurred:", error);
      // If we get a "socket closed" error, gracefully handle it
      if (error && (
        error.message?.includes('not open') || 
        error.message?.includes('socket closed') || 
        error.toString().includes('not open, socket closed')
      )) {
        console.log("Socket connection lost, ending call gracefully");
        // Clean up without trying to emit socket events
        dispatch(ResetVideoCallQueue());
        if (typeof handleClose === 'function') {
          handleClose();
        }
      }
    };

    // Add error handler to socket
    if (socket) {
      socket.on('error', handleSocketError);
      socket.on('connect_error', handleSocketError);
      
      // Handle global socket errors - this catches runtime errors that might not trigger standard events
      originalEmitRef.current = socket.emit;
      socket.emit = function() {
        try {
          return originalEmitRef.current.apply(socket, arguments);
        } catch (err) {
          console.warn("Socket emit error caught:", err);
          handleSocketError(err);
          return false;
        }
      };
    }

    socket.on("video_call_missed", () => {
      // TODO => You can play an audio indicating call is missed at receiver's end
      // Abort call
      handleDisconnect();
    });

    socket.on("video_call_accepted", () => {
      // TODO => You can play an audio indicating call is started
      // clear timeout for "video_call_not_picked"
      clearTimeout(timer);
      setCallConnected(true);
      
      // Double check if any stale streams are still in the tracking set
      // This can happen if a previous call wasn't properly cleaned up
      console.log("Call accepted, checking for existing video elements");
      const remoteVideo = document.getElementById("remote-video");
      
      // If we already have a stream playing, make sure it's tracked
      if (remoteVideo && remoteVideo.srcObject) {
        console.log("Remote video element already has a stream, ensuring it's tracked");
        const streams = Array.from(playingStreams);
        console.log("Currently tracked streams:", streams);
      }
    });

    socket.on("video_call_denied", () => {
      // TODO => You can play an audio indicating call is denined
      // ABORT CALL
      handleDisconnect();
    });

    // Handle when the other side ends the call
    socket.on("video_call_ended", () => {
      console.log("Call ended by other user");
      // Handle call end gracefully
      handleDisconnect();
    });

    if (!incoming) {
      // Wrap socket emissions in try/catch blocks to handle socket closed errors
      try {
        socket.emit("start_video_call", {
          to: call_details?.streamID,
          from: userID,
          roomID,
        });
      } catch (error) {
        handleSocketError(error);
      }
    }

    // make a POST API call to server & fetch token

    async function setupCall() {
      try {
        // 1. Fetch token first
        console.log("Call details for token:", {
          userID,
          roomID,
          streamID: call_details?.streamID
        });
        
        if (!userID || !roomID) {
          console.error("Missing userID or roomID");
          setIsConnecting(false);
          return;
        }
        
        // Ensure IDs are strings
        const userIdString = userID.toString();
        const roomIdString = roomID.toString();
        
        console.log("Fetching token with params:", {
          userId: userIdString,
          room_id: roomIdString
        });
        
      const response = await axiosInstance.post(
        "/user/generate-zego-token",
        {
            userId: userIdString,
            room_id: roomIdString,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
        
        console.log("Token response status:", response.status);
        console.log("Token response data:", response.data);
        
        if (response.status !== 200) {
          console.error("Failed to get token, status:", response.status);
          setIsConnecting(false);
          return;
        }
        
        const this_token = response.data.token;
        
        if (!this_token) {
          console.error("Token is empty in response");
          setIsConnecting(false);
          return;
        }
        
        console.log("Token starts with:", this_token.substring(0, 10) + "...");

        // 2. Configure the SDK log level (optional but helps debugging)
        zg.setLogConfig({
          logLevel: 'debug',
        });
        
        // Enable debug mode for easier troubleshooting
        zg.setDebugVerbose(true);
        
        // 3. Check browser compatibility
        const compatibility = await zg.checkSystemRequirements();
        console.log("System compatibility:", compatibility);
        
        const { webRTC, microphone, camera } = compatibility;
        
        if (!webRTC) {
          console.error("WebRTC not supported");
          setIsConnecting(false);
          return;
        }
        
        if (!microphone || !camera) {
          console.warn("Microphone or camera not available");
          // Continue anyway but log warning
        }

        // 4. Login to room with valid token
        console.log("Logging in to room:", {
          roomID: roomID?.toString(),
          userID: userID?.toString(),
          userName: userName?.toString() || userID?.toString(),
          token: this_token,
        });
        
        try {
          // Set custom ICE server configuration before login
          // Using the correct method for ZegoExpressEngine
          try {
            // This is the correct method available in the ZegoExpressEngine
            if (typeof zg.setRTCConfig === 'function') {
              console.log("Setting RTC configuration with ice servers:", iceServers);
              zg.setRTCConfig({
                iceServers: iceServers
              });
            } else if (typeof zg.setTurnOverTcpOnly === 'function') {
              // Fallback for older versions
              console.log("Using fallback method for ICE config");
              zg.setTurnOverTcpOnly(false);
            } else {
              console.warn("No method available to set ICE servers - using default configuration");
            }
          } catch (iceError) {
            console.warn("Failed to set ICE configuration, using defaults:", iceError);
          }
          
          // Set ice connection state event handler
          zg.on("webrtcIceConnectionStateChange", (streamID, newState) => {
            console.log(`ICE Connection State for ${streamID}: ${newState}`);
            if (newState === "failed" || newState === "disconnected") {
              console.warn(`ICE Connection failed for stream: ${streamID}`);
              // Try to restart ICE if the method is available
              if (typeof zg.restartIceConnection === 'function') {
                zg.restartIceConnection(streamID)
                  .then(() => console.log(`ICE connection restart requested for ${streamID}`))
                  .catch(err => console.error(`Failed to restart ICE for ${streamID}`, err));
              }
            }
          });
          
          // Handle common login errors that can cause alerts
          try {
            // Pre-validate parameters to avoid "appid userid token not exist" error
            if (!roomID || !userID || !this_token) {
              console.error("Missing required parameters for login:", {
                roomID: !!roomID,
                userID: !!userID,
                token: !!this_token
              });
              setIsConnecting(false);
              return;
            }
            
            // Login to room
            const loginResult = await zg.loginRoom(
              roomID?.toString(),
              this_token,
              { 
                userID: userID?.toString(), 
                userName: userName?.toString() || userID?.toString() 
              },
              { 
                userUpdate: true,
                maxMemberCount: 2  // 1:1 call
              }
            );
            
            console.log("Login result:", loginResult);
            
            if (!loginResult) {
              console.error("Failed to login to room");
              setIsConnecting(false);
              return;
            }
          } catch (loginError) {
            // Handle specific login errors with better messages
            if (loginError.message && (
                loginError.message.includes("appid userid token not exist") || 
                loginError.message.includes("token invalid")
              )) {
              console.error("Authentication error: Invalid token or missing parameters", loginError);
              // Continue with non-blocking error - just log it
              setIsConnecting(false);
              return;
            }
            
            console.error("Login room error:", loginError);
            setIsConnecting(false);
            return;
          }
        } catch (loginError) {
          console.error("Login room error:", loginError);
          setIsConnecting(false);
          return;
        }
        
        // 5. Create streams after successful login
        try {
          // Create audio and video stream together with simplified config
          console.log("Creating combined audio/video stream");
          const localStream = await zg.createStream({
            camera: true,
            microphone: true
          });
          
          if (!localStream) {
            console.error("Failed to create stream");
            setIsConnecting(false);
            return;
          }
          
          // Store references
          audioStreamRef.current = localStream;
          videoStreamRef.current = localStream;
          
          // Assign to media elements
          const localAudio = document.getElementById("local-audio");
          const localVideo = document.getElementById("local-video");
          
          if (localAudio) {
            localAudio.srcObject = localStream;
            localAudio.play().catch(err => console.warn("Audio play error:", err));
          }
          
          if (localVideo) {
            localVideo.srcObject = localStream;
            localVideo.play().catch(err => console.warn("Video play error:", err));
          }
          
          // Publish stream - use a single stream for both audio and video
          console.log("Publishing stream with ID:", localStreamID);
          try {
            await zg.startPublishingStream(localStreamID, localStream);
            console.log("Stream publishing started successfully");
            setIsConnecting(false);
          } catch (publishError) {
            console.error("Error publishing stream:", publishError);
            setIsConnecting(false);
          }
        } catch (streamError) {
          console.error("Error creating media stream:", streamError);
          setIsConnecting(false);
        }
      } catch (error) {
        console.error("Setup error:", error);
        setIsConnecting(false);
      }
    }
    
    setupCall();

    // Event listeners for ZegoExpressEngine

    // Publisher state updates
    zg.on("publisherStateUpdate", (result) => {
      console.log("Publisher state update:", result);
      
      // Check for successful state
      if (result.state === "PUBLISHING") {
        setIsConnecting(false);
      }
    });

    // Room state updates
    zg.on("roomStateUpdate", (roomID, state, errorCode, extendedData) => {
      console.log(`Room state update: ${state} for room ${roomID}`);
      
      if (state === "DISCONNECTED") {
        // Handle disconnection
      } else if (state === "CONNECTING") {
        setIsConnecting(true);
      } else if (state === "CONNECTED") {
        setIsConnecting(false);
      }
    });

    // Define a function to check if a stream is already being played
    const isStreamBeingPlayed = (streamID) => {
      // First check our React state tracking
      if (playingStreams.has(streamID)) {
        return true;
      }
      
      // Also check if there's a video element already playing this stream
      const remoteVideo = document.getElementById("remote-video");
      if (remoteVideo && remoteVideo.srcObject) {
        return true;
      }
      
      return false;
    };

    // User updates in room
    zg.on("roomUserUpdate", async (roomID, updateType, userList) => {
      console.log(`User update in room ${roomID}: ${updateType}`, userList);
      console.log(`Users in room:`, userList);
      
      if (updateType !== "ADD") {
        handleDisconnect();
        return;
      }
      
      try {
        // The remote user has joined, try to play their stream
        console.log("Remote user joined, attempting to play their stream");
        
        // Get the expected remote stream ID
        const expectedStreamID = remoteStreamID;
        console.log("Expected remote stream ID:", expectedStreamID);
        
        // Before playing any stream, clear any stale stream entries from tracked streams
        // that might have been left from previous calls
        if (!incoming) {
          console.log("Clearing stale playing streams tracking");
          setPlayingStreams(new Set());
        }
        
        // Skip if already playing this stream
        if (isStreamBeingPlayed(expectedStreamID)) {
          console.log(`Stream ${expectedStreamID} already playing, skipping`);
          setCallConnected(true);
          setIsConnecting(false);
          return;
        }
        
        // Wait a bit before attempting to play the stream
        // This gives time for the publisher to fully establish
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to play the stream with retries
        let remoteStream;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!remoteStream && attempts < maxAttempts) {
          try {
            console.log(`Playing remote stream (attempt ${attempts + 1}/${maxAttempts}): ${expectedStreamID}`);
            remoteStream = await zg.startPlayingStream(expectedStreamID);
            console.log("Successfully started playing remote stream");
            setPlayingStreams(prev => new Set([...prev, expectedStreamID]));
            break;
          } catch (err) {
            attempts++;
            console.warn(`Failed to play remote stream (attempt ${attempts}/${maxAttempts}):`, err);
            
            // Handle specific errors
            if (err.code === 1104041 || err.code === 1103049) {
              // 1104041: player already exists
              // 1103049: repeated pull same stream
              console.log(`Stream ${expectedStreamID} is already being played (error code: ${err.code})`);
              setPlayingStreams(prev => new Set([...prev, expectedStreamID]));
              
              // Already playing, so we consider this a success
              remoteStream = true;
              setCallConnected(true);
              setIsConnecting(false);
              break;
            }
            
            // If we've reached max attempts and still failed
            if (attempts >= maxAttempts) {
              console.error("Reached maximum attempts, trying alternative approach");
              
              // Try a different approach - try to query all streams and pick one that's not our own
              try {
                const streamList = await zg.getStreamList();
                console.log("Available streams in room:", streamList);
                
                // Find a stream that is not our own
                const otherStreams = streamList.filter(stream => stream.streamID !== localStreamID);
                
                if (otherStreams.length > 0) {
                  console.log("Found alternative streams:", otherStreams);
                  // Try to play the first available other stream
                  remoteStream = await zg.startPlayingStream(otherStreams[0].streamID);
                  console.log("Successfully playing alternative stream:", otherStreams[0].streamID);
                  setPlayingStreams(prev => new Set([...prev, otherStreams[0].streamID]));
                  break;
                } else {
                  console.error("No other streams found in the room");
                  throw new Error("No playable streams found in room");
                }
              } catch (listErr) {
                console.error("Failed to get stream list:", listErr);
                throw err;
              }
            }
            
            // Wait before retry with increasing delay
            const delay = 1000 * attempts;
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        if (!remoteStream) {
          console.error("Failed to play remote stream after multiple attempts");
          setIsConnecting(false);
          return;
        }
        
        // Assign to media elements
        const remoteAudio = document.getElementById("remote-audio");
        const remoteVideo = document.getElementById("remote-video");
        
        if (remoteAudio) {
          remoteAudio.srcObject = remoteStream;
          remoteAudio.play().catch(err => {
            console.warn("Remote audio play error:", err);
          });
        }
        
        if (remoteVideo) {
          remoteVideo.srcObject = remoteStream;
          remoteVideo.play().catch(err => {
            console.warn("Remote video play error:", err);
          });
        }
        
        setCallConnected(true);
        setIsConnecting(false);
      } catch (error) {
        console.error("Error playing remote stream:", error);
        setIsConnecting(false);
      }
    });

    // Stream updates in room
    zg.on("roomStreamUpdate", async (roomID, updateType, streamList, extendedData) => {
      console.log(`Stream update in room ${roomID}: ${updateType}`, streamList);
      console.log("Available streams:", streamList.map(s => s.streamID));
      
      if (updateType === "ADD") {
        // New streams added to room
        for (const stream of streamList) {
          console.log("New stream available:", stream.streamID);
          
          // Skip if already playing this stream
          if (isStreamBeingPlayed(stream.streamID)) {
            console.log(`Stream ${stream.streamID} already playing, skipping`);
            continue;
          }
          
          try {
            // For each stream, try up to 3 times to play it with increasing timeouts
            let playStream;
            let retryCount = 0;
            const maxRetries = 3;
            
            // Log all available streams in the room for debugging
            console.log(`Attempting to play stream ${stream.streamID}`);
            console.log(`Local stream ID: ${localStreamID}, Remote stream ID: ${remoteStreamID}`);
            console.log(`Is this the remote stream? ${stream.streamID === remoteStreamID}`);
            
            // Skip our own stream to avoid feedback
            if (stream.streamID === localStreamID) {
              console.log("Skipping our own stream to avoid feedback");
              continue;
            }
            
            while (retryCount < maxRetries && !playStream) {
              try {
                console.log(`Playing stream ${stream.streamID} (attempt ${retryCount + 1}/${maxRetries})`);
                playStream = await zg.startPlayingStream(stream.streamID, {
                  video: true,
                  audio: true,
                  timeout: (retryCount + 1) * 5000 // Increasing timeout: 5s, 10s, 15s
                });
                console.log(`Successfully started playing stream ${stream.streamID}`);
                // Add to tracked playing streams
                setPlayingStreams(prev => new Set([...prev, stream.streamID]));
                break;
              } catch (err) {
                retryCount++;
                console.warn(`Attempt ${retryCount} failed:`, err);
                
                // Check if this is "stream already exists" or "repeated pull same stream" error
                if (err.code === 1104041 || err.code === 1103049) {
                  console.log(`Stream ${stream.streamID} is already being played (error code: ${err.code})`);
                  setPlayingStreams(prev => new Set([...prev, stream.streamID]));
                  
                  // Set success even though we didn't get a stream object
                  playStream = true;
                  setCallConnected(true);
                  setIsConnecting(false);
                  break;
                }
                
                // Special handling for "stream not found" error
                if (err.code === 1104039) {
                  console.warn("Stream not found error - checking all streams in room");
                  
                  // Try a different approach - try to play using the remote user ID directly
                  try {
                    console.log(`Trying alternative stream ID: ${remoteStreamID}`);
                    // Skip if already playing
                    if (isStreamBeingPlayed(remoteStreamID)) {
                      console.log(`Alternative stream ${remoteStreamID} already playing, skipping`);
                      break;
                    }
                    
                    playStream = await zg.startPlayingStream(remoteStreamID, {
                      video: true, 
                      audio: true
                    });
                    if (playStream) {
                      console.log("Success with alternative stream ID!");
                      setPlayingStreams(prev => new Set([...prev, remoteStreamID]));
                      break;
                    }
                  } catch (altErr) {
                    // Check if this is "stream already exists" or "repeated pull" error
                    if (altErr.code === 1104041 || altErr.code === 1103049) {
                      console.log(`Stream ${remoteStreamID} is already being played (error code: ${altErr.code})`);
                      setPlayingStreams(prev => new Set([...prev, remoteStreamID]));
                      // Set success flag
                      playStream = true;
                      setCallConnected(true);
                      setIsConnecting(false);
                      break;
                    }
                    console.error("Alternative stream ID also failed:", altErr);
                  }
                }
                
                if (retryCount >= maxRetries) throw err;
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            if (!playStream) {
              console.error(`Failed to play stream ${stream.streamID} after ${maxRetries} attempts`);
              continue;
            }
            
            // Assign to media elements (regardless of stream type since we're using a combined stream)
            const remoteAudio = document.getElementById("remote-audio");
            const remoteVideo = document.getElementById("remote-video");
            
            if (remoteAudio) {
              remoteAudio.srcObject = playStream;
              remoteAudio.play()
                .then(() => console.log("Remote audio playing"))
                .catch(err => console.warn("Stream audio play error:", err));
            }
            
            if (remoteVideo) {
              remoteVideo.srcObject = playStream;
              remoteVideo.play()
                .then(() => {
                  console.log("Remote video playing");
                  setCallConnected(true);
                  setIsConnecting(false);
                })
                .catch(err => console.warn("Stream video play error:", err));
            }
          } catch (error) {
            console.error(`Error playing stream ${stream.streamID}:`, error);
          }
        }
      } else if (updateType === "DELETE") {
        // If remote streams are deleted, end the call
        console.log("Remote stream deleted");
        if (streamList.some(stream => stream.streamID === remoteStreamID)) {
          handleDisconnect();
        }
      }
    });

    // Cleanup function
    return () => {
      // Clean up event listeners
      try {
        socket?.off("video_call_accepted");
        socket?.off("video_call_denied");
        socket?.off("video_call_missed");
        socket?.off("video_call_ended");
        socket?.off("error", handleSocketError);
        socket?.off("connect_error", handleSocketError);
        
        // Restore original emit function if we overrode it
        if (socket && originalEmitRef.current) {
          socket.emit = originalEmitRef.current;
        }
      } catch (socketCleanupError) {
        console.warn("Error cleaning up socket listeners:", socketCleanupError);
      }
      
      clearTimeout(timer);
      
      // Only clean up if zg instance exists
      if (zg) {
        // Stop publishing and destroy stream
        try {
          // We're only using a single stream now
          if (videoStreamRef.current) {
            console.log("Stopping stream publishing");
            zg.stopPublishingStream(localStreamID);
            zg.destroyStream(videoStreamRef.current);
          }
        } catch (err) {
          console.error("Error stopping streams:", err);
        }
        
        // Stop playing remote stream
        try {
          // Stop all playing streams
          const currentPlayingStreams = Array.from(playingStreams);
          console.log("Stopping remote streams:", currentPlayingStreams);
          
          for (const streamID of currentPlayingStreams) {
            try {
              zg.stopPlayingStream(streamID);
            } catch (stopErr) {
              console.log(`Error stopping stream ${streamID}:`, stopErr);
            }
          }
        } catch (err) {
          console.log("Error stopping remote streams:", err);
        }
        
        // Logout of room
        try {
          console.log("Logging out of room:", roomID?.toString());
          zg.logoutRoom(roomID?.toString());
        } catch (err) {
          console.error("Error logging out of room:", err);
        }
      }
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
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper,
            boxShadow: theme.shadows[5],
          }
        }}
      >
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', height: 500, display: 'flex', flexDirection: 'column' }}>
            {isConnecting && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'rgba(0,0,0,0.6)',
                  zIndex: 10 
                }}
              >
                <Stack alignItems="center" spacing={2}>
                  <CircularProgress color="primary" />
                  <Typography variant="h6" color="white">
                    {incoming ? "Incoming call..." : "Connecting..."}
                  </Typography>
            </Stack>
              </Box>
            )}
            
            <Box sx={{ 
              position: 'relative', 
              height: '100%', 
              width: '100%', 
              overflow: 'hidden',
              bgcolor: theme.palette.mode === 'light' ? 'grey.900' : 'grey.900'
            }}>
              {/* Remote Video (Main) */}
              <video
                style={{ 
                  height: '100%', 
                  width: '100%', 
                  objectFit: 'cover',
                  opacity: callConnected ? 1 : 0.3,
                  transition: 'opacity 0.3s ease'
                }}
                id="remote-video"
                controls={false}
                autoPlay
                playsInline
              />
              <audio id="remote-audio" controls={false} autoPlay />
              
              {/* Local Video (Picture-in-Picture) */}
              <Box sx={{ 
                position: 'absolute', 
                bottom: 20, 
                right: 20,
                width: 180, 
                height: 120, 
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: theme.shadows[6],
                border: `2px solid ${theme.palette.primary.main}`
              }}>
                <video
                  style={{ 
                    height: '100%', 
                    width: '100%', 
                    objectFit: 'cover',
                    transform: 'scaleX(-1)'  // mirror effect
                  }}
                  id="local-video"
                  controls={false}
                  autoPlay
                  playsInline
                  muted
                />
                <audio id="local-audio" controls={false} autoPlay muted />
              </Box>
              
              {/* Status Text */}
              <Box sx={{ 
                position: 'absolute', 
                top: 20, 
                left: 0, 
                right: 0, 
                display: 'flex', 
                justifyContent: 'center' 
              }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'white', 
                    bgcolor: 'rgba(0,0,0,0.5)', 
                    px: 2, 
                    py: 0.5, 
                    borderRadius: 1,
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  {isConnecting ? 'Connecting...' : (
                    callConnected ? 'Connected' : 'Waiting for other participant...'
                  )}
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          bgcolor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper,
          px: 3,
          py: 2,
          justifyContent: 'center'
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton 
              onClick={toggleAudio} 
              sx={{ 
                bgcolor: isAudioMuted ? 'error.main' : 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: isAudioMuted ? 'error.dark' : 'primary.dark'
                },
                width: 48,
                height: 48
              }}
            >
              {isAudioMuted ? <MicrophoneSlash size={24} /> : <Microphone size={24} />}
            </IconButton>
            
            <IconButton 
              onClick={toggleVideo}
              sx={{ 
                bgcolor: isVideoMuted ? 'error.main' : 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: isVideoMuted ? 'error.dark' : 'primary.dark'
                },
                width: 48,
                height: 48
              }}
            >
              {isVideoMuted ? <VideoCameraSlash size={24} /> : <Camera size={24} />}
            </IconButton>
            
            <IconButton 
              onClick={handleDisconnect}
              sx={{ 
                bgcolor: 'error.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'error.dark'
                },
                width: 56,
                height: 56
              }}
            >
              <PhoneX size={28} />
            </IconButton>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CallDialog;
