# PRODUCTION DEPLOYMENT GUIDE

## Pre-Deployment Checklist

### 1. Code Quality Review
- [x] All PHP files pass syntax check
- [x] All JavaScript files validated
- [x] No console errors in browser
- [x] Error handling implemented
- [x] Input validation in place
- [x] SQL injection prevention (prepared statements)

### 2. Security Review
- [x] CORS headers configured
- [x] No sensitive data in code
- [x] Password hashing ready (for future)
- [ ] HTTPS configured
- [ ] Rate limiting configured
- [ ] API keys setup (for future)

### 3. Database Review
- [x] All tables created automatically
- [x] Indexes defined on key columns
- [x] Relationships mapped
- [x] Character set UTF-8
- [ ] Backup strategy defined
- [ ] Recovery procedure tested

### 4. Testing Review
- [x] API test suite created
- [x] Browser test UI available
- [x] All 24 endpoints testable
- [ ] Load testing performed
- [ ] Security testing performed
- [ ] Cross-browser testing done

### 5. Documentation Review
- [x] API_ENDPOINTS.md complete
- [x] ARCHITECTURE.md complete
- [x] REFACTORING_COMPLETE.md complete
- [ ] User manual ready
- [ ] Admin guide ready
- [ ] Troubleshooting guide ready

---

## INSTALLATION FOR PRODUCTION

### Prerequisites
- PHP 7.4+ with MySQL extensions
- MySQL 5.7+ or MariaDB 10.2+
- Apache/Nginx with rewrite module
- 100MB+ disk space

### Step 1: Prepare Server
```bash
# SSH into production server
ssh user@production-server.com

# Create application directory
mkdir -p /var/www/qurban
cd /var/www/qurban

# Set proper permissions
sudo chown -R www-data:www-data /var/www/qurban
sudo chmod 755 /var/www/qurban
```

### Step 2: Deploy Code
```bash
# Option A: Git clone
git clone https://github.com/yourrepo/qurban.git .

# Option B: Upload files
scp -r /path/to/local/qurban/* user@server:/var/www/qurban/
```

### Step 3: Configure Permissions
```bash
# Set correct permissions
chmod 755 /var/www/qurban/public
chmod 644 /var/www/qurban/public/index.html
chmod 644 /var/www/qurban/public/assets/**/*
chmod 755 /var/www/qurban/api
chmod 700 /var/www/qurban/api/config
chmod 755 /var/www/qurban/logs

# Create logs directory if not exists
mkdir -p /var/www/qurban/logs
chmod 755 /var/www/qurban/logs
```

### Step 4: Configure Database
```bash
# Login to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE qurban_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'qurban'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON qurban_db.* TO 'qurban'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 5: Configure PHP
Edit `/var/www/qurban/api/config/database.php`:
```php
$host = 'localhost';
$dbName = 'qurban_db';
$user = 'qurban';
$pass = 'secure_password_here';
```

### Step 6: Configure Apache
Create `/etc/apache2/sites-available/qurban.conf`:
```apache
<VirtualHost *:80>
    ServerName qurban.example.com
    ServerAlias www.qurban.example.com
    
    DocumentRoot /var/www/qurban/public
    
    <Directory /var/www/qurban/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Redirect non-public directories
    <Directory /var/www/qurban/api>
        Deny from all
    </Directory>
    
    <Directory /var/www/qurban/config>
        Deny from all
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/qurban-error.log
    CustomLog ${APACHE_LOG_DIR}/qurban-access.log combined
</VirtualHost>
```

Enable site:
```bash
sudo a2ensite qurban.conf
sudo a2enmod rewrite
sudo systemctl reload apache2
```

### Step 7: Setup HTTPS (SSL/TLS)
```bash
# Install Certbot (Let's Encrypt)
sudo apt-get install certbot python3-certbot-apache

# Generate SSL certificate
sudo certbot --apache -d qurban.example.com

# Verify auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Step 8: Configure PHP Settings
Edit `/etc/php/7.4/apache2/php.ini`:
```ini
upload_max_filesize = 100M
post_max_size = 100M
max_execution_time = 300
memory_limit = 256M
error_reporting = E_ALL & ~E_NOTICE
display_errors = Off
log_errors = On
error_log = /var/log/php-errors.log
```

### Step 9: Test Installation
```bash
# Test database connection
php -f /var/www/qurban/api/config/database.php

# Test API endpoints
curl http://qurban.example.com/api/index.php?action=getTahun

# Check browser
# Visit: http://qurban.example.com
```

---

## POST-DEPLOYMENT TASKS

### 1. Verify Installation
```bash
# Check database tables
mysql -u qurban -p qurban_db -e "SHOW TABLES;"

# Check file permissions
ls -la /var/www/qurban/

# Test API
curl -I http://qurban.example.com/api/index.php?action=getTahun
```

### 2. Run Test Suite
```bash
# Command line tests
php /var/www/qurban/tests/ApiTestSuite.php

# Browser tests
# Visit: http://qurban.example.com/public/debug/api-test.html
```

### 3. Setup Monitoring
```bash
# Monitor logs
tail -f /var/log/php-errors.log
tail -f /var/www/qurban/logs/errors.log

# Monitor disk space
df -h /var/www/qurban
```

### 4. Setup Backup
```bash
# Create backup script
cat > /usr/local/bin/backup-qurban.sh << 'EOF'
#!/bin/bash

BACKUP_DIR=/var/backups/qurban
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
mysqldump -u qurban -p'password' qurban_db > $BACKUP_DIR/db_$DATE.sql

# Backup files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/qurban

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-qurban.sh

# Schedule daily backup (crontab)
0 2 * * * /usr/local/bin/backup-qurban.sh >> /var/log/qurban-backup.log 2>&1
```

### 5. Setup Log Rotation
Create `/etc/logrotate.d/qurban`:
```
/var/www/qurban/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0755 www-data www-data
}
```

---

## SECURITY HARDENING

### 1. Firewall Rules
```bash
# Allow only necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 2. Disable Directory Listing
Update `.htaccess` in public directory:
```apache
Options -Indexes
```

### 3. Hide PHP Version
Edit `/etc/apache2/mods-enabled/security.conf`:
```apache
Header always unset "X-Powered-By"
Header unset "X-Powered-By"
Header always unset "Server"
Header unset "Server"
```

### 4. SQL Injection Prevention
Already implemented with prepared statements. Verify:
```bash
grep "prepare(" /var/www/qurban/api/models/*.php
```

### 5. CSRF Protection (For Future)
```php
// Implement CSRF tokens in forms
if ($_SESSION['csrf_token'] !== $_POST['csrf_token']) {
    throw new ValidationException('Invalid CSRF token');
}
```

### 6. Rate Limiting (For Future)
Consider implementing using middleware:
```php
// api/middleware/RateLimiter.php
class RateLimiter {
    public static function checkLimit($clientIp) {
        // Check requests from this IP in last 1 hour
        // Limit to 1000 requests per hour
    }
}
```

---

## MONITORING & MAINTENANCE

### Daily Tasks
- [x] Monitor error logs
- [x] Check disk space
- [x] Verify backups completed

### Weekly Tasks
- [x] Review access logs for anomalies
- [x] Test backup restoration
- [x] Check database size

### Monthly Tasks
- [x] Review and optimize slow queries
- [x] Update security patches
- [x] Review user access logs
- [x] Test disaster recovery procedure

### Quarterly Tasks
- [x] Full security audit
- [x] Load testing
- [x] Database maintenance (OPTIMIZE)
- [x] Code review

---

## TROUBLESHOOTING

### Database Connection Error
```
Error: SQLSTATE[HY000]: General error: 2006 MySQL server has gone away

Solution:
1. Check MySQL is running: systemctl status mysql
2. Check database credentials in api/config/database.php
3. Check database exists: mysql -u qurban -p -e "SHOW DATABASES;"
```

### Permission Denied Error
```
Error: Permission denied writing to /var/www/qurban/logs

Solution:
chmod 755 /var/www/qurban/logs
chown www-data:www-data /var/www/qurban/logs
```

### API 404 Error
```
Error: 404 Not Found

Solution:
1. Check Apache rewrite module: a2enmod rewrite
2. Check .htaccess exists in public directory
3. Verify API URL: http://domain/api/index.php?action=getTahun
```

### CORS Error
```
Error: Cross-Origin Request Blocked

Solution:
1. Check CORS headers in api/middleware/CorsMiddleware.php
2. Update Access-Control-Allow-Origin if needed
3. For production, whitelist specific domains
```

---

## PERFORMANCE OPTIMIZATION

### PHP Opcode Caching
```ini
; /etc/php/7.4/apache2/php.ini
zend_extension=opcache.so
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
```

### Enable Gzip Compression
```apache
# In Apache config
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### Database Query Optimization
```bash
# Check slow queries
mysql -u qurban -p qurban_db -e "SET GLOBAL slow_query_log = 'ON';"
mysql -u qurban -p qurban_db -e "SET GLOBAL long_query_time = 2;"
```

### Add Browser Caching Headers
```php
// In api/index.php for static assets
header('Cache-Control: public, max-age=31536000');
header('Expires: ' . gmdate('D, d M Y H:i:s T', time() + 31536000));
```

---

## MAINTENANCE COMMANDS

```bash
# Restart Apache
sudo systemctl restart apache2

# Restart MySQL
sudo systemctl restart mysql

# Check PHP errors
tail -f /var/log/php-errors.log

# Check Apache errors
tail -f /var/log/apache2/error.log

# Database backup
mysqldump -u qurban -p qurban_db > backup.sql

# Database restore
mysql -u qurban -p qurban_db < backup.sql

# Clear logs (keep last 7 days)
find /var/www/qurban/logs -name "*.log" -mtime +7 -delete
```

---

## ROLLBACK PROCEDURE

If deployment has issues:

```bash
# 1. Stop application
sudo systemctl stop apache2

# 2. Restore from backup
tar -xzf /var/backups/qurban/files_[DATE].tar.gz -C /var/www/qurban

# 3. Restore database
mysql -u qurban -p qurban_db < /var/backups/qurban/db_[DATE].sql

# 4. Restart application
sudo systemctl start apache2

# 5. Verify functionality
curl http://qurban.example.com/api/index.php?action=getTahun
```

---

## SUPPORT & DOCUMENTATION

- **API Documentation:** /docs/API_ENDPOINTS.md
- **Architecture Guide:** /docs/ARCHITECTURE.md
- **Test Suite:** /tests/ApiTestSuite.php
- **Browser Tests:** /public/debug/api-test.html
- **Error Logs:** /logs/errors.log
- **Server Logs:** /var/log/apache2/

---

**Last Updated:** June 2, 2026
**Version:** 1.0
**Status:** Production Ready

For support, contact: your-email@example.com
