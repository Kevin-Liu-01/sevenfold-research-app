"""
client_factory.py

Centralized factories for constructing external API clients used by indexer-core.
Intended for dependency injection: components should accept these clients as
arguments instead of instantiating them internally.
"""

from __future__ import annotations

import os
from typing import Optional, Any

from .config import (
    GROBID_CONFIG_PATH,
    API_ANTHROPIC_API_KEY_ENV,
    API_SUPABASE_URL_ENV,
    API_SUPABASE_SERVICE_ROLE_KEY_ENV,
    API_SUPABASE_ANON_KEY_ENV,
)

global _anthropic_client, _grobid_client, _supabase_client
_anthropic_client = None
_grobid_client = None
_supabase_client = None

def get_anthropic_client(api_key: Optional[str] = None) -> Any:
    """Create an Anthropic client.

    Args:
        api_key: API key; if None, reads from env var defined by API_ANTHROPIC_API_KEY_ENV.

    Returns:
        anthropic.Anthropic instance.
    """
    global _anthropic_client
    if _anthropic_client is not None:
        return _anthropic_client

    try:
        import anthropic  # type: ignore
    except Exception as e:
        raise ImportError("anthropic package is required to create an Anthropic client") from e

    key = api_key or os.getenv(API_ANTHROPIC_API_KEY_ENV)
    if not key:
        raise ValueError(
            f"Anthropic API key not provided and environment variable {API_ANTHROPIC_API_KEY_ENV} is not set"
        )

    _anthropic_client = anthropic.Anthropic(api_key=key)
    return _anthropic_client


def get_grobid_client(config_path: Optional[str] = None) -> Any:
    """Create a GrobidClient.

    Args:
        config_path: Path to GROBID client config JSON. Defaults to GROBID_CONFIG_PATH.

    Returns:
        grobid_client.grobid_client.GrobidClient instance.
    """
    global _grobid_client
    if _grobid_client is not None:
        return _grobid_client

    try:
        from grobid_client.grobid_client import GrobidClient  # type: ignore
    except Exception as e:
        raise ImportError("grobid-client-python package is required to create a GrobidClient") from e

    cfg = config_path or GROBID_CONFIG_PATH
    _grobid_client = GrobidClient(config_path=cfg)
    return _grobid_client


def get_supabase_client(url: Optional[str] = None, key: Optional[str] = None) -> Any:
    """Create a Supabase client.

    Args:
        url: Supabase project URL; falls back to env SUPABASE_URL.
        key: Service role or anon key; falls back to env SUPABASE_SERVICE_ROLE_KEY, then SUPABASE_ANON_KEY.

    Returns:
        supabase.Client instance.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    supabase_url = url or os.getenv(API_SUPABASE_URL_ENV)
    supabase_key = key or os.getenv(API_SUPABASE_SERVICE_ROLE_KEY_ENV) or os.getenv(API_SUPABASE_ANON_KEY_ENV)

    if not supabase_url:
        raise ValueError("Supabase URL not provided and SUPABASE_URL is not set")
    if not supabase_key:
        raise ValueError(
            "Supabase key not provided and neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY are set"
        )

    try:
        from supabase import create_client  # type: ignore
    except Exception as e:
        raise ImportError("supabase package is required to create a Supabase client") from e

    _supabase_client = create_client(supabase_url, supabase_key)
    return _supabase_client


__all__ = [
    "get_anthropic_client",
    "get_grobid_client",
    "get_supabase_client",
]
