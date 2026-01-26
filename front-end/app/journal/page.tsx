'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  FormControl,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import ProfitCalendar from '@/components/ProfitCalendar';
import AddNewTrade from '@/components/Journal/AddNewTrade';
import TradeDetailsDialog from '@/components/Journal/TradeDetailsDialog';

export interface Trade {
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  entryDate: Date;
  exitDate: Date;
  entryTime?: string;
  exitTime?: string;
  outcome: 'win' | 'loss';
  strategy: {
    id: string;
    name: string;
    description?: string;
  };
  description: string;
  image?: string;
  imageUrl?: string;
  pnl: number;
  R?: number;
  properEntry?: boolean;
  alignedWithTrend?: boolean;
  properConditions?: boolean;
  followedTpPlan?: boolean;
  properSize?: boolean;
}

export default function JournalPage() {
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string>('All time');
  const [strategyFilter, setStrategyFilter] = useState<string>('All strategies');
  const [customFilters, setCustomFilters] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [tradesPerPage] = useState(20);
  const { user, token } = useAuth();

  const [trades, setTrades] = useState<Trade[]>([]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (user) {
      setTrades(user.trades);
    }
  }, [user]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [dateFilter, strategyFilter, customFilters]);

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setDetailsOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setSelectedTrade(null);
  };

  const handleCheckboxClick = (id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter(item => item !== id);
    }

    setSelected(newSelected);
  };

  // Generate month options from actual trade dates
  const monthOptions = [
    'All time',
    ...Array.from(
      new Set(
        trades?.map(trade => {
          const date = new Date(trade.entryDate);
          return date.toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          });
        }) || []
      )
    ).sort((a, b) => {
      // Sort months descending (newest first)
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB.getTime() - dateA.getTime();
    }),
  ];

  // Get unique strategies from trades
  const uniqueStrategies = [
    'All strategies',
    ...Array.from(new Set(trades?.map(trade => trade.strategy?.name).filter(Boolean))),
  ];

  // Filter trades based on selected date, strategy, and custom filters
  const filteredTrades =
    trades?.filter(trade => {
      // Date filter
      if (dateFilter !== 'All time') {
        const tradeDate = new Date(trade.entryDate);
        const filterDate = new Date(dateFilter);

        const dateMatches = (
          tradeDate.getMonth() === filterDate.getMonth() &&
          tradeDate.getFullYear() === filterDate.getFullYear()
        );

        if (!dateMatches) return false;
      }

      // Strategy filter
      if (strategyFilter !== 'All strategies') {
        if (trade.strategy?.name !== strategyFilter) return false;
      }

      // Custom filters
      if (customFilters.length > 0) {
        // Check properEntry filters
        if (customFilters.includes('properEntry:true') && !trade.properEntry) {
          return false;
        }
        if (customFilters.includes('properEntry:false') && trade.properEntry !== false) {
          return false;
        }

        // Check alignedWithTrend filters
        if (customFilters.includes('alignedWithTrend:true') && !trade.alignedWithTrend) {
          return false;
        }
        if (customFilters.includes('alignedWithTrend:false') && trade.alignedWithTrend !== false) {
          return false;
        }

        // Check properConditions filters
        if (customFilters.includes('properConditions:true') && !trade.properConditions) {
          return false;
        }
        if (customFilters.includes('properConditions:false') && trade.properConditions !== false) {
          return false;
        }

        // Check followedTpPlan filters
        if (customFilters.includes('followedTpPlan:true') && !trade.followedTpPlan) {
          return false;
        }
        if (customFilters.includes('followedTpPlan:false') && trade.followedTpPlan !== false) {
          return false;
        }

        // Check properSize filters
        if (customFilters.includes('properSize:true') && !trade.properSize) {
          return false;
        }
        if (customFilters.includes('properSize:false') && trade.properSize !== false) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort by entryDate descending (newest first)
      const dateA = new Date(a.entryDate).getTime();
      const dateB = new Date(b.entryDate).getTime();
      return dateB - dateA;
    }) || [];

  // Calculate win rate using filtered trades
  const winCount = filteredTrades.filter(trade => trade.pnl > 0).length;
  const winRate =
    filteredTrades.length > 0 ? (winCount / filteredTrades.length) * 100 : 0;

  // Calculate total P/L using filtered trades
  const totalPnL = filteredTrades.reduce((sum, trade) => sum + trade.pnl, 0);

  // Calculate average winner and loser
  const winningTrades = filteredTrades.filter(trade => trade.pnl > 0);
  const losingTrades = filteredTrades.filter(trade => trade.pnl < 0);
  
  const avgWinner = winningTrades.length > 0 
    ? winningTrades.reduce((sum, trade) => sum + trade.pnl, 0) / winningTrades.length 
    : 0;
  
  const avgLoser = losingTrades.length > 0
    ? losingTrades.reduce((sum, trade) => sum + trade.pnl, 0) / losingTrades.length
    : 0;

  // Pagination logic
  const totalPages = Math.ceil(filteredTrades.length / tradesPerPage);
  const startIndex = (page - 1) * tradesPerPage;
  const endIndex = startIndex + tradesPerPage;
  const paginatedTrades = filteredTrades.slice(startIndex, endIndex);
  const r = filteredTrades.reduce((sum, trade) => sum + (trade?.R ?? 0), 0);
  console.log('r', r);
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Typography variant="h4" component="h1">
            Trade Journal
          </Typography>
          <Button variant="contained" color="primary" onClick={handleOpen}>
            Add New Trade
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }} wrap="nowrap">
          <Grid item xs={false} sx={{ flex: 1, minWidth: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  Win Rate
                </Typography>
                <Typography
                  variant="h4"
                  component="div"
                  color={winRate >= 50 ? 'success.main' : 'error.main'}
                >
                  {winRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {winCount} wins out of {filteredTrades.length} trades
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={false} sx={{ flex: 1, minWidth: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  Total P/L
                </Typography>
                <Typography
                  variant="h4"
                  component="div"
                  color={totalPnL >= 0 ? 'success.main' : 'error.main'}
                >
                  ${totalPnL.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={false} sx={{ flex: 1, minWidth: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  Average Winner
                </Typography>
                <Typography
                  variant="h4"
                  component="div"
                  color="success.main"
                >
                  ${avgWinner.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={false} sx={{ flex: 1, minWidth: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  Average Loser
                </Typography>
                <Typography
                  variant="h4"
                  component="div"
                  color="error.main"
                >
                  ${avgLoser.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={false} sx={{ flex: 1, minWidth: 0 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  R
                </Typography>
                <Typography
                  variant="h4"
                  component="div"
                  color="primary.main"
                >
                  {r}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <ProfitCalendar trades={filteredTrades} />

        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Date</InputLabel>
            <Select
              value={dateFilter}
              label="Filter by Date"
              onChange={e => setDateFilter(e.target.value)}
            >
              {monthOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Strategy</InputLabel>
            <Select
              value={strategyFilter}
              label="Filter by Strategy"
              onChange={e => setStrategyFilter(e.target.value)}
            >
              {uniqueStrategies.map(strategy => (
                <MenuItem key={strategy} value={strategy}>
                  {strategy}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Custom Filters</InputLabel>
            <Select
              multiple
              value={customFilters}
              label="Custom Filters"
              onChange={e => setCustomFilters(typeof e.target.value === 'string' ? [e.target.value] : e.target.value)}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return 'None';
                }
                return `${selected.length} selected`;
              }}
            >
              <MenuItem value="properEntry:true">
                <Checkbox checked={customFilters.indexOf('properEntry:true') > -1} />
                <ListItemText primary="Proper entry: True" />
              </MenuItem>
              <MenuItem value="properEntry:false">
                <Checkbox checked={customFilters.indexOf('properEntry:false') > -1} />
                <ListItemText primary="Proper entry: False" />
              </MenuItem>
              <MenuItem value="alignedWithTrend:true">
                <Checkbox checked={customFilters.indexOf('alignedWithTrend:true') > -1} />
                <ListItemText primary="Aligned with Trend: True" />
              </MenuItem>
              <MenuItem value="alignedWithTrend:false">
                <Checkbox checked={customFilters.indexOf('alignedWithTrend:false') > -1} />
                <ListItemText primary="Aligned with Trend: False" />
              </MenuItem>
              <MenuItem value="properConditions:true">
                <Checkbox checked={customFilters.indexOf('properConditions:true') > -1} />
                <ListItemText primary="Proper Conditions: True" />
              </MenuItem>
              <MenuItem value="properConditions:false">
                <Checkbox checked={customFilters.indexOf('properConditions:false') > -1} />
                <ListItemText primary="Proper Conditions: False" />
              </MenuItem>
              <MenuItem value="followedTpPlan:true">
                <Checkbox checked={customFilters.indexOf('followedTpPlan:true') > -1} />
                <ListItemText primary="Followed TP Plan: True" />
              </MenuItem>
              <MenuItem value="followedTpPlan:false">
                <Checkbox checked={customFilters.indexOf('followedTpPlan:false') > -1} />
                <ListItemText primary="Followed TP Plan: False" />
              </MenuItem>
              <MenuItem value="properSize:true">
                <Checkbox checked={customFilters.indexOf('properSize:true') > -1} />
                <ListItemText primary="Proper Size: True" />
              </MenuItem>
              <MenuItem value="properSize:false">
                <Checkbox checked={customFilters.indexOf('properSize:false') > -1} />
                <ListItemText primary="Proper Size: False" />
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selected.length > 0 &&
                      selected.length < paginatedTrades.length
                    }
                    checked={
                      paginatedTrades.length > 0 &&
                      paginatedTrades.every(trade => selected.includes(trade.id))
                    }
                    onChange={() => {
                      const allPageSelected = paginatedTrades.every(trade => selected.includes(trade.id));
                      if (allPageSelected) {
                        setSelected(selected.filter(id => !paginatedTrades.some(trade => trade.id === id)));
                      } else {
                        const newSelected = [...selected];
                        paginatedTrades.forEach(trade => {
                          if (!newSelected.includes(trade.id)) {
                            newSelected.push(trade.id);
                          }
                        });
                        setSelected(newSelected);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>Ticker</TableCell>
                <TableCell>Entry Price</TableCell>
                <TableCell>Exit Price</TableCell>
                <TableCell>Entry Date</TableCell>
                <TableCell>Entry Time</TableCell>
                <TableCell>Exit Date</TableCell>
                <TableCell>Exit Time</TableCell>
                <TableCell>Outcome</TableCell>
                <TableCell>Strategy</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTrades?.map(trade => {
                const outcome = trade.pnl > 0 ? 'win' : 'loss';
                return (
                  <TableRow
                    key={trade.id}
                    selected={selected.indexOf(trade.id) !== -1}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      backgroundColor:
                        outcome === 'win'
                          ? 'rgba(76, 175, 80, 0.1)'
                          : 'rgba(244, 67, 54, 0.1)',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor:
                          outcome === 'win'
                            ? 'rgba(76, 175, 80, 0.2)'
                            : 'rgba(244, 67, 54, 0.2)',
                      },
                    }}
                    onClick={() => handleTradeClick(trade)}
                  >
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.indexOf(trade.id) !== -1}
                        onChange={() => handleCheckboxClick(trade.id)}
                      />
                    </TableCell>
                    <TableCell>{trade.symbol}</TableCell>
                    <TableCell>${trade.entryPrice?.toFixed(2)}</TableCell>
                    <TableCell>${trade.exitPrice?.toFixed(2)}</TableCell>
                    <TableCell>
                      {new Date(trade.entryDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{trade.entryTime || '-'}</TableCell>
                    <TableCell>
                      {new Date(trade.exitDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{trade.exitTime || '-'}</TableCell>
                    <TableCell
                      sx={{
                        color:
                          outcome === 'win' ? 'success.main' : 'error.main',
                      }}
                    >
                      {outcome === 'win' ? 'Win' : 'Loss'}
                    </TableCell>
                    <TableCell>{trade?.strategy?.name}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>

        <AddNewTrade open={open} onClose={handleClose} token={token} />

        <TradeDetailsDialog
          open={detailsOpen}
          onClose={handleDetailsClose}
          trade={selectedTrade}
          token={token}
        />
      </Container>
    </ProtectedRoute>
  );
}
