"""
Configuration management for LaTeX Compiler Service.
Uses Pydantic Settings for environment variable support.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Service configuration
    app_name: str = "LaTeX Compiler Service"
    app_version: str = "1.0.0"
    port: int = 8081
    host: str = "0.0.0.0"
    
    # Logging
    log_level: str = "INFO"
    
    # Security
    api_key: Optional[str] = None  # Set via LATEX_SERVICE_API_KEY env var
    require_auth: bool = False  # Set to True to enable API key auth
    
    # Input limits
    max_tex_content_size: int = 100_000_000  # 100MB max LaTeX content
    max_assets_total_size: int = 500_000_000  # 500MB max total assets
    max_timeout: int = 300  # 5 minutes max
    min_timeout: int = 1  # 1 second min
    
    # Rate limiting
    rate_limit_enabled: bool = True
    rate_limit_per_minute: int = 60
    
    # Compilation defaults
    default_timeout: int = 30
    
    class Config:
        env_prefix = "LATEX_SERVICE_"
        case_sensitive = False


# Global settings instance
settings = Settings()

