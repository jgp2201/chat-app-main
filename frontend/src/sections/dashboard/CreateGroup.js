import React, { useState, useEffect, useMemo } from "react";
import * as Yup from "yup";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Slide,
  Stack,
  Box,
  Typography,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Camera, X } from "phosphor-react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import FormProvider from "../../components/hook-form/FormProvider";
import { RHFTextField } from "../../components/hook-form";
import RHFAutocomplete from "../../components/hook-form/RHFAutocomplete";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../../utils/axios";
import { showSnackbar } from "../../redux/slices/app";
import { AddGroupConversation } from "../../redux/slices/conversation";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});


const CreateGroupForm = ({ handleClose }) => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { friends } = useSelector((state) => state.app);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Format friends for member selection
  const formattedFriends = useMemo(() => {
    return friends.map(friend => ({
      id: friend._id,
      name: `${friend.firstName} ${friend.lastName}`,
      avatar: friend.avatar
    }));
  }, [friends]);

  const NewGroupSchema = Yup.object().shape({
    title: Yup.string().required("Group name is required"),
    description: Yup.string(),
    members: Yup.array().min(1, "Must have at least 1 member"),
  });

  const defaultValues = {
    title: "",
    description: "",
    members: [],
  };

  const methods = useForm({
    resolver: yupResolver(NewGroupSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = methods;

  // Handle avatar file selection
  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Preview the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setAvatar(file);
    }
  };

  // Handle avatar removal
  const handleRemoveAvatar = () => {
    setAvatar(null);
    setAvatarPreview(null);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError("");
    
    try {
      // Create FormData for multipart/form-data submission (for file upload)
      const formData = new FormData();
      formData.append("name", data.title);
      formData.append("description", data.description);
      
      // Convert member objects to member IDs
      const memberIds = data.members.map(member => member.id);
      formData.append("members", JSON.stringify(memberIds));
      
      // Add avatar if selected
      if (avatar) {
        formData.append("avatar", avatar);
      }

      console.log("Sending request to create group with data:", {
        name: data.title,
        description: data.description,
        members: memberIds,
        hasAvatar: !!avatar
      });

      // API call to create group
      const response = await axiosInstance.post(
        `/api/group/create`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Group created:", response.data);
      
      // Update Redux store with the new group
      if (response.data && response.data.success && response.data.data) {
        dispatch(AddGroupConversation({ group: response.data.data }));
      }
      
      // Show success notification
      dispatch(
        showSnackbar({
          severity: "success",
          message: `Group "${data.title}" created successfully!`,
        })
      );
      
      // Close the dialog and reset form
      reset();
      handleClose();
      
    } catch (error) {
      console.error("Error creating group:", error);
      setError(error.message || "Failed to create group. Please try again.");
      
      // Show error notification
      dispatch(
        showSnackbar({
          severity: "error",
          message: error.message || "Failed to create group. Please try again.",
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        {/* Avatar upload */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Group Avatar
          </Typography>
          
          {avatarPreview ? (
            <Box sx={{ position: 'relative' }}>
              <Avatar 
                src={avatarPreview} 
                sx={{ width: 80, height: 80 }} 
              />
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
                onClick={handleRemoveAvatar}
              >
                <X size={16} />
              </IconButton>
            </Box>
          ) : (
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '1px dashed',
                borderColor: 'divider',
              }}
              component="label"
            >
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={handleAvatarChange}
              />
              <Camera size={24} />
            </Box>
          )}
        </Box>

        {/* Group name */}
        <RHFTextField name="title" label="Group Name" />
        
        {/* Group description */}
        <RHFTextField 
          name="description" 
          label="Description" 
          multiline 
          rows={3} 
        />
        
        {/* Members selection */}
        <RHFAutocomplete
          name="members"
          label="Members"
          multiple
          options={formattedFriends}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.id}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar src={option.avatar} sx={{ width: 24, height: 24 }} />
                <Typography variant="body2">{option.name}</Typography>
              </Stack>
            </Box>
          )}
        />

        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Action buttons */}
        <Stack
          spacing={2}
          direction={"row"}
          alignItems="center"
          justifyContent={"end"}
        >
          <Button onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading ? "Creating..." : "Create Group"}
          </Button>
        </Stack>
      </Stack>
    </FormProvider>
  );
};

const CreateGroup = ({ open, handleClose }) => {
  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleClose}
      aria-describedby="alert-dialog-slide-description"
      sx={{ p: 4 }}
    >
      <DialogTitle>{"Create New Group"}</DialogTitle>

      <DialogContent sx={{ mt: 4 }}>
        {/* Create Group Form */}
        <CreateGroupForm handleClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroup;