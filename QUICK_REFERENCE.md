# 🚀 QUICK REFERENCE - DEVELOPER GUIDE

## Project: Qurban Management System v1.0
**Status:** ✅ Production Ready  
**Last Updated:** June 2, 2026  

---

## 📍 QUICK LINKS

### Documentation
- **API Reference:** [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md)
- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Deployment:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Full Checklist:** [docs/PRODUCTION_READINESS_CHECKLIST.md](docs/PRODUCTION_READINESS_CHECKLIST.md)
- **File Listing:** [FILE_LISTING.md](FILE_LISTING.md)

### Testing
- **Browser Test:** http://localhost/Qurban/public/debug/api-test.html
- **CLI Test:** `php tests/ApiTestSuite.php`

### Development
- **Frontend Entry:** `public/assets/js/main.js`
- **API Router:** `api/index.php`
- **Database Config:** `api/config/database.php`

---

## 🛠️ LOCAL SETUP (XAMPP)

### 1. Prerequisites
```bash
# XAMPP installed with PHP 7.4+ and MySQL
# Files located at: C:\xampp\htdocs\Qurban\
```

### 2. Start Services
```bash
# Start XAMPP Control Panel
# Enable Apache and MySQL
```

### 3. Access Application
```
Frontend: http://localhost/Qurban/public/index.html
API Direct: http://localhost/Qurban/api/index.php?action=getTahun
Test UI: http://localhost/Qurban/public/debug/api-test.html
```

### 4. Database
- Auto-created on first API call
- Tables: qurban_hewan, qurban_penerima, qurban_distribusi, qurban_keuangan, qurban_panitia
- No manual setup required

---

## 📊 API ENDPOINTS (24 Total)

### Utility (2)
```
GET  /api/index.php?action=getTahun         → Get available years
GET  /api/index.php?action=getRTList        → Get RT (neighborhood) list
```

### Livestock - Hewan (4)
```
GET  /api/index.php?action=getHewan         → Get all livestock
POST /api/index.php?action=addHewan         → Add new animal
PUT  /api/index.php?action=updateHewan      → Update animal
DEL  /api/index.php?action=deleteHewan      → Delete animal
```

### Beneficiary - Penerima (5)
```
GET  /api/index.php?action=getPenerima      → Get beneficiaries
POST /api/index.php?action=addPenerima      → Add beneficiary
PUT  /api/index.php?action=updatePenerima   → Update beneficiary
PUT  /api/index.php?action=updateStatusPenerima → Change status
DEL  /api/index.php?action=deletePenerima   → Delete beneficiary
```

### Distribution - Distribusi (3)
```
GET  /api/index.php?action=getDistribusi    → Get distributions
POST /api/index.php?action=saveDistribusi   → Calculate & save distribution
DEL  /api/index.php?action=deleteDistribusi → Delete distribution
```

### Financial - Keuangan (4)
```
GET  /api/index.php?action=getKeuangan      → Get financial records
POST /api/index.php?action=addKeuangan      → Add transaction
PUT  /api/index.php?action=updateKeuangan   → Update transaction
DEL  /api/index.php?action=deleteKeuangan   → Delete transaction
```

### Committee - Panitia (4)
```
GET  /api/index.php?action=getPanitia       → Get committee members
POST /api/index.php?action=addPanitia       → Add member
PUT  /api/index.php?action=updatePanitia    → Update member
DEL  /api/index.php?action=deletePanitia    → Delete member
```

### Dashboard (2)
```
GET  /api/index.php?action=getDashboard     → Get dashboard metrics
GET  /api/index.php?action=getPerhitungan   → Get calculation details
```

---

## 📁 PROJECT STRUCTURE

```
api/                          ← Backend API
├── index.php                 ← Main router (entry point)
├── config/
│   ├── database.php          ← Database initialization
│   └── constants.php         ← Global constants
├── controllers/              ← Request handlers
│   ├── BaseController.php
│   ├── HewanController.php
│   ├── PenerimaController.php
│   ├── DistribusiController.php
│   ├── KeuanganController.php
│   └── PanitiaController.php
├── models/                   ← Data access layer
│   ├── BaseModel.php
│   ├── Hewan.php
│   ├── Penerima.php
│   ├── Distribusi.php
│   ├── Keuangan.php
│   └── Panitia.php
├── services/                 ← Business logic
│   ├── ValidationService.php
│   ├── PaginationService.php
│   └── DistribusiService.php
├── middleware/               ← Request processing
│   ├── CorsMiddleware.php
│   └── ErrorHandler.php
└── exceptions/               ← Custom exceptions
    ├── ApiException.php
    ├── ValidationException.php
    └── DatabaseException.php

public/                       ← Frontend (HTTP accessible)
├── index.html               ← Main UI
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── main.js          ← Entry point
│   │   ├── api-client.js    ← API wrapper
│   │   ├── modules/         ← Domain logic
│   │   │   ├── dashboard.js
│   │   │   ├── hewan.js
│   │   │   ├── penerima.js
│   │   │   ├── distribusi.js
│   │   │   ├── keuangan.js
│   │   │   └── panitia.js
│   │   └── utils/           ← Utilities
│   │       ├── cache.js
│   │       ├── formatters.js
│   │       ├── validators.js
│   │       └── helpers.js
│   └── images/
└── debug/
    └── api-test.html        ← Test UI

tests/
└── ApiTestSuite.php         ← CLI test suite

docs/                        ← Documentation
├── API_ENDPOINTS.md
├── ARCHITECTURE.md
├── DEPLOYMENT.md
└── PRODUCTION_READINESS_CHECKLIST.md
```

