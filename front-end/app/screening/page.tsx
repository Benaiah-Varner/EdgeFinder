'use client';

import { Box, Typography, Container } from '@mui/material';

export default function ScreeningPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Stock Screening
        </Typography>
        <Typography variant="body1">
          Coming soon - Stock screening functionality will be available in a future update.
        </Typography>
      </Box>
    </Container>
  );
}