# SAFE REWRITE: Resolving 404 & Nginx Conflicts

To fix the 404 without breaking your Certbot SSL configuration, we will rewrite the `myapp` file to include our new routing while keeping your SSL lines exactly as they are.

Follow these steps on your VPS:

---

## 1. Delete the Conflicting File
This is the file we created earlier that is now causing a "conflicting server name" warning. Let's get rid of it:
```bash
rm /etc/nginx/sites-enabled/auragentics.ai
```

---

## 2. Safely Update 'myapp'
We will now replace the content of `/etc/nginx/sites-enabled/myapp` with this version which has the added `/firstchoice-imaging/` block.

**Run this command to clear and open the file:**
```bash
truncate -s 0 /etc/nginx/sites-enabled/myapp && nano /etc/nginx/sites-enabled/myapp
```

**Copy and paste this ENTIRE block into the file:**

```nginx
server {
    server_name auragentics.ai www.auragentics.ai;

    # --- ADDED WORKFLOW BLOCK START ---
    location /firstchoice-imaging/ {
        alias /var/www/auragentics.ai/auragentics-webapp/public/firstchoice-imaging/;
        try_files $uri $uri/ /firstchoice-imaging/loganclinicworkflowvisual.html;
    }
    # --- ADDED WORKFLOW BLOCK END ---

    location / {
        proxy_pass http://127.0.0.1:3000;

        # Recommended headers for correct client IP and host tracking
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/auragentics.ai/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/auragentics.ai/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.auragentics.ai) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = auragentics.ai) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name auragentics.ai www.auragentics.ai;
    return 404; # managed by Certbot
}
```

---

## 3. Save, Reload, and Test
1. Press `Ctrl+O` then `Enter` to save.
2. Press `Ctrl+X` to exit.
3. Reload Nginx:
   ```bash
   nginx -t && systemctl reload nginx
   ```

## 4. Test the URL
Visit: [**https://auragentics.ai/firstchoice-imaging/loganclinicworkflowvisual.html**](https://auragentics.ai/firstchoice-imaging/loganclinicworkflowvisual.html)
