from typing import Optional, List, Dict, Any
import yfinance as yf
import pandas as pd
import numpy as np


class StockScreener:
    """
    A stock screener class that filters stocks based on various financial metrics
    and technical indicators.
    """
    
    def __init__(self, symbols: Optional[List[str]] = None):
        """
        Initialize the screener with a list of symbols to screen.
        
        Args:
            symbols: List of stock symbols to screen. If None, will use S&P 500.
        """
        self.symbols = symbols or self._get_sp500_symbols()
    
    def _get_sp500_symbols(self) -> List[str]:
        """
        Get S&P 500 symbols. This is a placeholder implementation.
        In a real implementation, you might fetch from a data source.
        """
        # Placeholder - in practice, you'd fetch from a reliable source
        return ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "JPM", "JNJ", "V"]
    
    def screen(self, 
               pe_ratio_max: Optional[float] = None,
               pe_ratio_min: Optional[float] = None,
               debt_to_equity_max: Optional[float] = None,
               debt_to_equity_min: Optional[float] = None,
               rsi_threshold_upper: Optional[float] = None,
               rsi_threshold_lower: Optional[float] = None,
               sma_200_above: Optional[bool] = None,
               sma_200_below: Optional[bool] = None) -> List[str]:
        """
        Screen stocks based on the provided criteria.
        
        Args:
            pe_ratio_max: Maximum P/E ratio
            pe_ratio_min: Minimum P/E ratio
            debt_to_equity_max: Maximum debt-to-equity ratio
            debt_to_equity_min: Minimum debt-to-equity ratio
            rsi_threshold_upper: Upper RSI threshold (stocks below this)
            rsi_threshold_lower: Lower RSI threshold (stocks above this)
            sma_200_above: Filter for stocks above 200-day SMA
            sma_200_below: Filter for stocks below 200-day SMA
            
        Returns:
            List of symbols that match the criteria
        """
        matching_symbols = []
        
        for symbol in self.symbols:
            try:
                if self._meets_criteria(symbol, 
                                      pe_ratio_max, pe_ratio_min,
                                      debt_to_equity_max, debt_to_equity_min,
                                      rsi_threshold_upper, rsi_threshold_lower,
                                      sma_200_above, sma_200_below):
                    matching_symbols.append(symbol)
            except Exception as e:
                # Log error and continue with next symbol
                print(f"Error screening {symbol}: {e}")
                continue
        
        return matching_symbols
    
    def _meets_criteria(self, symbol: str, 
                       pe_ratio_max: Optional[float],
                       pe_ratio_min: Optional[float],
                       debt_to_equity_max: Optional[float],
                       debt_to_equity_min: Optional[float],
                       rsi_threshold_upper: Optional[float],
                       rsi_threshold_lower: Optional[float],
                       sma_200_above: Optional[bool],
                       sma_200_below: Optional[bool]) -> bool:
        """
        Check if a symbol meets all the specified criteria.
        """
        ticker = yf.Ticker(symbol)
        
        # Get fundamental data
        info = ticker.info
        
        # Check P/E ratio
        pe_ratio = info.get('trailingPE')
        if pe_ratio is not None:
            if pe_ratio_max is not None and pe_ratio > pe_ratio_max:
                return False
            if pe_ratio_min is not None and pe_ratio < pe_ratio_min:
                return False
        
        # Check debt-to-equity ratio
        debt_to_equity = info.get('debtToEquity')
        if debt_to_equity is not None:
            if debt_to_equity_max is not None and debt_to_equity > debt_to_equity_max:
                return False
            if debt_to_equity_min is not None and debt_to_equity < debt_to_equity_min:
                return False
        
        # Get historical data for technical indicators
        hist = ticker.history(period="1y")
        if hist.empty:
            return False
        
        # Check RSI
        if rsi_threshold_upper is not None or rsi_threshold_lower is not None:
            rsi = self._calculate_rsi(hist['Close'])
            current_rsi = rsi.iloc[-1] if not rsi.empty else None
            
            if current_rsi is not None:
                if rsi_threshold_upper is not None and current_rsi > rsi_threshold_upper:
                    return False
                if rsi_threshold_lower is not None and current_rsi < rsi_threshold_lower:
                    return False
        
        # Check 200-day SMA
        if sma_200_above is not None or sma_200_below is not None:
            if len(hist) >= 200:
                sma_200 = hist['Close'].rolling(window=200).mean().iloc[-1]
                current_price = hist['Close'].iloc[-1]
                
                if sma_200_above and current_price <= sma_200:
                    return False
                if sma_200_below and current_price >= sma_200:
                    return False
        
        return True
    
    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """
        Calculate the Relative Strength Index (RSI).
        
        Args:
            prices: Series of closing prices
            period: RSI calculation period (default 14)
            
        Returns:
            Series of RSI values
        """
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    def get_stock_data(self, symbol: str) -> Dict[str, Any]:
        """
        Get comprehensive data for a single stock.
        
        Args:
            symbol: Stock symbol
            
        Returns:
            Dictionary containing stock data
        """
        ticker = yf.Ticker(symbol)
        info = ticker.info
        hist = ticker.history(period="1y")
        
        data = {
            'symbol': symbol,
            'company_name': info.get('longName', 'N/A'),
            'pe_ratio': info.get('trailingPE'),
            'debt_to_equity': info.get('debtToEquity'),
            'market_cap': info.get('marketCap'),
            'current_price': hist['Close'].iloc[-1] if not hist.empty else None,
        }
        
        if not hist.empty and len(hist) >= 200:
            data['sma_200'] = hist['Close'].rolling(window=200).mean().iloc[-1]
            data['rsi'] = self._calculate_rsi(hist['Close']).iloc[-1]
        
        return data
