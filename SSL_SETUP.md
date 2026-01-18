## SSL/HTTPS Setup Guide

### Option 1: Let's Encrypt (Free SSL)

**Prerequisites:**
- Domain name pointed to 86.107.77.113
- Ports 80 and 443 open

**Install Certbot:**
```bash
ssh root@86.107.77.113
apt-get update
apt-get install -y certbot
```

**Get SSL Certificate:**
```bash
# Stop Nginx temporarily
cd /opt/ridebnb/frontend
docker-compose stop nginx

# Get certificate
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Certificates will be at:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

**Update Nginx Configuration:**

Edit `/opt/ridebnb/nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$host$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Frontend
        location / {
            proxy_pass http://frontend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Graph Node API
        location /subgraphs/ {
            proxy_pass http://graph-node:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            add_header Access-Control-Allow-Origin *;
        }

        # RPC Endpoint
        location /rpc {
            proxy_pass http://bsc-node:8545;
            proxy_set_header Host $host;
            add_header Access-Control-Allow-Origin *;
        }
    }
}
```

**Update docker-compose.yml:**

Edit `/opt/ridebnb/frontend/docker-compose.yml`:

```yaml
nginx:
  image: nginx:alpine
  container_name: ridebnb-nginx
  restart: unless-stopped
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ../../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt/live/your-domain.com:/etc/nginx/ssl:ro  # SSL certs
    - nginx-logs:/var/log/nginx
  depends_on:
    - frontend
  networks:
    - ridebnb-network
```

**Restart Nginx:**
```bash
cd /opt/ridebnb/frontend
docker-compose up -d nginx
```

**Auto-Renewal:**
```bash
# Add to crontab
crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f /opt/ridebnb/frontend/docker-compose.yml restart nginx
```

### Option 2: Cloudflare SSL (Recommended)

**Advantages:**
- Free SSL
- DDoS protection
- CDN acceleration
- No certificate management

**Setup:**

1. **Add domain to Cloudflare:**
   - Go to https://www.cloudflare.com
   - Add your domain
   - Update nameservers

2. **DNS Settings:**
   ```
   Type: A
   Name: @
   Content: 86.107.77.113
   Proxy: Enabled (Orange cloud)
   
   Type: A
   Name: www
   Content: 86.107.77.113
   Proxy: Enabled (Orange cloud)
   ```

3. **SSL/TLS Settings:**
   - SSL/TLS > Overview > Encryption mode: **Full**
   - SSL/TLS > Edge Certificates > Always Use HTTPS: **On**
   - SSL/TLS > Edge Certificates > Automatic HTTPS Rewrites: **On**

4. **Firewall Rules (Optional):**
   - Security > WAF > Create Rule
   - Block known bots and threats

5. **Update Nginx (no SSL needed):**
   Since Cloudflare handles SSL, keep Nginx on port 80:
   ```nginx
   server {
       listen 80;
       server_name _;
       
       # Trust Cloudflare's X-Forwarded-Proto
       if ($http_x_forwarded_proto = "https") {
           set $https_on "on";
       }
       
       # Your location blocks...
   }
   ```

**Benefits:**
- ✅ Free SSL
- ✅ Automatic renewal
- ✅ Better performance (CDN)
- ✅ DDoS protection
- ✅ Simpler configuration

### Test SSL

```bash
# Check SSL certificate
echo | openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null | openssl x509 -noout -dates

# Test HTTPS
curl -I https://your-domain.com

# SSL Labs test (comprehensive)
# Go to: https://www.ssllabs.com/ssltest/
```

### Firewall Configuration

```bash
# Install UFW
apt-get install -y ufw

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow custom ports (optional)
ufw allow 8545/tcp  # BSC RPC (if exposing publicly)
ufw allow 8000/tcp  # Graph Node (if exposing publicly)

# Enable firewall
ufw --force enable

# Check status
ufw status
```

### Monitoring SSL Expiry

If using Let's Encrypt, monitor expiry:

```bash
#!/bin/bash
# Check SSL expiry
DAYS_LEFT=$(echo | openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2 | xargs -I {} date -d "{}" +%s)
CURRENT=$(date +%s)
DAYS=$((($DAYS_LEFT - $CURRENT) / 86400))

echo "SSL certificate expires in $DAYS days"

if [ $DAYS -lt 30 ]; then
    echo "⚠️  Certificate expires soon! Renewing..."
    certbot renew
fi
```
