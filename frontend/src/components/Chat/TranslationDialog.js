import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  ListSubheader,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { UpdateTranslationSettings } from '../../redux/slices/app';

const languages = [
  // Indian Languages
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'mr', name: 'Marathi' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'or', name: 'Odia' },
  { code: 'as', name: 'Assamese' },
  { code: 'ur', name: 'Urdu' },
  { code: 'sa', name: 'Sanskrit' },
  { code: 'kok', name: 'Konkani' },
  { code: 'ne', name: 'Nepali' },
  // Other Languages
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
];

const TranslationDialog = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const translationSettings = useSelector((state) => state.app.translationSettings);
  const [sourceLang, setSourceLang] = useState(translationSettings?.sourceLang || 'en');
  const [targetLang, setTargetLang] = useState(translationSettings?.targetLang || 'en');
  const [hoverEnabled, setHoverEnabled] = useState(translationSettings?.hoverEnabled ?? true);

  const handleConfirm = () => {
    dispatch(UpdateTranslationSettings({
      sourceLang,
      targetLang,
      enabled: true,
      hoverEnabled
    }));
    onClose();
  };

  const renderLanguageOptions = () => {
    const indianLanguages = languages.filter(lang => 
      ['hi', 'bn', 'ta', 'te', 'kn', 'ml', 'gu', 'mr', 'pa', 'or', 'as', 'ur', 'sa', 'kok', 'ne'].includes(lang.code)
    );
    const otherLanguages = languages.filter(lang => 
      !['hi', 'bn', 'ta', 'te', 'kn', 'ml', 'gu', 'mr', 'pa', 'or', 'as', 'ur', 'sa', 'kok', 'ne'].includes(lang.code)
    );

    const options = [];

    options.push(
      <ListSubheader key="indian">Indian Languages</ListSubheader>
    );

    indianLanguages.forEach(lang => {
      options.push(
        <MenuItem key={lang.code} value={lang.code}>
          {lang.name}
        </MenuItem>
      );
    });

    options.push(
      <ListSubheader key="other">Other Languages</ListSubheader>
    );

    otherLanguages.forEach(lang => {
      options.push(
        <MenuItem key={lang.code} value={lang.code}>
          {lang.name}
        </MenuItem>
      );
    });

    return options;
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Translate Messages</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Translate from</InputLabel>
            <Select
              value={sourceLang}
              label="Translate from"
              onChange={(e) => setSourceLang(e.target.value)}
            >
              {renderLanguageOptions()}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Translate to</InputLabel>
            <Select
              value={targetLang}
              label="Translate to"
              onChange={(e) => setTargetLang(e.target.value)}
            >
              {renderLanguageOptions()}
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={hoverEnabled}
                  onChange={(e) => setHoverEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  Enable hover translation
                </Typography>
              }
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TranslationDialog; 