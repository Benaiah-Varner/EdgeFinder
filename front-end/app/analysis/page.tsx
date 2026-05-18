'use client';

import { Container, Typography } from '@mui/material';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ExecutionPerformancePage() {
  return (
    <ProtectedRoute>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1">
          Execution Performance
        </Typography>
      </Container>
    </ProtectedRoute>
  );
}
