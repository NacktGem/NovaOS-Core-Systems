#!/usr/bin/env python3
"""
Update database schema to match the Core API User model
"""
import asyncio
import asyncpg
import hashlib
import json
import uuid
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


async def update_database_schema():
    """Update database to match Core API expected schema"""
    conn = await asyncpg.connect(**DB_CONFIG)

    try:
        # First, create roles table
        await conn.execute(
            '''
            CREATE TABLE IF NOT EXISTS roles (
                name VARCHAR(50) PRIMARY KEY,
                description TEXT,
                permissions JSONB DEFAULT '{}'::jsonb
            )
        '''
        )
        print("✅ Roles table created/verified")

        # Insert default roles with clear hierarchy
        roles = [
            ('GODMODE', 'NacktGem ONLY - Full system access to ALL platforms'),
            ('SUPER_ADMIN', 'Platform administrators - Black Rose admin portal access'),
            ('ADMIN_AGENT', 'Agent management access'),
            ('CREATOR_STANDARD', 'Creator platform access'),
            ('VERIFIED_USER', 'Verified user access'),
            ('GUEST', 'Guest access'),
        ]

        for role_name, description in roles:
            await conn.execute(
                '''
                INSERT INTO roles (name, description)
                VALUES ($1, $2)
                ON CONFLICT (name) DO NOTHING
            ''',
                role_name,
                description,
            )

        print("✅ Default roles inserted")

        # Drop existing users table and recreate with correct schema
        await conn.execute('DROP TABLE IF EXISTS users CASCADE')
        await conn.execute('DROP TABLE IF EXISTS user_sessions CASCADE')

        # Create users table with UUID and correct schema
        await conn.execute(
            '''
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(50) REFERENCES roles(name) NOT NULL,
                tiers JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
        '''
        )
        print("✅ Users table recreated with correct schema")

        # Create updated sessions table
        await conn.execute(
            '''
            CREATE TABLE user_sessions (
                id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                session_token VARCHAR(255) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address INET,
                user_agent TEXT
            )
        '''
        )
        print("✅ Sessions table recreated")

        # Create demo users with UUID
        demo_users = [
            {
                'email': 'nacktgem@gmail.com',  # YOUR GODMODE ACCESS ONLY
                'password': 'godmode2024!',  # Change this to your preferred password
                'role': 'GODMODE',
                'tiers': ['godmode', 'premium', 'enterprise'],
            },
            {
                'email': 'admin@blackrose.dev',
                'password': 'admin123',
                'role': 'SUPER_ADMIN',  # Regular admin for Black Rose
                'tiers': ['admin', 'premium'],
            },
            {
                'email': 'creator@blackrose.dev',
                'password': 'creator123',
                'role': 'CREATOR_STANDARD',
                'tiers': ['standard'],
            },
            {
                'email': 'family@gypsycove.dev',
                'password': 'family123',
                'role': 'VERIFIED_USER',
                'tiers': ['family'],
            },
            {
                'email': 'demo@novaos.dev',
                'password': 'demo123',
                'role': 'VERIFIED_USER',
                'tiers': ['basic'],
            },
        ]

        for user in demo_users:
            user_id = str(uuid.uuid4())
            await conn.execute(
                '''
                INSERT INTO users (id, email, password_hash, role, tiers)
                VALUES ($1, $2, $3, $4, $5)
            ''',
                user_id,
                user['email'],
                hash_password(user['password']),
                user['role'],
                json.dumps(user['tiers']),
            )
            print(f"✅ Created user: {user['email']} ({user['role']})")

        # Show created users
        users = await conn.fetch(
            'SELECT id, email, role, tiers, created_at FROM users ORDER BY created_at'
        )
        print(f"\n📊 Total users in database: {len(users)}")
        for user in users:
            print(f"   👤 {user['email']} - {user['role']} {user['tiers']}")

        print(f"\n🎉 Database schema updated successfully!")
        print(f"\n📝 Updated Login Credentials:")
        print(f"  👑 GODMODE (NacktGem):  nacktgem@gmail.com / godmode2024!")
        print(f"  🔧 Admin (BlackRose):   admin@blackrose.dev / admin123")
        print(f"  🎨 Creator (BlackRose): creator@blackrose.dev / creator123")
        print(f"  👨‍👩‍👧‍👦 Family (GypsyCove):  family@gypsycove.dev / family123")
        print(f"  🧪 Demo User:           demo@novaos.dev / demo123")

        print(f"\n🏛️ Access Hierarchy:")
        print(f"  • GODMODE → NovaOS Console (localhost:3001) - YOUR admin panel")
        print(f"  • SUPER_ADMIN → Black Rose admin portal (localhost:3000/admin)")
        print(f"  • Regular users → Their respective platform interfaces")

    finally:
        await conn.close()


async def main():
    print("🔄 Updating database schema for NovaOS Core API...")
    try:
        await update_database_schema()

        print("\n🌐 Test login at:")
        print("  • API Login: POST http://localhost:9760/auth/login")
        print("  • With body: {\"email\": \"admin@novaos.dev\", \"password\": \"admin123\"}")

    except Exception as e:
        print(f"❌ Schema update failed: {e}")


if __name__ == "__main__":
    asyncio.run(main())
