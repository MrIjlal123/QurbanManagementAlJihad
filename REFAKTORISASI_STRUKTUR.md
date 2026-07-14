# 🏗️ PANDUAN REFAKTORISASI STRUKTUR PROYEK QURBAN

## PART 1: ANALISIS STRUKTUR SAAT INI

### Struktur Saat Ini (Tidak Terorganisir)
```
Qurban/
├── api.php                 # Monolitik: database, API, business logic
├── index.html              # Monolitik: UI, JavaScript, CSS inline
├── debug_rt.html           # Test file
├── test_endpoint.html      # Test file
├── parse_out.txt
└── tmp_parse.py
```

### Masalah Saat Ini:
❌ **Backend monolitik** - Satu file api.php ~500+ lines  
❌ **Frontend monolitik** - index.html ~3500+ lines  
❌ **Sulit dimaintain** - Perubahan kecil bisa break banyak hal  
❌ **Sulit di-debug** - Logic tercampur di satu file  
❌ **Sulit dikerjakan tim** - Conflict management sulit  
❌ **Tidak scalable** - Tambah fitur = tambah complexity  

---

## PART 2: STRUKTUR FOLDER YANG DIREKOMENDASIKAN

### Struktur Baru (Terorganisir & Professional)
```
Qurban/
│
├── 📁 public/                          # Public entry point
│   ├── index.html                      # Main UI file
│   ├── 📁 assets/
│   │   ├── 📁 css/
│   │   │   ├── style.css               # Custom CSS (extracted from index.html)
│   │   │   └── vendor/                 # Bootstrap, icons, dll
│   │   │
│   │   ├── 📁 js/
│   │   │   ├── main.js                 # Main initialization & app logic
│   │   │   ├── api-client.js           # API communication wrapper
│   │   │   ├── modules/
│   │   │   │   ├── hewan.js            # Hewan module logic
│   │   │   │   ├── penerima.js         # Penerima module logic
│   │   │   │   ├── distribusi.js       # Distribusi module logic
│   │   │   │   ├── keuangan.js         # Keuangan module logic
│   │   │   │   ├── panitia.js          # Panitia module logic
│   │   │   │   └── dashboard.js        # Dashboard module logic
│   │   │   └── utils/
│   │   │       ├── formatters.js       # Format functions (tahun, date, dll)
│   │   │       ├── validators.js       # Input validation
│   │   │       ├── cache.js            # Caching logic
│   │   │       └── helpers.js          # Utility functions
│   │   │
│   │   ├── 📁 images/
│   │   │   └── (logo, icons, dll)
│   │   │
│   │   └── 📁 vendor/                  # Third-party libraries
│   │       └── (Bootstrap, Lucide, dll)
│   │
│   └── 📁 debug/
│       ├── debug_rt.html               # Debug tools
│       └── test_endpoint.html
│
├── 📁 api/                             # Backend API (Core)
│   ├── index.php                       # Single entry point untuk semua API calls
│   │
│   ├── 📁 config/
│   │   ├── database.php                # Database connection
│   │   ├── constants.php               # Global constants
│   │   └── autoload.php                # Autoloader configuration
│   │
│   ├── 📁 controllers/
│   │   ├── BaseController.php          # Base class untuk semua controller
│   │   ├── HewanController.php         # Hewan CRUD & logic
│   │   ├── PenerimaController.php      # Penerima CRUD & logic
│   │   ├── DistribusiController.php    # Distribusi CRUD & logic
│   │   ├── KeuanganController.php      # Keuangan CRUD & logic
│   │   ├── PanitiaController.php       # Panitia CRUD & logic
│   │   ├── DashboardController.php     # Dashboard data aggregation
│   │   └── UtilityController.php       # Utility endpoints (tahun, RT list, dll)
│   │
│   ├── 📁 models/
│   │   ├── BaseModel.php               # Base class untuk database operations
│   │   ├── Hewan.php                   # Hewan model & database operations
│   │   ├── Penerima.php                # Penerima model & database operations
│   │   ├── Distribusi.php              # Distribusi model & database operations
│   │   ├── Keuangan.php                # Keuangan model & database operations
│   │   ├── Panitia.php                 # Panitia model & database operations
│   │   └── DatabaseInitializer.php     # Schema creation & migrations
│   │
│   ├── 📁 services/
│   │   ├── PaginationService.php       # Pagination logic
│   │   ├── ValidationService.php       # Data validation
│   │   ├── DistribusiService.php       # Distribution calculations
│   │   ├── ReportService.php           # Report generation
│   │   └── CacheService.php            # Caching operations
│   │
│   ├── 📁 exceptions/
│   │   ├── ApiException.php            # Custom API exception
│   │   ├── ValidationException.php     # Validation errors
│   │   └── DatabaseException.php       # Database errors
│   │
│   └── 📁 middleware/
│       ├── CorsMiddleware.php          # CORS handling
│       ├── ErrorHandler.php            # Global error handling
│       └── RequestValidator.php        # Request validation
│
├── 📁 docs/                            # Documentation
│   ├── API_ENDPOINTS.md                # API documentation
│   ├── ARCHITECTURE.md                 # Architecture overview
│   ├── SETUP_GUIDE.md                  # Setup instructions
│   └── DATABASE_SCHEMA.md              # Database schema docs
│
├── 📁 tests/                           # Unit tests (optional)
│   ├── HewanControllerTest.php
│   └── DistribusiServiceTest.php
│
├── 📁 migrations/                      # Database migrations (optional)
│   ├── 001_create_initial_schema.sql
│   └── 002_add_indexes.sql
│
├── .htaccess                           # Apache routing configuration
├── .gitignore                          # Git ignore rules
├── README.md                           # Project overview
│
└── OLD_BACKUP/                         # Backup dari struktur lama (untuk reference)
    ├── api.php                         # Old monolithic API
    └── index.html                      # Old monolithic frontend
```

