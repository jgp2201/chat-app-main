import React, { useState, useEffect } from "react";
import {
  Dialog,
  Slide,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  Box,
  Divider,
  Grid,
  IconButton,
  Paper,
  Switch,
  FormControlLabel
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Image, UploadSimple, X } from "phosphor-react";
import { useSelector } from "react-redux";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Sample default wallpapers with stable image URLs
const defaultWallpapers = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&h=800&q=80", // Nature
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=800&q=80", // Mountains
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&q=80", // Forest
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&q=80", // Beach
  "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1200&h=800&q=80", // Sky
  "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&h=800&q=80", // City
];

const WallpaperDialog = ({ open, handleClose }) => {
  const theme = useTheme();
  const { chat_type, room_id } = useSelector((state) => state.app);

  // Track if the wallpaper should apply to current conversation only
  const [applyToCurrentOnly, setApplyToCurrentOnly] = useState(true);

  // Get conversation name for display
  const { direct_chat, group_chat } = useSelector((state) => state.conversation);
  const current_conversation = chat_type === "individual" 
    ? direct_chat.current_conversation 
    : group_chat.current_conversation;
  
  const conversationName = current_conversation?.name || 'this conversation';

  // Generate a unique key for the current conversation
  const getConversationKey = () => {
    if (!room_id) return null;
    return `wallpaper_${chat_type}_${room_id}`;
  };
  
  // Get the global wallpaper (for all chats)
  const getGlobalWallpaper = () => {
    return localStorage.getItem('chat_wallpaper');
  };
  
  // Get the wallpaper for the current conversation
  const getConversationWallpaper = () => {
    const key = getConversationKey();
    return key ? localStorage.getItem(key) : null;
  };

  // Initialize state with the current wallpaper from localStorage if available
  const [selectedWallpaper, setSelectedWallpaper] = useState(() => {
    return getConversationWallpaper() || getGlobalWallpaper() || null;
  });
  const [customWallpaper, setCustomWallpaper] = useState(null);

  // Update selected wallpaper when conversation changes
  useEffect(() => {
    if (applyToCurrentOnly) {
      setSelectedWallpaper(getConversationWallpaper() || getGlobalWallpaper() || null);
    } else {
      setSelectedWallpaper(getGlobalWallpaper() || null);
    }
  }, [applyToCurrentOnly, room_id]);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/gif")) {
      const imageUrl = URL.createObjectURL(file);
      setCustomWallpaper(imageUrl);
      setSelectedWallpaper(imageUrl);
    }
  };

  // Handle selecting a default wallpaper
  const handleSelectWallpaper = (wallpaper) => {
    setSelectedWallpaper(wallpaper);
  };

  // Handle removing custom wallpaper
  const handleRemoveCustomWallpaper = () => {
    URL.revokeObjectURL(customWallpaper);
    setCustomWallpaper(null);
    setSelectedWallpaper(null);
  };

  // Add a function to remove the wallpaper
  const handleRemoveWallpaper = () => {
    if (applyToCurrentOnly) {
      const key = getConversationKey();
      if (key) {
        localStorage.removeItem(key);
        // Also clear cache
        localStorage.removeItem(`wallpaper_cache_${key}`);
        sessionStorage.removeItem(`wallpaper_cache_${key}`);
      }
    } else {
      localStorage.removeItem('chat_wallpaper');
      // Clear global cache
      localStorage.removeItem('wallpaper_cache_global');
      sessionStorage.removeItem('wallpaper_cache_global');
      
      // Also remove all per-conversation wallpapers
      if (window.confirm("Do you want to remove wallpapers from all conversations?")) {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('wallpaper_')) {
            localStorage.removeItem(key);
            // Clear the corresponding cache
            localStorage.removeItem(`wallpaper_cache_${key}`);
            sessionStorage.removeItem(`wallpaper_cache_${key}`);
          }
        });
      }
    }
    
    setSelectedWallpaper(null);
    
    // Dispatch a custom event specifically for wallpaper updates
    window.dispatchEvent(new CustomEvent('wallpaper_update'));
    
    // Also dispatch storage event for cross-tab compatibility
    window.dispatchEvent(new StorageEvent('storage', { 
      key: applyToCurrentOnly ? getConversationKey() : 'chat_wallpaper' 
    }));
    
    handleClose();
  };

  // Apply the selected wallpaper
  const handleApply = () => {
    // Save the selected wallpaper to localStorage
    if (selectedWallpaper) {
      if (applyToCurrentOnly) {
        const key = getConversationKey();
        if (key) {
          localStorage.setItem(key, selectedWallpaper);
          // Also update cache
          try {
            localStorage.setItem(`wallpaper_cache_${key}`, selectedWallpaper);
            sessionStorage.setItem(`wallpaper_cache_${key}`, selectedWallpaper);
            // Keep a backup in session storage
            sessionStorage.setItem('current_wallpaper', selectedWallpaper);
          } catch (error) {
            console.log("Storage error:", error);
          }
        }
      } else {
        localStorage.setItem('chat_wallpaper', selectedWallpaper);
        // Also update cache
        try {
          localStorage.setItem('wallpaper_cache_global', selectedWallpaper);
          sessionStorage.setItem('wallpaper_cache_global', selectedWallpaper);
          // Keep a backup in session storage
          sessionStorage.setItem('current_wallpaper', selectedWallpaper);
        } catch (error) {
          console.log("Storage error:", error);
        }
      }
      
      // Dispatch a custom event specifically for wallpaper updates
      window.dispatchEvent(new CustomEvent('wallpaper_update'));
      
      // Also dispatch storage event for cross-tab compatibility
      window.dispatchEvent(new StorageEvent('storage', { 
        key: applyToCurrentOnly ? getConversationKey() : 'chat_wallpaper',
        newValue: selectedWallpaper
      }));
    }
    handleClose();
  };

  const handleToggleApplyTo = () => {
    setApplyToCurrentOnly(!applyToCurrentOnly);
  };
  
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
          <Image size={24} weight="fill" />
          {"Chat Wallpaper"}
        </DialogTitle>
        
        <Divider sx={{ 
          borderColor: theme.palette.mode === 'light' 
            ? 'rgba(0,0,0,0.08)' 
            : 'rgba(255,255,255,0.08)'
        }} />
        
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Apply to option */}
            {room_id && (
              <Box>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={applyToCurrentOnly}
                      onChange={handleToggleApplyTo}
                    />
                  }
                  label={`Apply only to ${applyToCurrentOnly ? conversationName : 'all conversations'}`}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {applyToCurrentOnly 
                    ? 'This wallpaper will only be applied to the current conversation' 
                    : 'This wallpaper will be applied to all conversations'}
                </Typography>
              </Box>
            )}
          
            {/* Custom wallpaper upload section */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Upload Custom Wallpaper
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadSimple size={20} />}
                  sx={{
                    borderRadius: 1.5,
                    py: 1,
                  }}
                >
                  Choose File
                  <input
                    type="file"
                    hidden
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handleFileUpload}
                  />
                </Button>
                
                {customWallpaper && (
                  <Paper
                    elevation={0}
                    sx={{
                      position: 'relative',
                      height: 80,
                      width: 80,
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      border: `2px solid ${selectedWallpaper === customWallpaper ? theme.palette.primary.main : 'transparent'}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSelectWallpaper(customWallpaper)}
                  >
                    <Box
                      component="img"
                      src={customWallpaper}
                      alt="Custom wallpaper"
                      sx={{
                        height: '100%',
                        width: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.7)',
                        },
                        padding: '2px',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustomWallpaper();
                      }}
                    >
                      <X size={14} />
                    </IconButton>
                  </Paper>
                )}
              </Box>
            </Box>
            
            {/* Default wallpapers section */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Default Wallpapers
              </Typography>
              
              <Grid container spacing={2}>
                {defaultWallpapers.map((wallpaper, index) => (
                  <Grid item xs={6} sm={4} md={2} key={index}>
                    <Paper
                      elevation={2}
                      sx={{
                        height: 120,
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: `2px solid ${selectedWallpaper === wallpaper ? theme.palette.primary.main : 'transparent'}`,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.03)',
                        },
                      }}
                      onClick={() => handleSelectWallpaper(wallpaper)}
                    >
                      <Box
                        component="img"
                        src={wallpaper}
                        alt={`Wallpaper ${index + 1}`}
                        sx={{
                          height: '100%',
                          width: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Preview section */}
            {selectedWallpaper && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Preview
                </Typography>
                
                <Paper
                  elevation={3}
                  sx={{
                    height: 200,
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <Box
                    component="img"
                    src={selectedWallpaper}
                    alt="Wallpaper preview"
                    sx={{
                      height: '100%',
                      width: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  
                  {/* Sample message bubbles for preview */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      right: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: theme.palette.background.paper,
                        p: 1.5,
                        borderRadius: 2,
                        borderTopLeftRadius: 0,
                        maxWidth: '70%',
                        alignSelf: 'flex-start',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }}
                    >
                      <Typography variant="body2">Hello! How are you?</Typography>
                    </Box>
                    
                    <Box
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        p: 1.5,
                        borderRadius: 2,
                        borderTopRightRadius: 0,
                        maxWidth: '70%',
                        alignSelf: 'flex-end',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }}
                    >
                      <Typography variant="body2">I'm doing great, thanks!</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )}
          </Stack>
        </DialogContent>
        
        <Divider sx={{ 
          borderColor: theme.palette.mode === 'light' 
            ? 'rgba(0,0,0,0.08)' 
            : 'rgba(255,255,255,0.08)'
        }} />
        
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button 
            onClick={handleClose}
            sx={{
              borderRadius: 1.5,
              color: theme.palette.text.primary,
            }}
          >
            Cancel
          </Button>
          {(applyToCurrentOnly ? getConversationWallpaper() : getGlobalWallpaper()) && (
            <Button 
              onClick={handleRemoveWallpaper}
              color="error"
              sx={{
                borderRadius: 1.5,
              }}
            >
              Remove Wallpaper
            </Button>
          )}
          <Button 
            variant="contained" 
            onClick={handleApply}
            disabled={!selectedWallpaper}
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

export default WallpaperDialog; 