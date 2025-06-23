import {
  Paper,
  Table,
  TableContainer,
  TableCell,
  TableBody,
  TableHead,
  TableRow,
  Checkbox,
} from '@mui/material';

const TradeTable = ({trades, selected, setSelected, handleTradeClick, handleCheckboxClick}: {trades: Trade[], selected: string[], setSelected: (selected: string[]) => void, handleTradeClick: (trade: Trade) => void, handleCheckboxClick: (id: string) => void}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={
                selected.length > 0 && selected.length < trades.length
              }
              checked={trades.length > 0 && selected.length === trades.length}
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
            <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
            <TableCell>${trade.exitPrice.toFixed(2)}</TableCell>
            <TableCell>{trade.entryDate.toLocaleDateString()}</TableCell>
            <TableCell>{trade.exitDate.toLocaleDateString()}</TableCell>
            <TableCell
              sx={{
                color: trade.outcome === 'win' ? 'success.main' : 'error.main',
              }}
            >
              {trade.outcome === 'win' ? 'Win' : 'Loss'}
            </TableCell>
            <TableCell>{trade.strategy}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>)
  ;
};

export default TradeTable;
