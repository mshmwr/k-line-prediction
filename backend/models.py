# backend/models.py
from pydantic import BaseModel
from typing import List

class OHLCBar(BaseModel):
    open: float
    high: float
    low: float
    close: float

class PredictRequest(BaseModel):
    ohlc_data: List[OHLCBar]
    selected_ids: List[str]

class MatchCase(BaseModel):
    id: str
    correlation: float
    historical_ohlc: List[OHLCBar]
    future_ohlc: List[OHLCBar]
    start_date: str

class PredictStats(BaseModel):
    optimistic: float
    baseline: float
    pessimistic: float
    win_rate: float
    mean_correlation: float

class PredictResponse(BaseModel):
    matches: List[MatchCase]
    stats: PredictStats
