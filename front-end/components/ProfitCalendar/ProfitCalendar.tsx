'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  IconButton,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import type { Trade } from '../../app/journal/page';

interface ProfitCalendarProps {
  trades: Trade[];
}

interface DayData {
  date: Date;
  pnl: number;
  tradeCount: number;
}

interface MonthData {
  month: string;
  year: number;
  pnl: number;
  tradeCount: number;
}

const ProfitCalendar: React.FC<ProfitCalendarProps> = ({ trades }) => {
  const [view, setView] = useState<'month' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate monthly P/L data
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, MonthData>();

    trades.forEach(trade => {
      if (trade.exitDate && trade.pnl !== null && trade.pnl !== undefined) {
        const exitDate = new Date(trade.exitDate);
        const monthKey = `${exitDate.getFullYear()}-${exitDate.getMonth()}`;
        
        if (monthMap.has(monthKey)) {
          const existing = monthMap.get(monthKey)!;
          existing.pnl += trade.pnl;
          existing.tradeCount += 1;
        } else {
          monthMap.set(monthKey, {
            month: exitDate.toLocaleString('default', { month: 'long' }),
            year: exitDate.getFullYear(),
            pnl: trade.pnl,
            tradeCount: 1,
          });
        }
      }
    });

    return Array.from(monthMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return new Date(`${a.month} 1, ${a.year}`).getMonth() - new Date(`${b.month} 1, ${b.year}`).getMonth();
    });
  }, [trades]);

  // Calculate daily P/L data for the current month
  const dailyData = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const dayMap = new Map<string, DayData>();

    trades.forEach(trade => {
      if (trade.exitDate && trade.pnl !== null && trade.pnl !== undefined) {
        const exitDate = new Date(trade.exitDate);
        
        if (exitDate.getMonth() === currentMonth && exitDate.getFullYear() === currentYear) {
          const dayKey = exitDate.toDateString();
          
          if (dayMap.has(dayKey)) {
            const existing = dayMap.get(dayKey)!;
            existing.pnl += trade.pnl;
            existing.tradeCount += 1;
          } else {
            dayMap.set(dayKey, {
              date: exitDate,
              pnl: trade.pnl,
              tradeCount: 1,
            });
          }
        }
      }
    });

    return Array.from(dayMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [trades, currentDate]);

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: 'month' | 'day'
  ) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPnlColor = (pnl: number) => {
    if (pnl > 0) return 'success.main';
    if (pnl < 0) return 'error.main';
    return 'text.primary';
  };

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            Profit Calendar
          </Typography>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            aria-label="calendar view"
            size="small"
          >
            <ToggleButton value="month" aria-label="month view">
              Month
            </ToggleButton>
            <ToggleButton value="day" aria-label="day view">
              Day
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {view === 'month' && (
          <Grid container spacing={2}>
            {monthlyData.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  No trade data available
                </Typography>
              </Grid>
            ) : (
              monthlyData.map((monthData, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      backgroundColor: monthData.pnl >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                      border: '1px solid',
                      borderColor: monthData.pnl >= 0 ? 'success.main' : 'error.main',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      {monthData.month} {monthData.year}
                    </Typography>
                    <Typography
                      variant="h4"
                      color={getPnlColor(monthData.pnl)}
                      gutterBottom
                    >
                      {formatCurrency(monthData.pnl)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {monthData.tradeCount} trade{monthData.tradeCount !== 1 ? 's' : ''}
                    </Typography>
                  </Paper>
                </Grid>
              ))
            )}
          </Grid>
        )}

        {view === 'day' && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
              <IconButton onClick={() => navigateMonth('prev')}>
                <ChevronLeft />
              </IconButton>
              <Typography variant="h6" sx={{ mx: 2 }}>
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Typography>
              <IconButton onClick={() => navigateMonth('next')}>
                <ChevronRight />
              </IconButton>
            </Box>
            
            <Grid container spacing={2}>
              {dailyData.length === 0 ? (
                <Grid item xs={12}>
                  <Typography variant="body1" color="text.secondary" textAlign="center">
                    No trades for this month
                  </Typography>
                </Grid>
              ) : (
                dailyData.map((dayData, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        backgroundColor: dayData.pnl >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                        border: '1px solid',
                        borderColor: dayData.pnl >= 0 ? 'success.main' : 'error.main',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="subtitle1" gutterBottom>
                        {dayData.date.toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Typography>
                      <Typography
                        variant="h5"
                        color={getPnlColor(dayData.pnl)}
                        gutterBottom
                      >
                        {formatCurrency(dayData.pnl)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {dayData.tradeCount} trade{dayData.tradeCount !== 1 ? 's' : ''}
                      </Typography>
                    </Paper>
                  </Grid>
                ))
              )}
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitCalendar;