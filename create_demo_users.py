#!/usr/bin/env python3
"""
Create demo users for NovaOS platform login testing
"""
import asyncio
import asyncpg
import hashlib
import json
from datetime import datetime

# Database connection settings
DB_CONFIG = {
    'host': 'localhost',
    'port': 5433,  # External port from docker-compose
    'user': 'nova',
    'password': 'nova_pass',
    'database': 'nova_core',
}


def hash_password(password: str) -> str:
    """Simple password hashing for demo purposes"""
    return hashlib.sha256(password.encode()).hexdigest()


async def create_users_table():
    """Create users table if it doesn't exist"""
    conn = await asyncpg.connect(**DB_CONFIG)

    try:
        await conn.execute(
            '''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(64) NOT NULL,
                role VARCHAR(20) DEFAULT 'USER',
                platform VARCHAR(20) DEFAULT 'novaos',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                profile_data JSONB DEFAULT '{}'::jsonb
            )
        '''
        )
        print("✅ Users table created/verified")

        # Create demo users
        demo_users = [
            {
                'username': 'admin',
                'email': 'admin@novaos.dev',
                'password': 'admin123',
                'role': 'GODMODE',
                'platform': 'novaos',
            },
            {
                'username': 'creator',
                'email': 'creator@blackrose.dev',
                'password': 'creator123',
                'role': 'CREATOR_STANDARD',
                'platform': 'blackrose',
            },
            {
                'username': 'family',
                'email': 'family@gypsycove.dev',
                'password': 'family123',
                'role': 'VERIFIED_USER',
                'platform': 'gypsycove',
            },
            {
                'username': 'demo',
                'email': 'demo@novaos.dev',
                'password': 'demo123',
                'role': 'VERIFIED_USER',
                'platform': 'novaos',
            },
        ]

        for user in demo_users:
            try:
                await conn.execute(
                    '''
                    INSERT INTO users (username, email, password_hash, role, platform, profile_data)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (username) DO UPDATE SET
                        password_hash = EXCLUDED.password_hash,
                        role = EXCLUDED.role,
                        platform = EXCLUDED.platform
                ''',
                    user['username'],
                    user['email'],
                    hash_password(user['password']),
                    user['role'],
                    user['platform'],
                    json.dumps(
                        {'display_name': user['username'].title(), 'created_by': 'demo_setup'}
                    ),
                )
                print(
                    f"✅ Created/updated user: {user['username']} ({user['role']}) for {user['platform']}"
                )
            except Exception as e:
                print(f"❌ Failed to create user {user['username']}: {e}")

        # Show created users
        users = await conn.fetch(
            'SELECT username, email, role, platform, created_at FROM users ORDER BY created_at'
        )
        print(f"\n📊 Total users in database: {len(users)}")
        for user in users:
            print(
                f"   👤 {user['username']} ({user['email']}) - {user['role']} on {user['platform']}"
            )

    finally:
        await conn.close()


async def create_sessions_table():
    """Create sessions table for JWT tokens"""
    conn = await asyncpg.connect(**DB_CONFIG)

    try:
        await conn.execute(
            '''
            CREATE TABLE IF NOT EXISTS user_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                session_token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address INET,
                user_agent TEXT
            )
        '''
        )
        print("✅ Sessions table created/verified")
    finally:
        await conn.close()


async def main():
    print("🚀 Setting up NovaOS demo users...")
    try:
        await create_users_table()
        await create_sessions_table()

        print("\n🎉 Demo users created successfully!")
        print("\n📝 Login Credentials:")
        print("  👑 Admin (GODMODE):     admin / admin123")
        print("  🎨 Creator (BlackRose): creator / creator123")
        print("  👨‍👩‍👧‍👦 Family (GypsyCove):  family / family123")
        print("  🧪 Demo User:           demo / demo123")

        print("\n🌐 Access URLs:")
        print("  • NovaOS Console:    http://localhost:3001")
        print("  • Black Rose:        http://localhost:3000")
        print("  • GypsyCove Academy: http://localhost:3002")
        print("  • API Docs:          http://localhost:9760/docs")

    except Exception as e:
        print(f"❌ Setup failed: {e}")


if __name__ == "__main__":
    asyncio.run(main())
