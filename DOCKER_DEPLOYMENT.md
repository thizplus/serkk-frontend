# Docker Deployment Guide

## Prerequisites
- Docker installed on your system
- Docker Compose installed
- `.env` file configured (copy from `.env.example`)

## Environment Variables Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file with your actual values:
```bash
# Required for production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com/api/v1/ws
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-google-client-id

# Optional
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-key
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

## Build and Run

### Using Docker Compose (Recommended)

1. Build the Docker image:
```bash
docker-compose build
```

2. Start the container:
```bash
docker-compose up -d
```

3. Check logs:
```bash
docker-compose logs -f web
```

4. Stop the container:
```bash
docker-compose down
```

### Using Docker CLI

1. Build the image:
```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_NAME="VOOBIZE" \
  --build-arg NEXT_PUBLIC_APP_PLAN="โซเชียลไทยแท้" \
  --build-arg NEXT_PUBLIC_APP_URL="https://yourdomain.com" \
  --build-arg NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api/v1" \
  --build-arg NEXT_PUBLIC_WS_URL="wss://api.yourdomain.com/api/v1/ws" \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-client-id" \
  -t nextjs-social-app .
```

2. Run the container:
```bash
docker run -d \
  -p 3000:3000 \
  --name nextjs-social-app \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_APP_URL="https://yourdomain.com" \
  -e NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api/v1" \
  -e NEXT_PUBLIC_WS_URL="wss://api.yourdomain.com/api/v1/ws" \
  nextjs-social-app
```

## Health Check

The container includes a health check that runs every 30 seconds:
- URL: `http://localhost:3000`
- Interval: 30s
- Timeout: 10s
- Retries: 3
- Start period: 40s

Check health status:
```bash
docker inspect --format='{{.State.Health.Status}}' nextjs-social-app
```

## Important Notes

### WebSocket URL
- For **development**: Use `ws://` protocol
  - Example: `ws://localhost:8080/api/v1/ws`
- For **production**: Use `wss://` protocol (secure WebSocket)
  - Example: `wss://api.yourdomain.com/api/v1/ws`

### Production Checklist
- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Use `wss://` for `NEXT_PUBLIC_WS_URL` (secure WebSocket)
- [ ] Configure real Google OAuth client ID
- [ ] Set up VAPID keys for PWA push notifications (optional)
- [ ] Configure GTM ID for analytics (optional)
- [ ] Set up reverse proxy (Nginx/Caddy) for SSL/TLS
- [ ] Configure CORS on backend API

## Troubleshooting

### Container won't start
Check logs:
```bash
docker logs nextjs-social-app
```

### WebSocket connection fails
1. Verify `NEXT_PUBLIC_WS_URL` is correct
2. Check if backend WebSocket server is running
3. For production, ensure `wss://` protocol is used
4. Check firewall/proxy settings

### Environment variables not working
Make sure to:
1. Pass them as `--build-arg` during build
2. Set them in `environment` section of docker-compose.yml
3. Rebuild the image after changing env vars:
```bash
docker-compose build --no-cache
docker-compose up -d
```

## Updating the Application

1. Pull latest changes:
```bash
git pull origin main
```

2. Rebuild and restart:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Monitoring

View real-time logs:
```bash
docker-compose logs -f web
```

Check resource usage:
```bash
docker stats nextjs-social-app
```

## Backup

Export container:
```bash
docker save nextjs-social-app -o nextjs-social-app.tar
```

Import on another server:
```bash
docker load -i nextjs-social-app.tar
```
