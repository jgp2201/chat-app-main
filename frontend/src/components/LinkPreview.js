import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack, CircularProgress, Link } from '@mui/material';
import { getLinkPreview } from 'link-preview-js';

const LinkPreview = ({ url }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        const data = await getLinkPreview(url);
        setPreview(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchPreview();
    }
  }, [url]);

  if (loading) {
    return (
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error || !preview) {
    return (
      <Link href={url} target="_blank" rel="noopener noreferrer" underline="hover">
        {url}
      </Link>
    );
  }

  return (
    <Link 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      underline="none"
      sx={{ color: 'inherit' }}
    >
      <Stack spacing={1} sx={{ p: 1.5 }}>
        {preview.images?.[0] && (
          <Box 
            component="img"
            src={preview.images[0]}
            alt={preview.title || "Link preview"}
            sx={{
              width: '100%',
              height: 150,
              objectFit: 'cover',
              borderRadius: 1,
            }}
          />
        )}
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" noWrap>
            {preview.title || url}
          </Typography>
          {preview.description && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {preview.description}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" noWrap>
            {preview.siteName || new URL(url).hostname}
          </Typography>
        </Stack>
      </Stack>
    </Link>
  );
};

export default LinkPreview; 