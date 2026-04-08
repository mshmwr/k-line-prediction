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

class Ma99Gap(BaseModel):
    """MA99 無法計算的日期缺口（歷史前置資料不足 99 根）"""
    from_date: str
    to_date: str

class MatchCase(BaseModel):
    id: str
    correlation: float
    historical_ohlc: List[OHLCBar]
    future_ohlc: List[OHLCBar]
    start_date: str
    end_date: str
    historical_ma99: List[Optional[float]] = []
    future_ma99: List[Optional[float]] = []

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
    query_ma99: List[Optional[float]] = []
    query_ma99_gap: Optional[Ma99Gap] = None

class Ma99Request(BaseModel):
    ohlc_data: List[OHLCBar]
    timeframe: str = "1H"

class Ma99Response(BaseModel):
    query_ma99: List[Optional[float]] = []
    query_ma99_gap: Optional[Ma99Gap] = None
