'use client';

import { Box, Typography, Container } from '@mui/material';

export default function BacktestingPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Backtesting
        </Typography>
        <Typography variant="body1">
          Coming soon - Backtesting functionality will be available in a future update.
        </Typography>
      </Box>
    </Container>
  );
}