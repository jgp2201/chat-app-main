import React from "react";
import { Box, CircularProgress, Typography, keyframes } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const pulse = keyframes`
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.9;
  }
  100% {
    opacity: 0.6;
  }
`;

const LoadingScreen = () => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.palette.mode === "light" 
          ? "#F8FAFF" 
          : theme.palette.background.default,
      }}
    >
      <Box 
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          animation: `${pulse} 1.5s ease-in-out infinite`,
        }}
      >
        <CircularProgress 
          size={60} 
          thickness={4} 
          sx={{ 
            color: theme.palette.primary.main,
          }} 
        />
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 500,
            color: theme.palette.text.primary,
            letterSpacing: 1,
          }}
        >
          Loading...
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingScreen;
