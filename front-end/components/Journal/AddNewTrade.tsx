'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

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

interface AddNewTradeProps {
  open: boolean;
  onClose: () => void;
  token: string | null;
}

const AddNewTrade: React.FC<AddNewTradeProps> = ({ open, onClose, token }) => {
  // Form state
  const [formData, setFormData] = useState({
    ticker: '',
    entryPrice: '',
    exitPrice: '',
    entryDate: null as Date | null,
    entryTime: '',
    exitDate: null as Date | null,
    exitTime: '',
    strategy: '',
    description: '',
    image: null as File | null,
    properEntry: false,
    greenToRed: false,
    soldTooEarly: false,
  });

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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

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
        entryTime: '',
        exitDate: null,
        exitTime: '',
        strategy: '',
        description: '',
        image: null,
        properEntry: false,
        greenToRed: false,
        soldTooEarly: false,
      });
      onClose();

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
        <Button onClick={onClose}>Cancel</Button>
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
  );
};

export default AddNewTrade;
