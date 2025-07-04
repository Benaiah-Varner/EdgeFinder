'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

interface Trade {
  id: string;
  userId: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  entryDate: string;
  exitDate: string | null;
  tradeType: string;
  imageUrl: string | null;
  description: string | null;
  pnl: number | null;
  createdAt: string;
  updatedAt: string;
  strategyId: string;
}

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  trades: Trade[];
}

interface StrategyStats {
  winRate: number;
  totalPnL: number;
  avgWinnerGain: number;
  avgLoserLoss: number;
  totalTrades: number;
}

export default function StrategyPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchStrategies();
  }, [token]);

  const fetchStrategies = async () => {
    try {

      const response = await fetch('http://localhost:3001/strategies', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch strategies');
      }

      const data = await response.json();
      setStrategies(data.strategies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateStrategyStats = (trades: Trade[]): StrategyStats => {
    const completedTrades = trades.filter(trade => trade.pnl !== null);
    const totalTrades = completedTrades.length;
    
    if (totalTrades === 0) {
      return {
        winRate: 0,
        totalPnL: 0,
        avgWinnerGain: 0,
        avgLoserLoss: 0,
        totalTrades: 0,
      };
    }

    const winners = completedTrades.filter(trade => trade.pnl! > 0);
    const losers = completedTrades.filter(trade => trade.pnl! < 0);
    
    const winRate = (winners.length / totalTrades) * 100;
    const totalPnL = completedTrades.reduce((sum, trade) => sum + trade.pnl!, 0);
    
    const avgWinnerGain = winners.length > 0 
      ? winners.reduce((sum, trade) => sum + trade.pnl!, 0) / winners.length 
      : 0;
    
    const avgLoserLoss = losers.length > 0 
      ? losers.reduce((sum, trade) => sum + trade.pnl!, 0) / losers.length 
      : 0;

    return {
      winRate,
      totalPnL,
      avgWinnerGain,
      avgLoserLoss,
      totalTrades,
    };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Trading Strategies
      </Typography>
      
      {strategies.length === 0 ? (
        <Alert severity="info">No strategies found. Create your first strategy to get started!</Alert>
      ) : (
        <Grid container spacing={3}>
          {strategies.map((strategy) => {
            const stats = calculateStrategyStats(strategy.trades);
            
            return (
              <Grid item xs={12} md={6} lg={4} key={strategy.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {strategy.name}
                    </Typography>
                    
                    {strategy.description && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {strategy.description}
                      </Typography>
                    )}
                    
                    <Box mt={2}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Win Rate
                          </Typography>
                          <Typography variant="h6" color={stats.winRate >= 50 ? 'success.main' : 'error.main'}>
                            {stats.winRate.toFixed(1)}%
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total P/L
                          </Typography>
                          <Typography variant="h6" color={stats.totalPnL >= 0 ? 'success.main' : 'error.main'}>
                            ${stats.totalPnL.toFixed(2)}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Avg Winner
                          </Typography>
                          <Typography variant="body1" color="success.main">
                            ${stats.avgWinnerGain.toFixed(2)}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Avg Loser
                          </Typography>
                          <Typography variant="body1" color="error.main">
                            ${stats.avgLoserLoss.toFixed(2)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                    
                    <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                      <Chip 
                        label={`${stats.totalTrades} trades`} 
                        size="small" 
                        variant="outlined"
                      />
                      <Chip 
                        label={`${strategy.trades.length} total positions`} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}