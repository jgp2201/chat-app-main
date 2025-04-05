import React, { useEffect } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { CaretLeft } from "phosphor-react";
import ProfileForm from "../../../sections/dashboard/Settings/ProfileForm";
import { useDispatch } from "react-redux";
import { FetchUserProfile } from "../../../redux/slices/app";

const Profile = () => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(FetchUserProfile());
  }, []);

  return (
    <>
      <Stack direction="row" sx={{ width: "100%" }}>
        {/* Left Pane */}
        <Box
          sx={{
            overflowY: "auto",
            height: "100vh",
            width: 320,
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? "#F8FAFF"
                : theme.palette.background,
            boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
            borderRight: (theme) => `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
            "&::-webkit-scrollbar": {
              width: "8px",
              borderRadius: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: (theme) => theme.palette.mode === "light" 
                ? "rgba(0,0,0,0.2)" 
                : "rgba(255,255,255,0.2)",
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: (theme) => theme.palette.mode === "light" 
                  ? "rgba(0,0,0,0.3)" 
                  : "rgba(255,255,255,0.3)",
              }
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
              borderRadius: "8px",
            }
          }}
        >
          <Stack p={4} spacing={5}>
            {/* Header */}
            <Stack direction="row" alignItems={"center"} spacing={3}>
              <IconButton>
                <CaretLeft size={24} color={"#4B4B4B"} />
              </IconButton>

              <Typography variant="h5">Profile</Typography>
            </Stack>

            {/* Profile Edit Form */}
            <ProfileForm />
          </Stack>
        </Box>

        {/* Right Pane */}
        <Box
          sx={{
            height: "100%",
            width: "calc(100vw - 420px )",
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? "#FFF"
                : theme.palette.background.paper,
            borderBottom: "6px solid #0162C4",
          }}
        ></Box>
      </Stack>
    </>
  );
};

export default Profile;
