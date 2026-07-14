# PROJECT ARCHITECTURE

## Overview

The Qurban Management System is a modular, professional web application built with MVC (Model-View-Controller) architecture. It manages livestock distribution, beneficiary management, and financial tracking for Qurban (Islamic animal sacrifice) activities.

---

## ARCHITECTURE LAYERS

### 1. PRESENTATION LAYER (Frontend)
```
public/ (HTTP accessible)
├── index.html (Main UI)
├── assets/
│   ├── css/style.css (Styling)
│   ├── js/
│   │   ├── main.js (Entry point)
│   │   ├── api-client.js (API wrapper)
│   │   ├── modules/ (Domain-specific logic)
│   │   └── utils/ (Shared utilities)
│   └── images/
└── debug/ (Testing tools)
```

**Responsibilities:**
- HTML structure and UI rendering
- User interaction handling
- Form validation (client-side)
- API request dispatching
- Response display and updates

**Technology:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5

### 2. API LAYER (Backend Gateway)
```
api/index.php (Router)
```

**Responsibilities:**
- Request routing
- CORS middleware
- Error handling
- Response formatting
- Logging & monitoring

**HTTP Methods:**
- GET: Data retrieval
- POST: Create/Update/Delete operations

### 3. BUSINESS LOGIC LAYER (Controllers & Services)
```
api/controllers/ (Request handlers)
├── BaseController.php (Response formatting)
├── HewanController.php
├── PenerimaController.php
├── DistribusiController.php
├── KeuanganController.php
└── PanitiaController.php

api/services/ (Complex calculations)
├── DistribusiService.php
├── ValidationService.php
└── PaginationService.php
```

**Responsibilities:**
- Input validation
- Business logic execution
- Service orchestration
- Error handling

### 4. DATA ACCESS LAYER (Models)
```
api/models/
├── BaseModel.php (Database wrapper)
├── Hewan.php (Livestock)
├── Penerima.php (Beneficiaries)
├── Distribusi.php (Distribution)
├── Keuangan.php (Financial)
└── Panitia.php (Committee)
```

**Responsibilities:**
- Database queries (CRUD)
- Data persistence
- Query optimization
- Transaction handling

### 5. CONFIGURATION LAYER
```
api/config/
├── database.php (PDO setup, schema)
└── constants.php (App config)
```

---

## DATA FLOW

### CREATE OPERATION (Example: Add Livestock)

```
User → HTML Form
   ↓
main.js detects submission
   ↓
api-client.js formats request → POST /api/index.php?action=addHewan
   ↓
api/index.php (Router)
   ↓
HewanController::insert()
   ↓
ValidationService::validate() ✓
   ↓
Hewan::insert() → Database query
   ↓
← JSON Response {success: true, data: {id: 123}}
   ↓
dashboard.js updates UI with toast notification & refresh table
```

### READ OPERATION (Example: List Livestock)

```
User → Clicks "View Livestock"
   ↓
hewan.js loads → api-client.js → GET /api/index.php?action=getHewan
   ↓
HewanController::getAll()
   ↓
Hewan::getAll() → Database query
   ↓
PaginationService::paginate()
   ↓
← JSON Response {success: true, data: [{...}], pagination: {...}}
   ↓
hewan.js renders table with data
```

---

## MODULE STRUCTURE

### Frontend Modules

#### `dashboard.js`
- **Purpose:** Dashboard overview & monitoring
- **Functions:** loadDashboardMetrics(), renderDashboard(), createChart()
- **Dependencies:** api-client, formatters, helpers

#### `hewan.js`
- **Purpose:** Livestock management
- **Functions:** loadHewan(), renderHewanTable(), addHewan(), editHewan(), deleteHewan()
- **Dependencies:** api-client, validators, formatters

#### `penerima.js`
- **Purpose:** Beneficiary management
- **Functions:** loadPenerima(), addPenerima(), updateStatus(), exportPDF()
- **Dependencies:** api-client, validators, formatters

#### `distribusi.js`
- **Purpose:** Distribution calculation & tracking
- **Functions:** calculateDistribution(), saveDistribution(), generateReport()
- **Dependencies:** api-client, formatters, helpers

#### `keuangan.js`
- **Purpose:** Financial tracking
- **Functions:** loadFinancial(), addTransaction(), generateReport()
- **Dependencies:** api-client, formatters, validators

#### `panitia.js`
- **Purpose:** Committee management
- **Functions:** loadPanitia(), addMember(), editMember()
- **Dependencies:** api-client, validators

### Backend Modules

#### Controllers (Request Handlers)

```php
class HewanController extends BaseController {
    public function getAll() { ... }
    public function insert($data) { ... }
    public function update($id, $data) { ... }
    public function delete($id) { ... }
}
```

#### Services (Business Logic)

```php
class DistribusiService {
    public static function calculateBeratBersih($kotor, $jenis, $ekor) { ... }
    public static function countOwners($text) { ... }
}

class ValidationService {
    public static function normalizeOwners($text) { ... }
    public static function validateYear($year) { ... }
}
```

#### Models (Data Access)

```php
class Hewan extends BaseModel {
    public function getAll($tahun, $page, $limit) { ... }
    public function insert($data) { ... }
    public function update($id, $data) { ... }
}
```

---

## DATABASE DESIGN

### Tables

#### `qurban_hewan` (Livestock)
```
id (PK)
tahun (indexed)
jenis (indexed)
pemilik (multiple owners: "Name1, Name2")
rt (indexed)
kotor (gross weight)
daging (net meat weight)
permintaan
keterangan
created_at
```

