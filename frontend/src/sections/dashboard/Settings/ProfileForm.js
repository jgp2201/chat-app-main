import React, { useCallback, useState, useEffect } from "react";
import * as Yup from "yup";
// form
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import FormProvider from "../../../components/hook-form/FormProvider";
import { RHFTextField, RHFUploadAvatar } from "../../../components/hook-form";
import { Stack, Alert, Collapse } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useDispatch, useSelector } from "react-redux";
import { UpdateUserProfile, FetchUserProfile } from "../../../redux/slices/app";
import { AWS_S3_REGION, S3_BUCKET_NAME } from "../../../config";

const ProfileForm = () => {
  const dispatch = useDispatch();
  const [file, setFile] = useState();
  const { user } = useSelector((state) => state.app);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const ProfileSchema = Yup.object().shape({
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string().required("Last name is required"),
    about: Yup.string().required("About is required"),
    avatar: Yup.string().required("Avatar is required").nullable(true),
  });

  const defaultValues = {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    about: user?.about || '',
    avatar: user?.avatar ? `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${user?.avatar}` : '',
  };

  const methods = useForm({
    resolver: yupResolver(ProfileSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { isSubmitSuccessful },
  } = methods;

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        about: user.about || '',
        avatar: user.avatar ? `https://${S3_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${user.avatar}` : '',
      });
    }
  }, [user, reset]);

  const values = watch();

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      // Send API request
      console.log("DATA", data);
      await dispatch(
        UpdateUserProfile({
          firstName: data?.firstName,
          lastName: data?.lastName,
          about: data?.about,
          avatar: file,
        })
      );
      
      // Fetch updated user profile
      await dispatch(FetchUserProfile());
      
      // Show success message
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      setFile(file);

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      if (file) {
        setValue("avatar", newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        {/* Success message */}
        <Collapse in={showSuccess}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Profile updated successfully!
          </Alert>
        </Collapse>

        <RHFUploadAvatar 
          name="avatar" 
          maxSize={3145728} 
          onDrop={handleDrop}
          sx={{
            mx: 'auto',
            borderRadius: '50%',
            border: (theme) => `4px solid ${theme.palette.background.paper}`,
            boxShadow: '0px 0px 8px rgba(0,0,0,0.1)',
            width: 120,
            height: 120,
          }}
        />

        <RHFTextField
          helperText={"This name is visible to your contacts"}
          name="firstName"
          label="First Name"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              backgroundColor: (theme) => theme.palette.mode === 'light' 
                ? 'rgba(0,0,0,0.01)' 
                : 'rgba(255,255,255,0.01)',
            }
          }}
        />
        
        <RHFTextField
          name="lastName"
          label="Last Name"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              backgroundColor: (theme) => theme.palette.mode === 'light' 
                ? 'rgba(0,0,0,0.01)' 
                : 'rgba(255,255,255,0.01)',
            }
          }}
        />
        
        <RHFTextField 
          multiline 
          rows={4} 
          name="about" 
          label="About"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              backgroundColor: (theme) => theme.palette.mode === 'light' 
                ? 'rgba(0,0,0,0.01)' 
                : 'rgba(255,255,255,0.01)',
            }
          }}
        />

        <LoadingButton
          loading={isSubmitting}
          type="submit"
          variant="contained"
          sx={{
            height: 48,
            borderRadius: 1.5,
          }}
        >
          Save Changes
        </LoadingButton>
      </Stack>
    </FormProvider>
  );
};

export default ProfileForm;