---

## PART 3: DESKRIPSI SETIAP FOLDER

### 📁 `/public`
**Fungsi:** Folder yang dapat diakses publik melalui browser  
**Berisi:** Frontend files, assets, entry point HTML  
**Akses:** Langsung dari browser (`http://localhost/Qurban/public/`)  

### 📁 `/public/assets`
**Sub-folders:**
- `css/` - Stylesheet (extracted dari inline CSS)
- `js/` - JavaScript files (modular & organized)
- `images/` - Images & icons
- `vendor/` - Third-party CSS/JS (Bootstrap, Lucide icons, dll)

### 📁 `/api`
**Fungsi:** Backend API - semua business logic & database operations  
**Berisi:** Controllers, Models, Services, Configuration  
**Akses:** TIDAK diakses langsung, hanya via AJAX dari frontend  

### 📁 `/api/config`
**Fungsi:** Konfigurasi global aplikasi  
- `database.php` - Connection string, credentials
- `constants.php` - Global constants (CACHE_TTL, APP_NAME, dll)
- `autoload.php` - Class autoloading (PSR-4 standard)

### 📁 `/api/controllers`
**Fungsi:** Menerima request dari frontend, validate, delegate ke models/services  
**Pattern:** Setiap entity punya 1 controller (HewanController.php, dll)  
**Responsibility:** 
- Validate input
- Call appropriate model/service
- Return JSON response

### 📁 `/api/models`
**Fungsi:** Database operations & data persistence  
**Pattern:** Setiap entity punya 1 model (Hewan.php, dll)  
**Responsibility:**
- SELECT, INSERT, UPDATE, DELETE queries
- Data mapping (DB row ↔ PHP array)
- Basic validation before DB ops

### 📁 `/api/services`
**Fungsi:** Business logic & complex calculations  
**Berisi:** 
- PaginationService - Page management
- ValidationService - Business rule validation
- DistribusiService - Distribution calculations
- ReportService - Report generation

### 📁 `/api/middleware`
**Fungsi:** Request preprocessing & postprocessing  
**Berisi:**
- CORS handling
- Global error handling
- Request validation

---

## PART 4: FLOW APLIKASI BARU

```
USER INTERACTION (Browser)
    ↓
public/index.html
    ↓
public/assets/js/main.js
    ↓
public/assets/js/modules/[modul].js (hewan.js, penerima.js, dll)
    ↓
public/assets/js/api-client.js (wrapper untuk fetch)
    ↓
fetch() → api/index.php?action=... (AJAX Request)
    ↓
api/index.php (Router)
    ↓
Route ke Controller yang sesuai
    ↓
[Controller]Controller.php
    ↓
Validate input → Call Model/Service
    ↓
[Model].php / [Service].php
    ↓
Query Database / Process Logic
    ↓
Return result ke Controller
    ↓
Controller → JSON Response
    ↓
AJAX Response di Browser
    ↓
public/assets/js/modules/[modul].js
    ↓
Update UI / Render hasil
    ↓
USER SEES RESULT
```

---

## PART 5: MIGRASI STEP-BY-STEP

### Phase 1: Backup & Planning (Day 1)
```bash
# 1. Create backup dari struktur lama
mkdir OLD_BACKUP
cp api.php OLD_BACKUP/
cp index.html OLD_BACKUP/

# 2. Buat struktur folder baru
mkdir -p public/assets/css
mkdir -p public/assets/js/modules
mkdir -p public/assets/js/utils
mkdir -p public/assets/vendor
mkdir -p public/assets/images
mkdir -p api/config
mkdir -p api/controllers
mkdir -p api/models
mkdir -p api/services
mkdir -p api/exceptions
mkdir -p api/middleware
mkdir -p docs
```

