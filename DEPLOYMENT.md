# Deployment Guide - Project Sunrise

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Vercel (Frontend)                   │
│                   https://your-app.vercel.app            │
└─────────────────────────┬───────────────────────────────┘
                          │ API calls
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Railway (Backend)                     │
│              https://your-app.up.railway.app             │
└─────────────────────────┬───────────────────────────────┘
                          │ Database connection
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Railway (PostgreSQL Database)               │
│         Provided automatically by Railway add-on         │
└─────────────────────────────────────────────────────────┘
```

---

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account

### 1.2 Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Select your repository: `Project-Sunrise`
4. Select the **`backend`** folder as the root directory

### 1.3 Add PostgreSQL Database
1. In your Railway project, click **"+ New"**
2. Select **"Database" → "PostgreSQL"**
3. Railway will create a PostgreSQL instance automatically

### 1.4 Configure Environment Variables
Go to your backend service → **Variables** tab and add:

```env
# Database (auto-linked from Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d

# SerpAPI Key
SERPAPI_KEY=your-serpapi-key

# Port (Railway sets this automatically, but set as fallback)
PORT=5000

# Node Environment
NODE_ENV=production
```

### 1.5 Configure Service Settings
1. Go to **Settings** tab
2. Set **Root Directory** to `backend`
3. Set **Start Command** to `npm start`
4. Set **Health Check Path** to `/api/health`

### 1.6 Deploy
1. Railway will automatically deploy when you push to `main`
2. Note your backend URL (e.g., `https://your-app.up.railway.app`)

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account

### 2.2 Import Project
1. Click **"Add New Project"**
2. Select **"Import Git Repository"**
3. Select your repository: `Project-Sunrise`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2.3 Configure Environment Variables
Add these environment variables:

```env
# Backend API URL (from Railway)
VITE_API_URL=https://your-app.up.railway.app/api
```

### 2.4 Deploy
1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. Note your frontend URL (e.g., `https://your-app.vercel.app`)

---

## Step 3: Update CORS Configuration

Update your backend to allow requests from Vercel:

### Option A: Environment Variable (Recommended)
Add to Railway environment variables:
```env
CORS_ORIGIN=https://your-app.vercel.app
```

### Option B: Update server.js
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

---

## Step 4: Run Database Migration

### Option A: Via Railway Console
1. Go to your backend service in Railway
2. Click **"Deploy Logs"** or use the **Console**
3. Run:
```bash
npm run migrate
npm run seed
```

### Option B: Via Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migration
railway run npm run migrate

# Seed database
railway run npm run seed
```

---

## Step 5: Verify Deployment

### Test Backend
```bash
# Health check
curl https://your-app.up.railway.app/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "...",
  "uptime": ...
}
```

### Test Frontend
1. Open `https://your-app.vercel.app` in your browser
2. You should see the login page
3. Test with these credentials:
   - **Employee**: `employee@test.com` / `password123`
   - **Approver**: `approver@test.com` / `password123`
   - **Admin**: `admin@test.com` / `password123`

---

## Automatic Deployments

### Railway (Backend)
- **Production**: Auto-deploys on push to `main`
- **Preview**: Auto-deploys on PR (if configured)

### Vercel (Frontend)
- **Production**: Auto-deploys on push to `main`
- **Preview**: Auto-deploys on every PR (automatic)

---

## Environment Variables Summary

### Backend (Railway)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-provided by Railway |
| `JWT_SECRET` | Secret for JWT tokens | `your-super-secret-key` |
| `JWT_EXPIRES_IN` | Token expiry time | `7d` |
| `SERPAPI_KEY` | SerpAPI key for search | `your-serpapi-key` |
| `CORS_ORIGIN` | Allowed frontend URL | `https://your-app.vercel.app` |
| `NODE_ENV` | Environment mode | `production` |

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://your-app.up.railway.app/api` |

---

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `CORS_ORIGIN` is set correctly in Railway
   - Check that the frontend URL is correct

2. **Database Connection Failed**
   - Verify `DATABASE_URL` is linked correctly
   - Check if PostgreSQL service is running in Railway

3. **API Calls Failing**
   - Verify `VITE_API_URL` is set in Vercel
   - Check the backend health endpoint

4. **Build Failures**
   - Check build logs in Vercel/Railway dashboard
   - Ensure all dependencies are in package.json

### Useful Commands

```bash
# Check Railway logs
railway logs

# Check Vercel deployment
vercel logs

# Run migration locally before deploying
npm run migrate
npm run seed
```

---

## Cost Estimate

### Free Tier Limits

**Vercel (Frontend)**:
- 100GB bandwidth/month
- 100 build minutes/month
- Unlimited deployments

**Railway (Backend + Database)**:
- $5 free credit/month
- Covers small apps with low traffic
- PostgreSQL included

### Scaling
- Both platforms scale automatically
- Monitor usage in dashboards
- Upgrade plans as needed

---

## Next Steps

1. Set up custom domain (optional)
2. Configure SSL certificates (automatic on both)
3. Set up monitoring and alerts
4. Configure CI/CD for preview deployments