#### `qurban_penerima` (Beneficiaries)
```
id (PK)
tahun (indexed)
nama
kategori (indexed)
rt (indexed)
status (indexed)
panitia_id (FK)
permintaan
keterangan
created_at
```

#### `qurban_distribusi` (Distribution)
```
id (PK)
tahun (indexed)
kategori
sumber
label
rt (indexed)
berat_per_bungkus
jumlah_bungkus
total_berat
hewan_id (FK)
jumlah_sohibul
berat_per_sohibul
created_at
```

#### `qurban_keuangan` (Financial)
```
id (PK)
tahun (indexed)
tanggal
jenis (indexed)
ekor
harga
nominal
keterangan
created_at
```

#### `qurban_panitia` (Committee)
```
id (PK)
tahun (indexed)
nama
peran
kontak
created_at
```

### Relationships
- Panitia (1) → (N) Penerima
- Hewan (1) → (N) Distribusi

---

## SECURITY ARCHITECTURE

### Current Implementation
- ✅ SQL Injection Prevention (Prepared statements)
- ✅ CORS Middleware (configurable)
- ✅ Error Handling (no stack traces to client)
- ✅ Input Validation (server-side)

### For Production Deployment
- 🔒 Implement API authentication (JWT or OAuth)
- 🔒 Rate limiting
- 🔒 HTTPS only
- 🔒 Request logging & auditing
- 🔒 CORS whitelist specific domains
- 🔒 Input sanitization (additional layer)

---

## PERFORMANCE ARCHITECTURE

### Caching Strategy
```javascript
// Frontend: localStorage cache (3600 seconds)
cache.set('tahun_list', data, 3600);

// Backend: Query optimization
- Indexed columns for frequent filters
- Pagination for large datasets
- Connection pooling (PDO)
```

### Database Optimization
- Indexes on: tahun, jenis, rt, status, kategori
- Pagination: default 50 records per request
- Query limits: prevent N+1 queries

### Frontend Optimization
- Lazy loading of modules
- CDN for vendor libraries (Bootstrap, Chart.js)
- Minification ready
- Asset compression ready

---

## ERROR HANDLING FLOW

```
Exception/Error
    ↓
api/middleware/ErrorHandler catches
    ↓
Log to logs/errors.log
    ↓
Format as JSON response
    ↓
Return to client with appropriate HTTP status
    ↓
Client displays user-friendly message
```

### Error Codes
- `400`: Validation/Bad Request
- `404`: Not Found
- `500`: Server/Database Error

---

## TESTING ARCHITECTURE

### Unit Testing (Backend)
```bash
php tests/ApiTestSuite.php
# Tests all 24 endpoints for CRUD operations
```

### Integration Testing (Browser)
```
http://localhost/Qurban/public/debug/api-test.html
# Interactive test UI with visual feedback
```

### Test Coverage
- All 24 API endpoints
- CRUD operations per entity
- Error handling
- Pagination
- Validation

---

## DEPLOYMENT ARCHITECTURE

### Directory Structure (Production)
```
/var/www/qurban/
├── public/ (DocumentRoot - web accessible)
│   ├── index.html
│   └── assets/
├── api/ (private - not web accessible)
├── config/ (private - sensitive data)
└── logs/ (private - not accessible)
```

### File Permissions
```bash
chmod 755 public/
chmod 644 public/*.html
chmod 644 public/assets/**/*
chmod 755 api/
chmod 700 api/config/
chmod 755 logs/
```

### Environment Variables
```
ENVIRONMENT=production
DEBUG=false
DB_HOST=localhost
DB_NAME=qurban_db
DB_USER=qurban
DB_PASS=secure_password
```

---

## SCALABILITY CONSIDERATIONS

### Current Design Supports
- ✅ Multiple users (concurrent requests)
- ✅ Pagination for large datasets
- ✅ Modular code (easy to extend)
- ✅ Service layer abstraction
- ✅ Database optimization

### Future Enhancements
- 🔄 Caching layer (Redis)
- 🔄 Message queue (for heavy operations)
- 🔄 API versioning (v1, v2, ...)
- 🔄 Microservices architecture
- 🔄 GraphQL API option

---

## MAINTENANCE

### Code Organization
- Each file has single responsibility
- Clear separation of concerns
- Comprehensive comments & docstrings
- Follows PSR-4 standard

### Documentation
- API_ENDPOINTS.md - API reference
- ARCHITECTURE.md - This file
- SETUP_GUIDE.md - Installation guide
- Code comments - Implementation details

### Monitoring
- Error logs in logs/errors.log
- Request logging capability
- Performance metrics ready

---

## TECHNOLOGY STACK

| Component | Technology |
|-----------|-----------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Frontend Framework | Bootstrap 5 |
| Backend | PHP 7.4+ |
| Database | MySQL/MariaDB |
| Server | Apache/XAMPP |
| API Style | RESTful |
| Data Format | JSON |
| Version Control | Git |

---

## MIGRATION PATH (If Scaling)

**Phase 1 (Current):** PHP + MySQL (Single Server)
↓
**Phase 2:** Add caching layer (Redis)
↓
**Phase 3:** Separate API server (if needed)
↓
**Phase 4:** Microservices + API Gateway
↓
**Phase 5:** Kubernetes deployment (if massive scale)

---

**Last Updated:** June 2, 2026
**Architecture Version:** 1.0
**Status:** Production Ready
