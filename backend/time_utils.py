# backend/time_utils.py
from datetime import datetime, timezone


def normalize_bar_time(raw: str) -> str:
    """
    接受任意時間格式，統一輸出 UTC 'YYYY-MM-DD HH:MM'（16 字元）。
    支援：
      - Unix timestamp（秒 / 毫秒 / 微秒 / 奈秒）
      - 'YYYY-MM-DD HH:MM:SS'
      - 'YYYY-MM-DD HH:MM'
    """
    value = (raw or '').strip()
    if not value:
        raise ValueError(f"Empty timestamp string: {raw!r}")

    # 嘗試解析為數字（Unix timestamp）
    try:
        numeric = int(value)
        abs_numeric = abs(numeric)
        if abs_numeric >= 10**18:
            seconds = numeric / 1_000_000_000
        elif abs_numeric >= 10**15:
            seconds = numeric / 1_000_000
        elif abs_numeric >= 10**12:
            seconds = numeric / 1_000
        else:
            seconds = numeric
        dt = datetime.fromtimestamp(seconds, tz=timezone.utc)
        return dt.strftime('%Y-%m-%d %H:%M')
    except (ValueError, OSError):
        pass

    # 嘗試解析各種日期/時間字串格式（均假設已是 UTC）
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d'):
        try:
            dt = datetime.strptime(value, fmt)
            return dt.strftime('%Y-%m-%d %H:%M')
        except ValueError:
            continue

    raise ValueError(f"Unrecognized timestamp format: {raw!r}")
