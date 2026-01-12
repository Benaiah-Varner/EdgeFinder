'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import ProfitCalendar from '@/components/ProfitCalendar';

export interface Trade {
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  entryDate: Date;
  exitDate: Date;
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
  properEntry?: boolean;
  greenToRed?: boolean;
  soldTooEarly?: boolean;
}

const STRATEGIES = [
  'Breakout',
  'Bullish Divergence',
  'Reject',
  'Bounce',
  'Bull flag',
  'Break N Retest',
  "'Fake' Bullish Divergence",
  'Breakdown',
  'Reclaim',
  'Falling Wedge'
];

export default function JournalPage() {
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string>('All time');
  const [strategyFilter, setStrategyFilter] = useState<string>('All strategies');
  const [customFilters, setCustomFilters] = useState<string[]>([]);
  const { user, token } = useAuth();
  console.log('user ', user);
  const [trades, setTrades] = useState<Trade[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    ticker: '',
    entryPrice: '',
    exitPrice: '',
    entryDate: null as Date | null,
    exitDate: null as Date | null,
    strategy: '',
    description: '',
    image: null as File | null,
    properEntry: false,
    greenToRed: false,
    soldTooEarly: false,
  });

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

  const handleSubmit = async () => {
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('symbol', formData.ticker);
      formDataToSend.append('entryPrice', formData.entryPrice);
      formDataToSend.append('exitPrice', formData.exitPrice);
      formDataToSend.append('quantity', '1'); // Default quantity
      formDataToSend.append(
        'entryDate',
        formData.entryDate?.toISOString() || new Date().toISOString()
      );
      formDataToSend.append(
        'exitDate',
        formData.exitDate?.toISOString() || new Date().toISOString()
      );
      formDataToSend.append('tradeType', 'LONG'); // Default trade type
      formDataToSend.append('description', formData.description);
      formDataToSend.append('strategy', formData.strategy);
      formDataToSend.append('properEntry', formData.properEntry.toString());
      formDataToSend.append('greenToRed', formData.greenToRed.toString());
      formDataToSend.append('soldTooEarly', formData.soldTooEarly.toString());

      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await fetch('http://localhost:3001/trades', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let the browser set it with the boundary for multipart/form-data
        },
        body: formDataToSend,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create trade');
      }

      await response.json();
      // Reset form
      setFormData({
        ticker: '',
        entryPrice: '',
        exitPrice: '',
        entryDate: null,
        exitDate: null,
        strategy: '',
        description: '',
        image: null,
        properEntry: false,
        greenToRed: false,
        soldTooEarly: false,
      });
      setOpen(false);

      // Refresh trades by refetching user data
      // You might want to implement a proper refresh mechanism here
      window.location.reload(); // Temporary solution
    } catch (error) {
      console.error('Error creating trade:', error);
      alert(
        'Failed to create trade: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setDetailsOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setSelectedTrade(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        image: e.target.files[0],
      });
    }
  };

  const handleDateChange = (
    date: Date | null,
    field: 'entryDate' | 'exitDate'
  ) => {
    setFormData({
      ...formData,
      [field]: date,
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
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

  // Generate month options for the current year
  const currentYear = new Date().getFullYear();
  const monthOptions = [
    'All time',
    ...Array.from({ length: 12 }, (_, i) => {
      const month = new Date(currentYear, i).toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });
      return month;
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

        // Check greenToRed filters
        if (customFilters.includes('greenToRed:true') && !trade.greenToRed) {
          return false;
        }
        if (customFilters.includes('greenToRed:false') && trade.greenToRed !== false) {
          return false;
        }

        // Check soldTooEarly filters
        if (customFilters.includes('soldTooEarly:true') && !trade.soldTooEarly) {
          return false;
        }
        if (customFilters.includes('soldTooEarly:false') && trade.soldTooEarly !== false) {
          return false;
        }
      }

      return true;
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

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={3}>
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
                <Typography variant="body2" color="text.secondary">
                  Total profit/loss across all trades
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
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
                <Typography variant="body2" color="text.secondary">
                  Average profit per winning trade
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
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
                <Typography variant="body2" color="text.secondary">
                  Average loss per losing trade
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
              <MenuItem value="greenToRed:true">
                <Checkbox checked={customFilters.indexOf('greenToRed:true') > -1} />
                <ListItemText primary="Green to red?: True" />
              </MenuItem>
              <MenuItem value="greenToRed:false">
                <Checkbox checked={customFilters.indexOf('greenToRed:false') > -1} />
                <ListItemText primary="Green to red?: False" />
              </MenuItem>
              <MenuItem value="soldTooEarly:true">
                <Checkbox checked={customFilters.indexOf('soldTooEarly:true') > -1} />
                <ListItemText primary="Sold too early?: True" />
              </MenuItem>
              <MenuItem value="soldTooEarly:false">
                <Checkbox checked={customFilters.indexOf('soldTooEarly:false') > -1} />
                <ListItemText primary="Sold too early?: False" />
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
                      selected.length < filteredTrades.length
                    }
                    checked={
                      filteredTrades.length > 0 &&
                      selected.length === filteredTrades.length
                    }
                    onChange={() => {
                      if (selected.length === filteredTrades.length) {
                        setSelected([]);
                      } else {
                        setSelected(filteredTrades.map(trade => trade.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>Ticker</TableCell>
                <TableCell>Entry Price</TableCell>
                <TableCell>Exit Price</TableCell>
                <TableCell>Entry Date</TableCell>
                <TableCell>Exit Date</TableCell>
                <TableCell>Outcome</TableCell>
                <TableCell>Strategy</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTrades?.map(trade => {
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
                    <TableCell padding="checkbox">
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
                    <TableCell>
                      {new Date(trade.exitDate).toLocaleDateString()}
                    </TableCell>
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

        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>Add New Trade</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="ticker"
                  label="Ticker"
                  fullWidth
                  value={formData.ticker}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    name="entryPrice"
                    label="Entry Price"
                    type="number"
                    fullWidth
                    value={formData.entryPrice}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                    }}
                  />
                  <TextField
                    name="exitPrice"
                    label="Exit Price"
                    type="number"
                    fullWidth
                    value={formData.exitPrice}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Entry Date"
                    value={formData.entryDate}
                    onChange={date => handleDateChange(date, 'entryDate')}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Exit Date"
                    value={formData.exitDate}
                    onChange={date => handleDateChange(date, 'exitDate')}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Strategy</InputLabel>
                  <Select
                    name="strategy"
                    value={formData.strategy}
                    label="Strategy"
                    onChange={handleSelectChange}
                  >
                    {STRATEGIES.map(strategy => (
                      <MenuItem key={strategy} value={strategy}>
                        {strategy}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ p: 2, border: '1px dashed', textTransform: 'none' }}
                >
                  {formData.image
                    ? formData.image.name
                    : 'Upload Trade Screenshot'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Trade Description"
                  multiline
                  rows={4}
                  fullWidth
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your trade setup, entry/exit reasoning, and lessons learned..."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="properEntry"
                      checked={formData.properEntry}
                      onChange={handleCheckboxChange}
                    />
                  }
                  label="Proper Entry?"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="greenToRed"
                      checked={formData.greenToRed}
                      onChange={handleCheckboxChange}
                    />
                  }
                  label="Green to red trade?"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="soldTooEarly"
                      checked={formData.soldTooEarly}
                      onChange={handleCheckboxChange}
                    />
                  }
                  label="Sold too early?"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={
                !formData.ticker ||
                !formData.entryPrice ||
                !formData.exitPrice ||
                !formData.strategy
              }
            >
              Add Trade
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={detailsOpen}
          onClose={handleDetailsClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Trade Details</DialogTitle>
          <DialogContent>
            {selectedTrade && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Trade Information
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      <strong>Ticker:</strong> {selectedTrade.symbol}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Strategy:</strong> {selectedTrade?.strategy?.name}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Entry Price:</strong> $
                      {selectedTrade.entryPrice.toFixed(2)}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Exit Price:</strong> $
                      {selectedTrade.exitPrice.toFixed(2)}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Entry Date:</strong>{' '}
                      {new Date(selectedTrade.entryDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Exit Date:</strong>{' '}
                      {new Date(selectedTrade.exitDate).toLocaleDateString()}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color:
                          selectedTrade.outcome === 'win'
                            ? 'success.main'
                            : 'error.main',
                      }}
                    >
                      <strong>Outcome:</strong>{' '}
                      {selectedTrade.outcome === 'win' ? 'Win' : 'Loss'}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color:
                          selectedTrade.outcome === 'win'
                            ? 'success.main'
                            : 'error.main',
                      }}
                    >
                      <strong>P&L:</strong> $
                      {(
                        selectedTrade.exitPrice - selectedTrade.entryPrice
                      ).toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  {selectedTrade.imageUrl && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Trade Screenshot
                      </Typography>
                      <Box
                        component="img"
                        src={`http://localhost:3001${selectedTrade.imageUrl}`}
                        alt="Trade screenshot"
                        sx={{
                          width: '100%',
                          height: 'auto',
                          maxHeight: 500,
                          objectFit: 'contain',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {selectedTrade.description || 'No description provided.'}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDetailsClose}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ProtectedRoute>
  );
}
