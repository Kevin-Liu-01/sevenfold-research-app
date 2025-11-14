"""
Middleware for request tracking, rate limiting, and authentication.
"""

import time
import uuid
import logging
from typing import Callable, Dict, List
from fastapi import Request, HTTPException, status
from fastapi.responses import Response
from collections import defaultdict
from datetime import datetime, timedelta
from config import settings

logger = logging.getLogger(__name__)

# Simple in-memory rate limiter (use Redis in production)
_rate_limit_store: Dict[str, List[float]] = defaultdict(list)


def get_request_id() -> str:
    """Generate a unique request ID."""
    return str(uuid.uuid4())


async def request_id_middleware(request: Request, call_next: Callable) -> Response:
    """Add request ID to all requests for tracing."""
    request_id = get_request_id()
    request.state.request_id = request_id
    
    # Add request ID to response headers
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    return response


async def auth_middleware(request: Request, call_next: Callable) -> Response:
    """API key authentication middleware."""
    # Skip auth for health check endpoint
    if request.url.path == "/health":
        return await call_next(request)
    
    if not settings.require_auth:
        return await call_next(request)
    
    if not settings.api_key:
        logger.warning("API key authentication required but no API key configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication not properly configured"
        )
    
    # Check for API key in header
    api_key = request.headers.get("X-API-Key") or request.headers.get("Authorization")
    
    if api_key:
        # Handle "Bearer <token>" format
        if api_key.startswith("Bearer "):
            api_key = api_key[7:]
    
    if api_key != settings.api_key:
        logger.warning(f"Invalid API key attempt from {request.client.host if request.client else 'unknown'}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key"
        )
    
    return await call_next(request)


def _cleanup_old_entries(ip: str, window_seconds: int = 60):
    """Remove rate limit entries older than the time window."""
    cutoff = time.time() - window_seconds
    _rate_limit_store[ip] = [t for t in _rate_limit_store[ip] if t > cutoff]


async def rate_limit_middleware(request: Request, call_next: Callable) -> Response:
    """Simple rate limiting middleware."""
    # Skip rate limiting for health check
    if request.url.path == "/health":
        return await call_next(request)
    
    if not settings.rate_limit_enabled:
        return await call_next(request)
    
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    
    # Clean up old entries
    _cleanup_old_entries(client_ip, window_seconds=60)
    
    # Check rate limit
    current_time = time.time()
    request_times = _rate_limit_store[client_ip]
    
    if len(request_times) >= settings.rate_limit_per_minute:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {settings.rate_limit_per_minute} requests per minute."
        )
    
    # Record this request
    request_times.append(current_time)
    
    return await call_next(request)

