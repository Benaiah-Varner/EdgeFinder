'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { SelectChangeEvent } from '@mui/material/Select';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Trade } from '@/app/journal/page';

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
  'Falling Wedge',
];

interface TradeDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  trade: Trade | null;
  token: string | null;
}

export default function TradeDetailsDialog({
  open,
  onClose,
  trade,
  token,
}: TradeDetailsDialogProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    entryPrice: '',
    exitPrice: '',
    entryDate: null as Date | null,
    entryTime: '',
    exitDate: null as Date | null,
    exitTime: '',
    strategy: '',
    description: '',
    image: null as File | null,
    R: '',
    properEntry: '',
    alignedWithTrend: '',
    properConditions: '',
    followedTpPlan: '',
    properSize: '',
  });

  // Initialize form data when trade changes
  useEffect(() => {
    if (trade) {
      setFormData({
        symbol: trade.symbol || '',
        entryPrice: trade.entryPrice?.toString() || '',
        exitPrice: trade.exitPrice?.toString() || '',
        entryDate: trade.entryDate ? new Date(trade.entryDate) : null,
        entryTime: trade.entryTime || '',
        exitDate: trade.exitDate ? new Date(trade.exitDate) : null,
        exitTime: trade.exitTime || '',
        strategy: trade.strategy?.name || '',
        description: trade.description || '',
        image: null,
        R: trade.R?.toString() || '',
        properEntry: trade.properEntry === true ? 'yes' : trade.properEntry === false ? 'no' : '',
        alignedWithTrend: trade.alignedWithTrend === true ? 'yes' : trade.alignedWithTrend === false ? 'no' : '',
        properConditions: trade.properConditions === true ? 'yes' : trade.properConditions === false ? 'no' : '',
        followedTpPlan: trade.followedTpPlan === true ? 'yes' : trade.followedTpPlan === false ? 'no' : '',
        properSize: trade.properSize === true ? 'yes' : trade.properSize === false ? 'no' : '',
      });
    }
  }, [trade]);

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

  const handleSave = async () => {
    if (!trade) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('symbol', formData.symbol);
      formDataToSend.append('entryPrice', formData.entryPrice);
      formDataToSend.append('exitPrice', formData.exitPrice);
      formDataToSend.append('quantity', '1');
      formDataToSend.append(
        'entryDate',
        formData.entryDate?.toISOString() || new Date().toISOString()
      );
      if (formData.entryTime) {
        formDataToSend.append('entryTime', formData.entryTime);
      }
      formDataToSend.append(
        'exitDate',
        formData.exitDate?.toISOString() || new Date().toISOString()
      );
      if (formData.exitTime) {
        formDataToSend.append('exitTime', formData.exitTime);
      }
      formDataToSend.append('tradeType', 'LONG');
      formDataToSend.append('description', formData.description);
      formDataToSend.append('strategy', formData.strategy);

      // Add new fields
      if (formData.R) {
        formDataToSend.append('R', formData.R);
      }
      if (formData.properEntry) {
        formDataToSend.append('properEntry', (formData.properEntry === 'yes').toString());
      }
      if (formData.alignedWithTrend) {
        formDataToSend.append('alignedWithTrend', (formData.alignedWithTrend === 'yes').toString());
      }
      if (formData.properConditions) {
        formDataToSend.append('properConditions', (formData.properConditions === 'yes').toString());
      }
      if (formData.followedTpPlan) {
        formDataToSend.append('followedTpPlan', (formData.followedTpPlan === 'yes').toString());
      }
      if (formData.properSize) {
        formDataToSend.append('properSize', (formData.properSize === 'yes').toString());
      }

      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await fetch(`http://localhost:3001/trades/${trade.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update trade');
      }

      await response.json();
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error updating trade:', error);
      alert(
        'Failed to update trade: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  if (!trade) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Trade</DialogTitle>
        <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              name="symbol"
              label="Ticker"
              fullWidth
              value={formData.symbol}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Strategy</InputLabel>
              <Select
                name="strategy"
                value={formData.strategy}
                label="Strategy"
                onChange={handleSelectChange}
              >
                {STRATEGIES.map((strategy) => (
                  <MenuItem key={strategy} value={strategy}>
                    {strategy}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
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
          </Grid>
          <Grid item xs={12} md={6}>
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
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Entry Date"
                value={formData.entryDate}
                onChange={(date) => handleDateChange(date, 'entryDate')}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              name="entryTime"
              label="Entry Time"
              placeholder="e.g., 09:30"
              fullWidth
              value={formData.entryTime}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Exit Date"
                value={formData.exitDate}
                onChange={(date) => handleDateChange(date, 'exitDate')}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              name="exitTime"
              label="Exit Time"
              placeholder="e.g., 15:45"
              fullWidth
              value={formData.exitTime}
              onChange={handleInputChange}
            />
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
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {trade.imageUrl && (
                <Box
                  component="img"
                  src={`http://localhost:3001${trade.imageUrl}`}
                  alt="Current screenshot"
                  onClick={() => setImageModalOpen(true)}
                  sx={{
                    width: 100,
                    height: 100,
                    objectFit: 'cover',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                />
              )}
              <Button
                variant="outlined"
                component="label"
                sx={{ flex: 1, p: 2, border: '1px dashed', textTransform: 'none' }}
              >
                {formData.image
                  ? formData.image.name
                  : trade.imageUrl
                  ? 'Replace Trade Screenshot'
                  : 'Upload Trade Screenshot'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              name="R"
              label="R (Risk/Reward)"
              type="number"
              fullWidth
              value={formData.R}
              onChange={handleInputChange}
              placeholder="e.g., 2"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Proper Entry?</InputLabel>
              <Select
                name="properEntry"
                value={formData.properEntry}
                label="Proper Entry?"
                onChange={handleSelectChange}
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Aligned with Trend?</InputLabel>
              <Select
                name="alignedWithTrend"
                value={formData.alignedWithTrend}
                label="Aligned with Trend?"
                onChange={handleSelectChange}
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Proper Conditions?</InputLabel>
              <Select
                name="properConditions"
                value={formData.properConditions}
                label="Proper Conditions?"
                onChange={handleSelectChange}
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Followed TP Plan?</InputLabel>
              <Select
                name="followedTpPlan"
                value={formData.followedTpPlan}
                label="Followed TP Plan?"
                onChange={handleSelectChange}
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Proper Size?</InputLabel>
              <Select
                name="properSize"
                value={formData.properSize}
                label="Proper Size?"
                onChange={handleSelectChange}
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={
              !formData.symbol ||
              !formData.entryPrice ||
              !formData.exitPrice ||
              !formData.strategy
            }
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Lightbox Modal */}
      <Dialog
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Trade Screenshot
          <IconButton onClick={() => setImageModalOpen(false)} edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {trade.imageUrl && (
            <Box
              component="img"
              src={`http://localhost:3001${trade.imageUrl}`}
              alt="Trade screenshot full size"
              sx={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