---

## 🔑 KEY CONCEPTS

### Response Format
```json
{
  "success": true,
  "data": { /* Results */ },
  "message": "Success message",
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

### Database Tables
```sql
qurban_hewan          -- Livestock records
qurban_penerima       -- Beneficiary records
qurban_distribusi     -- Distribution records
qurban_keuangan       -- Financial records
qurban_panitia        -- Committee records
```

### Important Constants
```php
// Animal types
HEWAN_JENIS_KAMBING = 'kambing'
HEWAN_JENIS_SAPI = 'sapi'
HEWAN_JENIS_KERBAU = 'kerbau'

// Coefficients
HEWAN_KOEFISIEN_KAMBING = 1
HEWAN_KOEFISIEN_SAPI = 2.5
HEWAN_KOEFISIEN_KERBAU = 2.5

// Years format: "1447 H / 2026 M"
```

---

## 🧪 TESTING

### Run All Tests (Browser)
1. Navigate to: http://localhost/Qurban/public/debug/api-test.html
2. Click "Run All Tests"
3. View results and status

### Run All Tests (CLI)
```bash
cd C:\xampp\htdocs\Qurban
php tests/ApiTestSuite.php
```

### Expected Output
```
✓ Utility Tests: 2/2 passed
✓ Hewan Tests: 4/4 passed
✓ Penerima Tests: 5/5 passed
✓ Keuangan Tests: 4/4 passed
✓ Panitia Tests: 4/4 passed
✓ Distribusi Tests: 3/3 passed
✓ Dashboard Tests: 2/2 passed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 24/24 passed (100%)
```

---

## 🔒 SECURITY

### Implemented
- ✅ SQL Injection Prevention (prepared statements)
- ✅ CORS Middleware (configurable)
- ✅ Input Validation (server-side)
- ✅ Error Handling (no stack traces to client)
- ✅ Request Logging (when enabled)

### Best Practices
1. Always use prepared statements
2. Validate input server-side
3. Log errors securely
4. Use HTTPS in production
5. Update dependencies regularly

---

## 🚀 DEPLOYMENT

### Linux Server
```bash
# 1. Upload files to /var/www/qurban/
scp -r /path/to/Qurban/* user@server:/var/www/qurban/

# 2. Set permissions
chmod -R 755 /var/www/qurban/public/
chmod -R 755 /var/www/qurban/api/
mkdir -p /var/www/qurban/logs
chmod 755 /var/www/qurban/logs/

# 3. Create database
mysql -u root -p < docs/database.sql

# 4. Update database config
nano /var/www/qurban/api/config/database.php

# 5. Configure Apache
# Add virtual host for the domain
```

### Verification
```bash
# Test API
curl http://localhost/api/index.php?action=getTahun

# Run tests
php tests/ApiTestSuite.php

# Check logs
tail -f logs/errors.log
```

---

## 📝 COMMON TASKS

### Add New Endpoint
1. Create method in controller
2. Add routing in `api/index.php`
3. Add to `docs/API_ENDPOINTS.md`
4. Add test in `tests/ApiTestSuite.php`

### Add Database Column
1. Update model class
2. Add migration in `api/config/database.php`
3. Update relevant controller
4. Test with API

### Debug API Call
1. Check browser console (F12 → Network tab)
2. View request/response details
3. Check server logs: `logs/errors.log`
4. Run specific test in browser test UI

---

## 📞 COMMON ISSUES

### Database Connection Error
```
Solution: Check api/config/database.php settings
- Verify host, user, password
- Ensure MySQL is running
- Check database character set (UTF-8)
```

### CORS Error
```
Solution: CorsMiddleware not called
- Check api/index.php for middleware initialization
- Verify request origin is allowed
- Check browser console for specific error
```

### API Not Responding
```
Solution:
1. Check if Apache/PHP running
2. Verify files uploaded correctly
3. Check PHP error log
4. Try accessing api/index.php?action=getTahun
```

### Frontend Not Loading
```
Solution:
1. Check browser console for errors
2. Verify all JS files loaded (Network tab)
3. Check file paths in index.html
4. Clear browser cache
```

---

## 📚 RESOURCES

### Documentation
- Full Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Deployment Guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- API Reference: [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md)
- File Listing: [FILE_LISTING.md](FILE_LISTING.md)

### External Links
- PHP: https://www.php.net/manual/
- Bootstrap 5: https://getbootstrap.com/
- MySQL/PDO: https://www.php.net/manual/en/pdo.php
- JavaScript ES6+: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/

---

## ✅ FINAL CHECKLIST

Before deploying:
- [x] All files in place
- [x] Database auto-setup verified
- [x] API endpoints tested (24/24)
- [x] Frontend loads correctly
- [x] Security hardened
- [x] Documentation complete
- [x] Error logging configured
- [x] CORS configured

**Status:** ✅ Ready for Production

---

**Last Updated:** June 2, 2026  
**Version:** 1.0  
**Status:** Production Ready

For questions or issues, refer to the comprehensive documentation in the `docs/` folder.
