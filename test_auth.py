#!/usr/bin/env python3

import requests
import json
import sys


def test_core_api():
    base_url = "http://localhost:9760"

    print("Testing NovaOS Core API Authentication...")

    # Test health endpoint
    try:
        health_response = requests.get(f"{base_url}/internal/healthz")
        print(f"Health check: {health_response.status_code} - {health_response.json()}")
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

    # Test login
    login_data = {"email": "admin@blackrosecollective.studio", "password": "password"}

    try:
        login_response = requests.post(f"{base_url}/auth/login", json=login_data)
        print(f"Login test: {login_response.status_code}")

        if login_response.status_code == 200:
            result = login_response.json()
            print(f"Login successful! User ID: {result.get('id')} Role: {result.get('role')}")

            # The login endpoint returns user info directly and sets cookies
            # Test the /auth/me endpoint which uses cookies
            me_response = requests.get(f"{base_url}/auth/me", cookies=login_response.cookies)
            print(f"Me endpoint test: {me_response.status_code}")

            if me_response.status_code == 200:
                me_data = me_response.json()
                print(f"Profile retrieved: {me_data.get('email')} ({me_data.get('role')})")
                return True
            else:
                print(f"Me endpoint failed: {me_response.text}")
                print("But login was successful, which means authentication is working!")
        else:
            print(f"Login failed: {login_response.status_code} - {login_response.text}")
            print(f"Response headers: {dict(login_response.headers)}")
    except Exception as e:
        print(f"Login test failed: {e}")

    return False


if __name__ == "__main__":
    success = test_core_api()
    if success:
        print("\n✅ Core API authentication is working!")
        sys.exit(0)
    else:
        print("\n❌ Core API authentication has issues")
        sys.exit(1)
