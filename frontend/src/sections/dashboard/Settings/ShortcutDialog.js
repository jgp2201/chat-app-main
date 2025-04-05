import React from "react";
import {
  Dialog,
  Slide,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  Grid,
  Box,
  Divider
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Keyboard } from "phosphor-react";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const list = [
  {
    key: 0,
    title: "Mark as unread",
    combination: ["Cmd", "Shift", "U"],
  },
  {
    key: 1,
    title: "Mute",
    combination: ["Cmd", "Shift", "M"],
  },
  {
    key: 2,
    title: "Archive Chat",
    combination: ["Cmd", "Shift", "E"],
  },
  {
    key: 3,
    title: "Delete Chat",
    combination: ["Cmd", "Shift", "D"],
  },
  {
    key: 4,
    title: "Pin Chat",
    combination: ["Cmd", "Shift", "P"],
  },
  {
    key: 5,
    title: "Search",
    combination: ["Cmd", "F"],
  },
  {
    key: 6,
    title: "Search Chat",
    combination: ["Cmd", "Shift", "F"],
  },
  {
    key: 7,
    title: "Next Chat",
    combination: ["Cmd", "N"],
  },
  {
    key: 8,
    title: "Next Step",
    combination: ["Ctrl", "Tab"],
  },
  {
    key: 9,
    title: "Previous Step",
    combination: ["Ctrl", "Shift", "Tab"],
  },
  {
    key: 10,
    title: "New Group",
    combination: ["Cmd", "Shift", "N"],
  },
  {
    key: 11,
    title: "Profile & About",
    combination: ["Cmd", "P"],
  },
  {
    key: 12,
    title: "Increase speed of voice message",
    combination: ["Shift", "."],
  },
  {
    key: 13,
    title: "Decrease speed of voice message",
    combination: ["Shift", ","],
  },
  {
    key: 14,
    title: "Settings",
    combination: ["Shift", "S"],
  },
  {
    key: 15,
    title: "Emoji Panel",
    combination: ["Cmd", "E"],
  },
  {
    key: 16,
    title: "Sticker Panel",
    combination: ["Cmd", "S"],
  },
];

const ShortcutDialog = ({ open, handleClose }) => {
  const theme = useTheme();
  
  return (
    <>
      <Dialog
        fullWidth
        maxWidth="md"
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
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
          <Keyboard size={24} weight="fill" />
          {"Keyboard Shortcuts"}
        </DialogTitle>
        
        <Divider sx={{ 
          borderColor: theme.palette.mode === 'light' 
            ? 'rgba(0,0,0,0.08)' 
            : 'rgba(255,255,255,0.08)'
        }} />
        
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {list.map(({ key, title, combination }) => (
              <Grid item xs={12} sm={6} key={key}>
                <Stack
                  sx={{ 
                    width: "100%",
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: theme.palette.mode === 'light' 
                      ? 'rgba(0,0,0,0.02)' 
                      : 'rgba(255,255,255,0.02)',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'light' 
                        ? 'rgba(0,0,0,0.04)' 
                        : 'rgba(255,255,255,0.04)',
                    },
                    transition: 'background-color 0.2s ease-in-out'
                  }}
                  justifyContent="space-between"
                  spacing={2}
                  direction={"row"}
                  alignItems="center"
                >
                  <Typography variant="body2" fontWeight={500} sx={{ color: theme.palette.text.primary }}>
                    {title}
                  </Typography>
                  <Stack spacing={1} direction="row">
                    {combination.map((el, index) => (
                      <Box
                        key={index}
                        sx={{
                          backgroundColor: theme.palette.mode === 'light' 
                            ? 'rgba(0,0,0,0.04)' 
                            : 'rgba(255,255,255,0.04)',
                          borderRadius: 1,
                          px: 1.5,
                          py: 0.75,
                          minWidth: '40px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          border: `1px solid ${theme.palette.mode === 'light' 
                            ? 'rgba(0,0,0,0.1)' 
                            : 'rgba(255,255,255,0.1)'}`,
                          boxShadow: theme.palette.mode === 'light' 
                            ? '0px 1px 3px rgba(0,0,0,0.08)' 
                            : '0px 1px 3px rgba(0,0,0,0.12)',
                          color: theme.palette.primary.main,
                          fontWeight: 600,
                          fontSize: '12px'
                        }}
                      >
                        {el}
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        
        <Divider sx={{ 
          borderColor: theme.palette.mode === 'light' 
            ? 'rgba(0,0,0,0.08)' 
            : 'rgba(255,255,255,0.08)'
        }} />
        
        <DialogActions sx={{ p: 2.5 }}>
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
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ShortcutDialog;
