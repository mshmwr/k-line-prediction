# backend/models.py
from pydantic import BaseModel
from typing import List, Optional

class OHLCBar(BaseModel):
    open: float
    high: float
    low: float
    close: float
    time: str = ""

class PredictRequest(BaseModel):
    ohlc_data: List[OHLCBar]
    selected_ids: List[str]
    timeframe: str = "1H"
    ma99_trend_override: Optional[str] = None

class MatchCase(BaseModel):
    id: str
    correlation: float
    historical_ohlc: List[OHLCBar]
    future_ohlc: List[OHLCBar]
    start_date: str
    end_date: str

class OrderSuggestion(BaseModel):
    label: str
    price: float
    pct: float
    occurrence_bar: int
    occurrence_window: str
    historical_time: str

class PredictStats(BaseModel):
    highest: OrderSuggestion
    second_highest: OrderSuggestion
    second_lowest: OrderSuggestion
    lowest: OrderSuggestion
    win_rate: float
    mean_correlation: float

class PredictResponse(BaseModel):
    matches: List[MatchCase]
    stats: PredictStats
