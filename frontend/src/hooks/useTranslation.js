import { useState, useCallback } from 'react';

const useTranslation = () => {
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const translateText = useCallback(async (text, sourceLang, targetLang) => {
    console.log('Starting translation:', { text, sourceLang, targetLang });
    
    if (!text || !targetLang) {
      console.log('Missing required parameters:', { text, targetLang });
      setError('Missing required parameters');
      return;
    }
    
    setIsLoading(true);
    setTranslatedText(''); // Clear previous translation
    setError(null);
    
    try {
      // Use MyMemory Translation API
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang === 'auto' ? 'auto' : sourceLang}|${targetLang}`;
      console.log('Translation API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Translation failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Translation API Data:', data);
      
      if (data.responseStatus === 200 && data.responseData) {
        if (data.responseData.translatedText === text) {
          // If the translation is the same as input, add a note
          setTranslatedText(`${data.responseData.translatedText} (Same in ${targetLang})`);
        } else {
          setTranslatedText(data.responseData.translatedText);
        }
      } else {
        throw new Error(data.responseDetails || 'Translation failed');
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError(err.message);
      setTranslatedText('Translation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    translatedText,
    isLoading,
    error,
    translateText,
  };
};

export default useTranslation; 