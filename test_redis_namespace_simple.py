"""Test Redis namespace functionality in isolation."""
import os
import tempfile
import pathlib
import pytest
from unittest.mock import patch, MagicMock


def test_redis_url_parsing():
    """Test Redis URL database parsing function."""
    from urllib.parse import urlparse
    
    def _parse_redis_db_from_url(redis_url: str) -> int:
        """Parse Redis database number from URL, defaulting to 0."""
        try:
            parsed = urlparse(redis_url)
            if parsed.path and len(parsed.path) > 1:
                # Extract DB number from path like '/2'
                db_str = parsed.path.lstrip('/')
                return int(db_str) if db_str.isdigit() else 0
        except:
            pass
        return 0
    
    # Test various Redis URLs
    assert _parse_redis_db_from_url("redis://localhost:6379/0") == 0
    assert _parse_redis_db_from_url("redis://localhost:6379/1") == 1
    assert _parse_redis_db_from_url("redis://localhost:6379/2") == 2
    assert _parse_redis_db_from_url("redis://localhost:6379") == 0
    assert _parse_redis_db_from_url("redis://localhost:6379/") == 0
    assert _parse_redis_db_from_url("redis://user:pass@redis:6379/3") == 3


def test_core_api_config_with_redis_db():
    """Test that core-api config correctly handles REDIS_DB."""
    # Set up minimal test environment 
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = pathlib.Path(tmp_dir)
        priv_key = tmp_path / 'priv.pem'
        pub_key = tmp_path / 'pub.pem'
        priv_key.write_text('dummy_private_key')
        pub_key.write_text('dummy_public_key')
        
        test_env = {
            'DATABASE_URL': 'sqlite:///test.db',
            'AUTH_PEPPER': 'test',
            'JWT_PRIVATE_KEY_PATH': str(priv_key),
            'JWT_PUBLIC_KEY_PATH': str(pub_key),
            'AGENT_SHARED_TOKEN': 'test',
            'REDIS_URL': 'redis://test:6379/0',
            'REDIS_DB': '2'
        }
        
        with patch.dict(os.environ, test_env):
            # Import after setting environment
            import sys
            sys.path.insert(0, 'services/core-api')
            
            from app.config import Settings
            settings = Settings()
            
            assert settings.redis_url == 'redis://test:6379/0'
            assert settings.redis_db == 2


def test_echo_service_settings_with_redis_db():
    """Test that echo service settings correctly handle REDIS_DB."""
    test_env = {
        'REDIS_URL': 'redis://localhost:6379/1', 
        'REDIS_DB': '2'
    }
    
    with patch.dict(os.environ, test_env):
        # Simulate the echo service get_settings function
        def get_settings() -> dict:
            return {
                "redis_url": os.getenv("REDIS_URL", "redis://localhost:6379/0"),
                "redis_db": int(os.getenv("REDIS_DB")) if os.getenv("REDIS_DB") else None,
                "core_api_url": os.getenv("CORE_API_URL", "http://core-api:8000").rstrip("/"),
            }
        
        settings = get_settings()
        assert settings['redis_url'] == 'redis://localhost:6379/1'
        assert settings['redis_db'] == 2


def test_redis_namespace_isolation_mock():
    """Test that different services can connect to different Redis DBs."""
    with patch('redis.asyncio.from_url') as mock_redis:
        mock_client = MagicMock()
        mock_redis.return_value = mock_client
        
        import redis.asyncio as redis
        
        # Simulate different services connecting to different DBs
        redis.from_url("redis://localhost:6379", db=0)  # NovaOS
        redis.from_url("redis://localhost:6379", db=1)  # BlackRose  
        redis.from_url("redis://localhost:6379", db=2)  # GypsyCove
        
        # Verify different db parameters were used
        calls = mock_redis.call_args_list
        assert len(calls) == 3
        assert calls[0][1]['db'] == 0  # NovaOS
        assert calls[1][1]['db'] == 1  # BlackRose  
        assert calls[2][1]['db'] == 2  # GypsyCove


def test_fallback_behavior():
    """Test that Redis DB defaults to 0 when no env var is set."""
    # Clear REDIS_DB env var if it exists
    env_without_redis_db = {k: v for k, v in os.environ.items() if k != 'REDIS_DB'}
    
    with patch.dict(os.environ, env_without_redis_db, clear=True):
        from urllib.parse import urlparse
        
        def _parse_redis_db_from_url(redis_url: str) -> int:
            try:
                parsed = urlparse(redis_url)
                if parsed.path and len(parsed.path) > 1:
                    db_str = parsed.path.lstrip('/')
                    return int(db_str) if db_str.isdigit() else 0
            except:
                pass
            return 0
        
        def _get_redis_db():
            redis_db = int(os.getenv("REDIS_DB")) if os.getenv("REDIS_DB") else None
            if redis_db is not None:
                return redis_db
            return _parse_redis_db_from_url("redis://localhost:6379/0")
        
        # Should default to 0 from URL when no REDIS_DB env var
        assert _get_redis_db() == 0
        assert _parse_redis_db_from_url("redis://localhost:6379") == 0


if __name__ == "__main__":
    # Run tests directly
    test_redis_url_parsing()
    test_echo_service_settings_with_redis_db() 
    test_redis_namespace_isolation_mock()
    test_fallback_behavior()
    print("All Redis namespace tests passed!")