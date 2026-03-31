# backend/tests/test_predictor.py
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mock_data import generate_mock_history

def test_mock_history_returns_500_bars():
    history = generate_mock_history(seed=42)
    assert len(history) == 500

def test_mock_bar_has_valid_ohlc():
    history = generate_mock_history(seed=42)
    bar = history[0]
    assert bar['low'] <= bar['open'] <= bar['high']
    assert bar['low'] <= bar['close'] <= bar['high']
    assert bar['high'] >= bar['low']
