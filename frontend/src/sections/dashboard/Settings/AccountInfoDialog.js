import React from "react";
import {
  Dialog,
  Slide,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
  Typography,
  Divider,
  Box,
  Avatar
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Note, User, Calendar, Globe, Key, Clock } from "phosphor-react";
import { AWS_S3_REGION, S3_BUCKET_NAME } from "../../../config";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Helper function to format date without using date-fns
const formatDate = (dateString) => {
  if (!dateString) return "Not available";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

const AccountInfoDialog = ({ open, handleClose, user }) => {
  const theme = useTheme();

  // Format creation date (if available)
  const formattedCreationDate = formatDate(user?.createdAt);

  // Get user avatar URL
  const userAvatarUrl = user?.avatar 
    ? `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${user.avatar}`
    : "";

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleClose}
      aria-describedby="account-info-dialog"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.palette.mode === 'light' 
            ? '0px 8px 24px rgba(0,0,0,0.12)' 
            : '0px 8px 24px rgba(0,0,0,0.4)',
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 3, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        fontWeight: 600
      }}>
        <Note size={24} weight="fill" />
        {"Account Information"}
      </DialogTitle>
      
      <Divider sx={{ 
        borderColor: theme.palette.mode === 'light' 
          ? 'rgba(0,0,0,0.08)' 
          : 'rgba(255,255,255,0.08)'
      }} />
      
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* User Profile Picture */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Avatar
              src={userAvatarUrl}
              alt={`${user?.firstName || ""} ${user?.lastName || ""}`}
              sx={{ 
                width: 100, 
                height: 100,
                boxShadow: '0px 0px 8px rgba(0,0,0,0.15)',
                border: `4px solid ${theme.palette.background.paper}`
              }}
            />
          </Box>

          {/* User Name */}
          <InfoItem 
            icon={<User size={20} />}
            label="Name"
            value={`${user?.firstName || "Not specified"} ${user?.lastName || ""}`}
          />
          
          {/* User ID */}
          <InfoItem 
            icon={<Key size={20} />}
            label="User ID"
            value={user?._id || "Not available"}
          />
          
          {/* About */}
          <InfoItem 
            icon={<Globe size={20} />}
            label="About"
            value={user?.about || "Not specified"}
          />
          
          {/* Email */}
          <InfoItem 
            icon={<Globe size={20} />}
            label="Email"
            value={user?.email || "Not specified"}
          />
          
          {/* Account Creation Date */}
          <InfoItem 
            icon={<Calendar size={20} />}
            label="Account Created"
            value={formattedCreationDate}
          />
          
          {/* Last Active */}
          <InfoItem 
            icon={<Clock size={20} />}
            label="Last Active"
            value={formatDate(user?.lastActive)}
          />
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button 
          variant="contained" 
          onClick={handleClose}
          sx={{
            borderRadius: 1.5,
            px: 3,
            boxShadow: '0px 2px 6px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0px 4px 12px rgba(0,0,0,0.2)',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Helper component for displaying info items
const InfoItem = ({ icon, label, value }) => {
  const theme = useTheme();
  
  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ color: theme.palette.primary.main }}>{icon}</Box>
        <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
      </Stack>
      <Typography 
        variant="body2" 
        sx={{ 
          pl: 3.5,
          px: 2,
          py: 1.5,
          backgroundColor: theme.palette.mode === 'light' 
            ? 'rgba(0,0,0,0.02)' 
            : 'rgba(255,255,255,0.02)',
          borderRadius: 1,
          border: `1px solid ${theme.palette.mode === 'light' 
            ? 'rgba(0,0,0,0.06)' 
            : 'rgba(255,255,255,0.06)'}`
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
};

export default AccountInfoDialog; 