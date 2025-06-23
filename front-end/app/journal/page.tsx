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
  Grid,
  InputLabel,
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
import { authenticatedFormDataFetch } from '@/utils/api';

export interface Trade {
  id: string;
  ticker: string;
  entryPrice: number;
  exitPrice: number;
  entryDate: Date;
  exitDate: Date;
  outcome: 'win' | 'loss';
  strategy: string;
  description: string;
  image?: string;
}

const STRATEGIES = [
  'Breakout',
  'Pullback',
  'Reversal',
  'Momentum',
  'Gap Trading',
  'Support/Resistance',
  'Swing Trading',
  'Day Trading',
  'Other',
];

export default function JournalPage() {
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const { user } = useAuth();
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

      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await authenticatedFormDataFetch(
        'http://localhost:3001/trades',
        formDataToSend,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create trade');
      }

      const data = await response.json();
      console.log('Trade created:', data);

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

  // Calculate win rate
  const winCount = trades.filter(trade => trade.outcome === 'win').length;
  const winRate = trades.length > 0 ? (winCount / trades.length) * 100 : 0;

  // Calculate risk/reward ratio
  const riskRewardRatio =
    trades.length > 0
      ? trades.reduce((sum, trade) => {
          const isWin = trade.outcome === 'win';
          const pnl = trade.exitPrice - trade.entryPrice;
          return isWin ? sum + Math.abs(pnl) : sum - Math.abs(pnl);
        }, 0) / trades.length
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
          <Grid item xs={12} md={6}>
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
                  {winCount} wins out of {trades.length} trades
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  Risk/Reward Ratio
                </Typography>
                <Typography
                  variant="h4"
                  component="div"
                  color={riskRewardRatio >= 0 ? 'success.main' : 'error.main'}
                >
                  {Math.abs(riskRewardRatio).toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average R/R across all trades
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selected.length > 0 && selected.length < trades.length
                    }
                    checked={
                      trades.length > 0 && selected.length === trades.length
                    }
                    onChange={() => {
                      if (selected.length === trades.length) {
                        setSelected([]);
                      } else {
                        setSelected(trades.map(trade => trade.id));
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
              {trades.map(trade => (
                <TableRow
                  key={trade.id}
                  selected={selected.indexOf(trade.id) !== -1}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    backgroundColor:
                      trade.outcome === 'win'
                        ? 'rgba(76, 175, 80, 0.1)'
                        : 'rgba(244, 67, 54, 0.1)',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor:
                        trade.outcome === 'win'
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
                  <TableCell>{trade.ticker}</TableCell>
                  <TableCell>${trade.entryPrice?.toFixed(2)}</TableCell>
                  <TableCell>${trade.exitPrice?.toFixed(2)}</TableCell>
                  <TableCell>{trade.entryDate?.toLocaleDateString()}</TableCell>
                  <TableCell>{trade.exitDate?.toLocaleDateString()}</TableCell>
                  <TableCell
                    sx={{
                      color:
                        trade.outcome === 'win' ? 'success.main' : 'error.main',
                    }}
                  >
                    {trade.outcome === 'win' ? 'Win' : 'Loss'}
                  </TableCell>
                  <TableCell>{trade.strategy}</TableCell>
                </TableRow>
              ))}
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
                      <strong>Ticker:</strong> {selectedTrade.ticker}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Strategy:</strong> {selectedTrade.strategy}
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
                      {selectedTrade.entryDate.toLocaleDateString()}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Exit Date:</strong>{' '}
                      {selectedTrade.exitDate.toLocaleDateString()}
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
                  {selectedTrade.image && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Trade Screenshot
                      </Typography>
                      <Box
                        component="img"
                        src={selectedTrade.image}
                        alt="Trade screenshot"
                        sx={{
                          width: '100%',
                          height: 'auto',
                          maxHeight: 300,
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
