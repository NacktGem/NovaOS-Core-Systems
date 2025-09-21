# 🚀 NovaOS Local Platform Access Demo

## Current Status: ✅ READY FOR LOCAL TESTING

### 🌐 **Platform URLs (Local Development)**

| Platform                  | URL                   | Port | Status            |
| ------------------------- | --------------------- | ---- | ----------------- |
| **NovaOS Console**        | http://localhost:3002 | 3002 | ✅ Running        |
| **Black Rose Collective** | http://localhost:3000 | 3000 | ⏸️ Ready to start |
| **GypsyCove Academy**     | http://localhost:3001 | 3001 | ⏸️ Ready to start |

### 🔧 **Backend Services**

| Service                 | URL                   | Port | Status            |
| ----------------------- | --------------------- | ---- | ----------------- |
| **PostgreSQL Database** | localhost:5433        | 5433 | ✅ Running        |
| **Redis Cache**         | localhost:6380        | 6380 | ✅ Running        |
| **Core API**            | http://localhost:8760 | 8760 | ⏸️ Ready to start |

---

## 🎯 **Quick Start Guide**

### Step 1: Start All Platforms

```bash
cd /mnt/d/NovaOS-Core-Systems

# Start Black Rose Collective (Creator Platform)
cd apps/web-shell && npm run dev -- --port 3000 &

# Start GypsyCove Academy (Family Platform)
cd apps/gypsy-cove && npm run dev -- --port 3001 &

# NovaOS Console is already running on port 3002
```

### Step 2: Access Each Platform

#### 🌹 **NovaOS Console** (Already Running)

- **URL**: http://localhost:3002
- **Purpose**: Founder/admin control interface
- **Features**: God mode, system management, analytics overview

#### 🎨 **Black Rose Collective** (Port 3000)

- **URL**: http://localhost:3000
- **Purpose**: Creator platform with revenue analytics
- **Features**: Enhanced dashboard, creator tools, revenue optimization

#### 🏫 **GypsyCove Academy** (Port 3001)

- **URL**: http://localhost:3001
- **Purpose**: Family/educational platform
- **Features**: Learning modules, family-safe content, educational tools

---

## 🔐 **Authentication & Access**

### Default Login Credentials

```
Username: admin
Password: admin123
```

### JWT Token Authentication

The platforms use JWT tokens for authentication. When you log in through any platform, you'll get a token that works across all three platforms (unified authentication).

### Admin Access Levels

- **GODMODE**: Full system access (NovaOS Console)
- **ADMIN**: Platform management (All platforms)
- **CREATOR**: Content creation (Black Rose)
- **USER**: Standard access (All platforms)

---

## 🧪 **Testing Cross-Platform Integration**

### 1. **Unified Authentication Test**

1. Log into NovaOS Console (http://localhost:3002)
2. Navigate to Black Rose (http://localhost:3000)
3. Verify you're automatically logged in

### 2. **Analytics Integration Test**

1. Access Black Rose enhanced dashboard
2. Check creator analytics from Velora agent
3. Verify data flows from all platforms

### 3. **Navigation Test**

1. Use the platform switcher in the header
2. Test navigation between all three domains
3. Verify session persistence across platforms

---

## 🔧 **Development Commands**

### Start Individual Platforms

```bash
# Black Rose Collective
cd apps/web-shell && npm run dev -- --port 3000

# GypsyCove Academy
cd apps/gypsy-cove && npm run dev -- --port 3001

# NovaOS Console (already running)
# http://localhost:3002
```

### Start Backend Services

```bash
# Core API
cd services/core-api && uvicorn app.main:app --host 0.0.0.0 --port 8760 --reload

# Lyra Agent (Educational)
cd services/lyra && uvicorn app.main:app --host 0.0.0.0 --port 8761 --reload

# Velora Agent (Analytics)
cd services/velora && uvicorn app.main:app --host 0.0.0.0 --port 8762 --reload
```

### Check Service Status

```bash
# Check running processes
ps aux | grep -E "(node|python|uvicorn)"

# Check ports in use
ss -tuln | grep -E ":3000|:3001|:3002|:8760|:8761|:8762"

# Test API endpoints
curl http://localhost:8760/health
curl http://localhost:8761/health
curl http://localhost:8762/health
```

---

## 🎨 **Platform Features to Test**

### NovaOS Console (Port 3002)

- [ ] God mode access panel
- [ ] System health monitoring
- [ ] Cross-platform analytics
- [ ] Agent management interface

### Black Rose Collective (Port 3000)

- [ ] Enhanced creator dashboard
- [ ] Revenue analytics (Velora integration)
- [ ] Content performance metrics
- [ ] Creator tools and settings

### GypsyCove Academy (Port 3001)

- [ ] Educational content library
- [ ] Learning progress tracking
- [ ] Family-safe content filtering
- [ ] Interactive learning modules

---

## 🐛 **Troubleshooting**

### Common Issues

**Port Already in Use:**

```bash
# Kill process using port
sudo fuser -k 3000/tcp
sudo fuser -k 3001/tcp
sudo fuser -k 3002/tcp
```

**Authentication Issues:**

- Clear browser cookies/storage
- Check JWT token configuration
- Verify Redis connection

**Platform Not Loading:**

- Check npm dependencies: `npm install`
- Verify environment variables in `.env`
- Check console for JavaScript errors

### Service Health Checks

```bash
# Database connection
docker exec nova-postgres pg_isready

# Redis connection
docker exec nova-redis redis-cli ping

# API health
curl http://localhost:8760/health
```

---

## ✅ **Success Criteria**

Your local setup is working correctly when:

- [ ] All three platforms load without errors
- [ ] Authentication works across all platforms
- [ ] Platform navigation is seamless
- [ ] Backend APIs respond to health checks
- [ ] Database and Redis are accessible
- [ ] Cross-platform data sharing works

**🎉 Ready for local development and testing!**
