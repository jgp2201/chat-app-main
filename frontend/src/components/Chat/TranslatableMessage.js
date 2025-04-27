import React, { useState } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { useSelector } from 'react-redux';

const TranslatableMessage = ({ children }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [translatedText, setTranslatedText] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const translationSettings = useSelector((state) => state.app.translationSettings);

  const getTextContent = (element) => {
    if (typeof element === 'string') {
      return element;
    }
    if (React.isValidElement(element)) {
      if (element.props && element.props.children) {
        return getTextContent(element.props.children);
      }
      return '';
    }
    if (Array.isArray(element)) {
      return element.map(child => getTextContent(child)).join(' ');
    }
    return '';
  };

  const handleMouseMove = (e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseEnter = async () => {
    if (!translationSettings?.enabled || !translationSettings?.hoverEnabled) return;
    
    setIsHovered(true);
    if (translatedText) return; // Don't translate again if we already have a translation

    try {
      setIsLoading(true);
      const textToTranslate = getTextContent(children);
      
      if (!textToTranslate.trim()) {
        return;
      }

      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=${translationSettings.sourceLang === 'auto' ? 'auto' : translationSettings.sourceLang}|${translationSettings.targetLang}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Translation failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData) {
        if (data.responseData.translatedText === textToTranslate) {
          setTranslatedText(`${data.responseData.translatedText} (Same in ${translationSettings.targetLang})`);
        } else {
          setTranslatedText(data.responseData.translatedText);
        }
      } else {
        throw new Error(data.responseDetails || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Translation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  if (!translationSettings?.enabled) {
    return children;
  }

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      sx={{
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      {children}
      {isHovered && (translatedText || isLoading) && (
        <Box
          sx={{
            position: 'fixed',
            top: mousePosition.y - 50,
            left: mousePosition.x,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            zIndex: 1000,
            maxWidth: '300px',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="body1" sx={{ fontSize: '1.2rem', fontWeight: 500 }}>
            {isLoading ? 'Translating...' : translatedText}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TranslatableMessage; 