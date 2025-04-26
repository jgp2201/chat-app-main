import { faker } from "@faker-js/faker";
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
  IconButton,
} from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ResetVideoCallQueue,
  UpdateVideoCallDialog,
} from "../../../redux/slices/videoCall";
import { socket } from "../../../socket";
import { AWS_S3_REGION, S3_BUCKET_NAME } from "../../../config";
import { Phone, PhoneX } from "phosphor-react";
import { useTheme } from "@mui/material/styles";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CallNotification = ({ open, handleClose }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user } = useSelector((state) => state.app);
  const [call_details] = useSelector((state) => state.videoCall.call_queue);

  const handleAccept = () => {
    socket.emit("video_call_accepted", { ...call_details });
    dispatch(UpdateVideoCallDialog({ state: true }));
  };

  const handleDeny = () => {
    //
    socket.emit("video_call_denied", { ...call_details });
    dispatch(ResetVideoCallQueue());
    if (typeof handleClose === 'function') {
      handleClose();
    }
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleDeny}
      aria-describedby="alert-dialog-slide-description"
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: theme.palette.mode === 'light' ? '#F8FAFF' : theme.palette.background.paper,
          boxShadow: theme.shadows[5],
          width: 340,
        }
      }}
    >
      <Box sx={{
        bgcolor: theme.palette.primary.main,
        p: 2,
        width: "100%",
      }}>
        <Typography variant="h6" color="white" fontWeight={600} textAlign="center">
          Incoming Video Call
        </Typography>
      </Box>
      
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3} alignItems="center">
          <Avatar
            sx={{ 
              height: 100, 
              width: 100,
              border: `4px solid ${theme.palette.primary.main}`,
              boxShadow: theme.shadows[3]
            }}
            src={`https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${call_details?.from_user?.avatar}`}
          />
          
          <Typography variant="h6" fontWeight={600}>
            {call_details?.from_user?.firstName} {call_details?.from_user?.lastName}
          </Typography>
          
          <Stack direction="row" spacing={3}>
            <IconButton 
              onClick={handleDeny} 
              sx={{
                bgcolor: theme.palette.error.main,
                color: "white",
                '&:hover': {
                  bgcolor: theme.palette.error.dark
                },
                height: 56,
                width: 56
              }}
            >
              <PhoneX size={28} />
            </IconButton>
            
            <IconButton 
              onClick={handleAccept} 
              sx={{
                bgcolor: theme.palette.success.main,
                color: "white",
                '&:hover': {
                  bgcolor: theme.palette.success.dark
                },
                height: 56,
                width: 56
              }}
            >
              <Phone size={28} />
            </IconButton>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default CallNotification;
