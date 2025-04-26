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
} from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";
import { Phone, PhoneX } from "phosphor-react";

import {
  ResetAudioCallQueue,
  UpdateAudioCallDialog,
} from "../../../redux/slices/audioCall";
import { socket } from "../../../socket";
import { AWS_S3_REGION, S3_BUCKET_NAME } from "../../../config";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CallNotification = ({ open, handleClose }) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const { user } = useSelector((state) => state.app);
  const [call_details] = useSelector((state) => state.audioCall.call_queue);

  const handleAccept = () => {
    socket.emit("audio_call_accepted", { ...call_details });
    dispatch(UpdateAudioCallDialog({ state: true }));
  };

  const handleDeny = () => {
    socket.emit("audio_call_denied", { ...call_details });
    dispatch(ResetAudioCallQueue());
    handleClose();
  };

  return (
    <>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleDeny}
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
              Incoming Call
            </Typography>
            
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
              </Stack>
              
              <Box sx={{ 
                position: 'relative',
                height: 40,
                width: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Box sx={{
                  height: '2px',
                  width: '100%', 
                  bgcolor: theme.palette.primary.main
                }} />
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
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button 
            onClick={handleDeny} 
            variant="contained" 
            color="error"
            sx={{ 
              borderRadius: '50%', 
              minWidth: '50px', 
              width: '50px', 
              height: '50px',
              mr: 2
            }}
          >
            <PhoneX size={20} weight="fill" />
          </Button>
          
          <Button 
            onClick={handleAccept} 
            variant="contained" 
            color="success"
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

export default CallNotification;
