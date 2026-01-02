from __future__ import annotations

import threading
import time
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Optional


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class MetricsTracker:
    """Lightweight metrics tracker for processing pipelines.

    Tracks total records, start/stop times, elapsed time, and average time per
    record. Also supports recording measured durations for specific records or
    blocks via a context manager.
    """

    started_at_iso: Optional[str] = None
    finished_at_iso: Optional[str] = None
    total_records: int = 0

    _start_monotonic: Optional[float] = field(default=None, init=False, repr=False)
    _end_monotonic: Optional[float] = field(default=None, init=False, repr=False)
    _accumulated_record_time: float = field(default=0.0, init=False, repr=False)
    # Use a reentrant lock because snapshot/log methods call other
    # lock-protected methods (nested acquisition would deadlock with Lock).
    _lock: threading.RLock = field(default_factory=threading.RLock, init=False, repr=False)

    def start(self) -> None:
        with self._lock:
            if self._start_monotonic is None:
                self._start_monotonic = time.perf_counter()
                self.started_at_iso = _utc_now_iso()

    def stop(self) -> float:
        with self._lock:
            if self._start_monotonic is None:
                return 0.0
            if self._end_monotonic is None:
                self._end_monotonic = time.perf_counter()
                self.finished_at_iso = _utc_now_iso()
            return self.elapsed_seconds()

    def inc_records(self, n: int = 1) -> None:
        with self._lock:
            self.total_records += int(n)

    def add_record_duration(self, seconds: float) -> None:
        with self._lock:
            self._accumulated_record_time += float(seconds)

    def elapsed_seconds(self) -> float:
        with self._lock:
            if self._start_monotonic is None:
                return 0.0
            end = self._end_monotonic if self._end_monotonic is not None else time.perf_counter()
            return max(0.0, end - self._start_monotonic)

    def avg_time_per_record_overall(self) -> Optional[float]:
        with self._lock:
            if self.total_records <= 0:
                return None
            return self.elapsed_seconds() / self.total_records

    def avg_record_duration(self) -> Optional[float]:
        with self._lock:
            if self.total_records <= 0:
                return None
            return self._accumulated_record_time / self.total_records

    def throughput_rps(self) -> Optional[float]:
        with self._lock:
            elapsed = self.elapsed_seconds()
            if elapsed <= 0:
                return None
            return self.total_records / elapsed if self.total_records > 0 else 0.0

    def snapshot(self) -> Dict:
        with self._lock:
            return {
                "started_at": self.started_at_iso,
                "finished_at": self.finished_at_iso,
                "elapsed_seconds": self.elapsed_seconds(),
                "total_records": self.total_records,
                "avg_time_per_record_overall": self.avg_time_per_record_overall(),
                "avg_record_duration": self.avg_record_duration(),
                "throughput_rps": self.throughput_rps(),
                "accumulated_record_time_seconds": self._accumulated_record_time,
            }

    def log_summary(self, logger) -> None:
        """Log a summary of current metrics to the provided logger.
        Requires a logger with an 'info' method, e.g. from the standard logging module.
        """
        s = self.snapshot()
        logger.info(
            "Metrics: total=%s elapsed=%.3fs avg_overall=%s avg_measured=%s rps=%s",
            s["total_records"],
            s["elapsed_seconds"],
            None if s["avg_time_per_record_overall"] is None else f"{s['avg_time_per_record_overall']:.6f}s",
            None if s["avg_record_duration"] is None else f"{s['avg_record_duration']:.6f}s",
            None if s["throughput_rps"] is None else f"{s['throughput_rps']:.3f}",
        )

    @contextmanager
    def record_timer(self, count: int = 1):
        """Context manager to time processing of one or more records.

        Usage:
            with tracker.record_timer():
                process_one_record()
        """
        t0 = time.perf_counter()
        try:
            yield
        finally:
            dt = time.perf_counter() - t0
            self.add_record_duration(dt)
            self.inc_records(count)