### Phase 2: Extract Frontend (Day 2-3)
```
1. Create public/assets/css/style.css
   - Extract all CSS dari index.html <style> tag
   - Tambah Bootstrap CDN link ke index.html <head>

2. Create public/assets/js/utils/formatters.js
   - Move formatYearDisplay()
   - Move formatOwnersForExport()
   - dll

3. Create public/assets/js/utils/validators.js
   - Move validateYearOrFail()
   - Move input validation logic
   - dll

4. Create public/assets/js/utils/cache.js
   - Move cacheSet(), cacheGet(), cacheDelete()
   - CACHE_TTL constant

5. Create public/assets/js/utils/helpers.js
   - Utility functions (parseOwnerNames, normalizeOwners, dll)

6. Create public/assets/js/api-client.js
   - Wrapper untuk semua fetch() calls
   - Centralized API communication

7. Create public/assets/js/main.js
   - Initialize aplikasi
   - Load modules
   - Setup event listeners
```

### Phase 3: Extract Backend (Day 4-5)
```
1. Create api/config/database.php
   - Move PDO connection logic dari api.php
   - Return $pdo object

2. Create api/config/constants.php
   - Global constants (CACHE_TTL, etc)

3. Create api/models/BaseModel.php
   - Base class untuk semua models
   - Shared database methods

4. Create api/models/Hewan.php
   - Move Hewan table operations dari api.php
   - Methods: getAll(), getById(), insert(), update(), delete()

5. Create api/models/Penerima.php
   - Move Penerima table operations

6. Create api/controllers/BaseController.php
   - Base class untuk controllers
   - Shared response formatting

7. Create api/controllers/HewanController.php
   - Move Hewan case statements dari api.php
   - Methods correspond to API actions

8. Create api/controllers/DistribusiController.php
   - Move Distribusi case statements

9. Create api/services/DistribusiService.php
   - Move distribution calculation logic
   - Reusable untuk controllers

10. Create api/index.php (Router)
    - Replace old api.php
    - Route actions ke controllers
```

### Phase 4: Update References (Day 6)
```
1. Update index.html
   - Change script sources ke /public/assets/js/main.js
   - Change fetch() calls ke new API format

2. Update api/index.php
   - All endpoints now route through controllers

3. Test semua functionality
   - API endpoints
   - Frontend UI
   - Database operations
```

### Phase 5: Cleanup & Testing (Day 7)
```
1. Remove old debug/test files
2. Update documentation
3. Final testing
4. Deploy
```

---

## PART 6: CONTOH IMPLEMENTASI

### Contoh 1: api/index.php (Router Baru)
```php
<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/constants.php';

// Autoload controllers & models
spl_autoload_register(function ($class) {
    $file = __DIR__ . '/controllers/' . $class . '.php';
    if (file_exists($file)) require $file;
    
    $file = __DIR__ . '/models/' . $class . '.php';
    if (file_exists($file)) require $file;
    
    $file = __DIR__ . '/services/' . $class . '.php';
    if (file_exists($file)) require $file;
});

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($action) {
        case 'getHewan':
            $controller = new HewanController();
            echo $controller->getAll();
            break;
            
        case 'addHewan':
            $controller = new HewanController();
            echo $controller->create($input);
            break;
            
        case 'updateHewan':
            $controller = new HewanController();
            echo $controller->update($input);
            break;
            
        // ... lebih banyak routes
        
        default:
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Action not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
```

### Contoh 2: api/controllers/HewanController.php
```php
<?php
class HewanController extends BaseController {
    private $model;
    
    public function __construct() {
        global $pdo;
        $this->model = new Hewan($pdo);
    }
    
    public function getAll() {
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(10, intval($_GET['limit'] ?? 50)));
        
        $data = $this->model->getAll($page, $limit);
        
        return $this->respondSuccess($data);
    }
    
    public function create($input) {
        // Validate input
        if (empty($input['jenis'])) {
            return $this->respondError('Jenis hewan harus diisi');
        }
        
        // Call model
        $result = $this->model->insert($input);
        
        return $this->respondSuccess($result);
    }
}
?>
```

