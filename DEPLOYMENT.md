# Deployment Guide

This guide covers deploying GeoAttend to various platforms.

## Prerequisites

- MongoDB Atlas account with a cluster
- Node.js 20+ runtime environment
- Domain name (optional but recommended for production)
- SSL certificate (required for geolocation in production)

## Environment Variables

Ensure these are set in your production environment:

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/geoattend
JWT_SECRET=<generate-a-secure-random-string-at-least-32-chars>
CLIENT_URL=https://yourdomain.com
NODE_ENV=production
MAX_GPS_ACCURACY=100
LATE_AFTER_MINUTES=10
EARLY_CHECKIN_MINUTES=15
```

**⚠️ Security Note**: Never commit `.env` files. Use your platform's environment variable management.

## Platform-Specific Guides

### 1. Vercel (Recommended for Frontend)

**Deploy Client:**
1. Push to GitHub
2. Connect repository to Vercel
3. Set root directory to `client`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variable: `VITE_API_BASE=https://your-api-domain.com/api`

**Note**: Vercel is for the React frontend only. You'll need a separate service for the backend.

### 2. Render (Recommended for Full Stack)

**Deploy Backend:**
1. Create new Web Service on Render
2. Connect your GitHub repository
3. Root directory: `server`
4. Build command: `npm install && npm run build`
5. Start command: `npm start`
6. Add environment variables from the list above

**Deploy Frontend:**
1. Create new Static Site on Render
2. Connect your GitHub repository
3. Root directory: `client`
4. Build command: `npm install && npm run build`
5. Publish directory: `dist`
6. Add environment variable: `VITE_API_BASE=https://your-api.onrender.com/api`

### 3. Railway

**Deploy Full Stack:**
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add MongoDB plugin: `railway add -p mongodb`
5. Deploy: `railway up`
6. Add environment variables via Railway dashboard

### 4. Heroku

**Deploy Backend:**
```bash
# Install Heroku CLI
heroku login
heroku create geoattend-api

# Add MongoDB
heroku addons:create mongolab

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set CLIENT_URL=https://geoattend-client.herokuapp.com

# Deploy
git subtree push --prefix server heroku main
```

**Deploy Frontend:**
```bash
heroku create geoattend-client
heroku config:set VITE_API_BASE=https://geoattend-api.herokuapp.com/api
git subtree push --prefix client heroku main
```

### 5. AWS (EC2 + S3)

**Backend on EC2:**
1. Launch EC2 instance (Ubuntu 22.04 recommended)
2. Install Node.js 20+
3. Clone repository
4. Set up environment variables in `/etc/environment` or use PM2 ecosystem file
5. Use PM2 for process management: `pm2 start dist/index.js --name geoattend-api`
6. Configure nginx as reverse proxy
7. Set up SSL with Let's Encrypt

**Frontend on S3:**
1. Build client: `cd client && npm run build`
2. Create S3 bucket with static website hosting
3. Upload `dist/` contents to bucket
4. Configure CloudFront for CDN and HTTPS
5. Update `VITE_API_BASE` to point to EC2 backend

### 6. DigitalOcean App Platform

1. Connect GitHub repository
2. Detect both client and server apps
3. Configure build/run commands
4. Add environment variables
5. Deploy

## Post-Deployment Checklist

- [ ] HTTPS is enabled (required for geolocation)
- [ ] Environment variables are set correctly
- [ ] CORS is configured to allow your frontend domain
- [ ] MongoDB connection is working
- [ ] JWT_SECRET is a secure random string
- [ ] Test user registration and login
- [ ] Test location-based features on mobile
- [ ] Monitor error logs
- [ ] Set up automated backups for MongoDB
- [ ] Configure rate limiting appropriately for your scale

## Database Setup

### MongoDB Atlas
1. Create cluster (M0 free tier is sufficient for small deployments)
2. Add IP whitelist (0.0.0.0/0 for development, specific IPs for production)
3. Create database user with read/write permissions
4. Copy connection string and add to `MONGODB_URI`

### Seed Demo Data (Optional)
```bash
cd server
npm run build
node dist/scripts/seed.js
```

## Monitoring & Maintenance

- **Logs**: Use your platform's logging service or integrate with services like Logtail, Papertrail
- **Uptime**: Set up monitoring with UptimeRobot or Pingdom
- **Error Tracking**: Consider integrating Sentry for error tracking
- **Analytics**: Use MongoDB Atlas monitoring for database performance

## Troubleshooting

### "Cannot GET /api" error
- Check that CLIENT_URL matches your frontend domain
- Verify CORS settings in server

### Location not working
- Ensure you're using HTTPS (browsers block geolocation on HTTP)
- Check browser permissions for location access

### Database connection fails
- Verify MONGODB_URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user has proper permissions

## Scaling Considerations

- Enable MongoDB Atlas auto-scaling
- Add Redis for session storage if needed
- Use CDN for static assets
- Consider load balancer for multiple backend instances
- Implement database read replicas for high traffic

---

For questions or issues, please open a GitHub issue.
