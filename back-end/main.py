from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="Edge Finder API", description="Trading platform API for screening and backtesting")

class ScreenerRequest(BaseModel):
    pe_ratio_max: Optional[float] = None
    pe_ratio_min: Optional[float] = None
    debt_to_equity_max: Optional[float] = None
    debt_to_equity_min: Optional[float] = None
    rsi_threshold_upper: Optional[float] = None
    rsi_threshold_lower: Optional[float] = None
    sma_200_above: Optional[bool] = None
    sma_200_below: Optional[bool] = None

class ScreenerResponse(BaseModel):
    symbols: List[str]
    total_matches: int

class BacktesterRequest(BaseModel):
    pass

class BacktesterResponse(BaseModel):
    message: str

@app.get("/")
async def root():
    return {"message": "Edge Finder API"}

@app.post("/screener", response_model=ScreenerResponse)
async def screen_stocks(request: ScreenerRequest):
    try:
        # TODO: Implement screener logic using screen/screener.py
        return ScreenerResponse(
            symbols=["AAPL", "MSFT", "GOOGL"],
            total_matches=3
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/backtester", response_model=BacktesterResponse)
async def backtest_strategy(request: BacktesterRequest):
    try:
        # TODO: Implement backtesting logic
        return BacktesterResponse(
            message="Backtester endpoint placeholder - implementation pending"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)