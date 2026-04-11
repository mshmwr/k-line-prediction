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

class Ma99Gap(BaseModel):
    """MA99 無法計算的日期缺口（歷史前置資料不足 99 根）"""
    from_date: str
    to_date: str

class MatchCase(BaseModel):
    id: str
    correlation: float
    historical_ohlc: List[OHLCBar]
    future_ohlc: List[OHLCBar]
    historical_ohlc_1d: List[OHLCBar] = []
    future_ohlc_1d: List[OHLCBar] = []
    start_date: str
    end_date: str
    historical_ma99: List[Optional[float]] = []
    future_ma99: List[Optional[float]] = []
    historical_ma99_1d: List[Optional[float]] = []
    future_ma99_1d: List[Optional[float]] = []

class OrderSuggestion(BaseModel):
    label: str
    price: float
    pct: float
    occurrence_bar: int
    occurrence_window: str
    historical_time: str

class ForecastBar(BaseModel):
    time: str
    open: float
    high: float
    low: float
    close: float

class PredictStats(BaseModel):
    highest: OrderSuggestion
    second_highest: OrderSuggestion
    second_lowest: OrderSuggestion
    lowest: OrderSuggestion
    win_rate: float
    mean_correlation: float
    consensus_forecast_1h: List[ForecastBar] = []
    consensus_forecast_1d: List[ForecastBar] = []

class PredictResponse(BaseModel):
    matches: List[MatchCase]
    stats: PredictStats
    query_ma99_1h: List[Optional[float]] = []
    query_ma99_1d: List[Optional[float]] = []
    query_ma99_gap_1h: Optional[Ma99Gap] = None
    query_ma99_gap_1d: Optional[Ma99Gap] = None

class Ma99Request(BaseModel):
    ohlc_data: List[OHLCBar]
    timeframe: str = "1H"

class Ma99Response(BaseModel):
    query_ma99_1h: List[Optional[float]] = []
    query_ma99_1d: List[Optional[float]] = []
    query_ma99_gap_1h: Optional[Ma99Gap] = None
    query_ma99_gap_1d: Optional[Ma99Gap] = None
