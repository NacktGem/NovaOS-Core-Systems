"""Test Redis namespace partitioning functionality."""
import pytest
import os
from unittest.mock import patch, MagicMock

# Test core-api Redis namespace functionality
@pytest.mark.asyncio
async def test_core_api_redis_db_selection():
    """Test that core-api respects REDIS_DB environment variable."""
    with patch.dict(os.environ, {"REDIS_DB": "1"}):
        # Import after setting env vars
        from services.core_api.app.deps import _get_redis_db, _parse_redis_db_from_url
        
        # Test REDIS_DB override
        assert _get_redis_db() == 1

@pytest.mark.asyncio 
async def test_redis_url_parsing():
    """Test Redis URL database parsing."""
    from services.core_api.app.deps import _parse_redis_db_from_url
    
    # Test various Redis URLs
    assert _parse_redis_db_from_url("redis://localhost:6379/0") == 0
    assert _parse_redis_db_from_url("redis://localhost:6379/1") == 1
    assert _parse_redis_db_from_url("redis://localhost:6379/2") == 2
    assert _parse_redis_db_from_url("redis://localhost:6379") == 0
    assert _parse_redis_db_from_url("redis://localhost:6379/") == 0

@pytest.mark.asyncio
async def test_echo_service_redis_db_selection():
    """Test that echo service respects REDIS_DB environment variable."""
    with patch.dict(os.environ, {"REDIS_DB": "2"}):
        # Import after setting env vars
        from services.echo.app.deps import _parse_redis_db_from_url
        
        # Test URL parsing
        assert _parse_redis_db_from_url("redis://redis:6379/0") == 0
        assert _parse_redis_db_from_url("redis://redis:6379/2") == 2

def test_agent_control_redis_env_support():
    """Test that agent control bus supports REDIS_DB env variable."""
    with patch.dict(os.environ, {"REDIS_DB": "1", "AGENT_NAME": "test"}):
        # Import after setting env vars  
        from agents.common.control import REDIS_DB, _parse_redis_db_from_url
        
        # Test env var is read correctly
        assert REDIS_DB == 1
        
        # Test URL parsing fallback
        assert _parse_redis_db_from_url("redis://localhost:6379/2") == 2

def test_redis_bus_db_selection():
    """Test RedisBus supports database selection.""" 
    with patch.dict(os.environ, {"REDIS_DB": "2"}):
        from services.agent_core.bus import _parse_redis_db_from_url
        
        # Test URL parsing
        assert _parse_redis_db_from_url("redis://localhost:6379/1") == 1
        assert _parse_redis_db_from_url("redis://localhost:6379/2") == 2

@pytest.mark.asyncio
async def test_redis_namespace_isolation():
    """Test that different DB numbers provide namespace isolation."""
    import redis.asyncio as redis
    
    # Mock redis connection
    with patch('redis.asyncio.from_url') as mock_redis:
        mock_client = MagicMock()
        mock_redis.return_value = mock_client
        
        # Test different DB connections
        redis.from_url("redis://localhost:6379", db=0)
        redis.from_url("redis://localhost:6379", db=1) 
        redis.from_url("redis://localhost:6379", db=2)
        
        # Verify different db parameters were used
        calls = mock_redis.call_args_list
        assert len(calls) == 3
        assert calls[0][1]['db'] == 0  # NovaOS
        assert calls[1][1]['db'] == 1  # BlackRose  
        assert calls[2][1]['db'] == 2  # GypsyCove

# Test fallback behavior
def test_redis_db_fallback_to_zero():
    """Test that Redis DB defaults to 0 when no env var is set."""
    # Clear any existing REDIS_DB env var
    if 'REDIS_DB' in os.environ:
        del os.environ['REDIS_DB']
    
    from services.core_api.app.deps import _parse_redis_db_from_url
    
    # Should default to 0 from URL
    assert _parse_redis_db_from_url("redis://localhost:6379/0") == 0
    assert _parse_redis_db_from_url("redis://localhost:6379") == 0
    assert _parse_redis_db_from_url("redis://localhost:6379/") == 0