### Contoh 3: api/models/Hewan.php
```php
<?php
class Hewan extends BaseModel {
    private $table = 'qurban_hewan';
    
    public function getAll($page = 1, $limit = 50) {
        $offset = ($page - 1) * $limit;
        
        $query = "SELECT * FROM {$this->table} LIMIT :limit OFFSET :offset";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute(['limit' => $limit, 'offset' => $offset]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function insert($data) {
        $query = "INSERT INTO {$this->table} (tahun, jenis, pemilik, rt) 
                  VALUES (?, ?, ?, ?)";
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([
            $data['tahun'] ?? '',
            $data['jenis'] ?? '',
            $data['pemilik'] ?? '',
            $data['rt'] ?? ''
        ]);
        
        return ['id' => $this->pdo->lastInsertId()];
    }
}
?>
```

### Contoh 4: public/assets/js/api-client.js
```javascript
// API Client wrapper
const ApiClient = {
    baseUrl: '../../api/index.php',
    
    async request(action, method = 'GET', data = null) {
        const url = `${this.baseUrl}?action=${action}`;
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (method !== 'GET' && data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        return response.json();
    },
    
    async getHewan(page = 1, limit = 50) {
        return this.request(`getHewan?page=${page}&limit=${limit}`);
    },
    
    async addHewan(data) {
        return this.request('addHewan', 'POST', data);
    }
};

// Usage di module
async function loadHewan() {
    const result = await ApiClient.getHewan();
    if (result.success) {
        // render UI
    }
}
```

---

## PART 7: KEUNTUNGAN STRUKTUR BARU

### 🎯 Untuk Development
✅ **Modular** - Setiap module bisa dikerjakan terpisah  
✅ **Reusable** - Logic bisa dipake di berbagai tempat  
✅ **Testable** - Setiap komponen bisa di-test sendiri  
✅ **Debuggable** - Error lebih mudah di-trace  

### 🚀 Untuk Performance
✅ **Lazy loading** - JS modules di-load hanya saat dibutuhkan  
✅ **Caching** - Service layer bisa implementasi smart caching  
✅ **Pagination** - Terstruktur di service layer  

### 📈 Untuk Scalability
✅ **Mudah add fitur** - Tinggal buat controller & model baru  
✅ **Mudah refactor** - Change logic di satu tempat saja  
✅ **Team ready** - Banyak developer bisa work parallel  
✅ **Future migration** - Mudah migrate ke framework (Laravel, Slim, dll)

### 🛡️ Untuk Maintenance
✅ **Documented** - Setiap file punya clear responsibility  
✅ **Standardized** - Follow MVC pattern yang dikenal  
✅ **Version control friendly** - Small files = less conflicts  
✅ **Easy onboarding** - Developer baru cepat understand struktur  

### 🔒 Untuk Security
✅ **Validation layer** - Centralized input validation  
✅ **Middleware** - Global error handling & logging  
✅ **Separation** - Backend logic terpisah dari frontend  

---

## PART 8: BEST PRACTICES SETELAH REFACTOR

### 1. API Response Format (Standardized)
```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "totalPages": 20
  }
}
```

### 2. Error Handling
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "tahun": "Tahun harus diisi",
    "jenis": "Jenis harus dipilih"
  }
}
```

### 3. Naming Conventions
- **Classes**: PascalCase (HewanController, Penerima)
- **Functions**: camelCase (getWargaCount, calculateDistribution)
- **Files**: Same as class name (HewanController.php)
- **Variables**: camelCase (beratPerBungkus, jumlahWarga)
- **Constants**: UPPER_SNAKE_CASE (CACHE_TTL, APP_NAME)

### 4. Code Organization
- 1 class per file
- Max 300 lines per file (untuk readability)
- Add docstring ke public methods
- Use type hints (PHP 7.4+)

---

## PART 9: DEPLOYMENT CONSIDERATIONS

### Before Deploy:
```bash
# 1. Set proper permissions
chmod 755 public/
chmod 644 public/index.html
chmod 755 api/

# 2. Update .htaccess untuk routing
# 3. Set database credentials di api/config/database.php
# 4. Test all endpoints
# 5. Minify CSS/JS (optional)
```

### Directory Structure for Production:
```
/var/www/qurban/
├── public/          # DocumentRoot
├── api/             # Outside public (safer)
└── config/          # Outside public (credentials)
```

---

## PART 10: MIGRATION CHECKLIST

- [ ] Create folder structure
- [ ] Extract CSS ke `public/assets/css/style.css`
- [ ] Extract JS utils
- [ ] Create api-client wrapper
- [ ] Create BaseController & BaseModel
- [ ] Extract each controller
- [ ] Extract each model
- [ ] Extract services
- [ ] Create api/index.php router
- [ ] Update public/index.html paths
- [ ] Test all features
- [ ] Update documentation
- [ ] Backup old files
- [ ] Deploy

---

## Next Steps:

1. **Review** proposal ini
2. **Decide** mau implement full refactor atau gradual
3. **Let me know** kalo ready untuk start migration

Mari kita mulai dari Phase 1 dulu? 🚀

