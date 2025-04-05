import React from "react";
import {
  Dialog,
  Slide,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  Stack,
  Typography,
  Box
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Sun, Moon, DesktopTower } from "phosphor-react";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ThemeDialog = ({ open, handleClose }) => {
  const theme = useTheme();
  
  return (
    <>
      <Dialog
        fullWidth
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
          fontWeight: 600,
          p: 3,
          pb: 1
        }}>{"Choose Theme"}</DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <FormControl fullWidth>
            <RadioGroup
              aria-labelledby="theme-radio-buttons-group-label"
              defaultValue="light"
              name="theme-radio-buttons"
            >
              <Stack spacing={2} sx={{ pt: 1 }}>
                <Box 
                  sx={{
                    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 2,
                    p: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'light' 
                        ? 'rgba(0,0,0,0.02)' 
                        : 'rgba(255,255,255,0.02)',
                      borderColor: theme.palette.primary.main,
                    }
                  }}
                >
                  <FormControlLabel
                    value="light"
                    control={<Radio />}
                    label={
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Sun size={20} weight="fill" />
                        <Typography>Light Mode</Typography>
                      </Stack>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </Box>
                
                <Box 
                  sx={{
                    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 2,
                    p: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'light' 
                        ? 'rgba(0,0,0,0.02)' 
                        : 'rgba(255,255,255,0.02)',
                      borderColor: theme.palette.primary.main,
                    }
                  }}
                >
                  <FormControlLabel
                    value="dark"
                    control={<Radio />}
                    label={
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Moon size={20} weight="fill" />
                        <Typography>Dark Mode</Typography>
                      </Stack>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </Box>
                
                <Box 
                  sx={{
                    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 2,
                    p: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'light' 
                        ? 'rgba(0,0,0,0.02)' 
                        : 'rgba(255,255,255,0.02)',
                      borderColor: theme.palette.primary.main,
                    }
                  }}
                >
                  <FormControlLabel
                    value="system"
                    control={<Radio />}
                    label={
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <DesktopTower size={20} weight="fill" />
                        <Typography>System Default</Typography>
                      </Stack>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </Box>
              </Stack>
            </RadioGroup>
          </FormControl>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button 
            onClick={handleClose}
            sx={{
              borderRadius: 1.5,
              color: theme.palette.text.primary,
            }}
          >
            Cancel
          </Button>
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
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ThemeDialog;
