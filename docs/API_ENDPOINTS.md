# API ENDPOINTS DOCUMENTATION

## Base URL
```
http://localhost/Qurban/api/index.php?action=[ACTION_NAME]
```

## Response Format

### Success Response (HTTP 200/201)
```json
{
  "success": true,
  "data": {
    // Requested data or created record ID
  },
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### Error Response (HTTP 400/500)
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field_name": "Field-specific error message"
  }
}
```

---

## ENDPOINT CATEGORIES

### 🔧 UTILITY ENDPOINTS (2)

#### 1. **getTahun** - Get Available Years
- **Method:** GET
- **URL:** `?action=getTahun`
- **Parameters:** None
- **Response:** Array of available years
- **Example:**
```bash
curl "http://localhost/Qurban/api/index.php?action=getTahun"
```

#### 2. **getRTList** - Get RT List for Year
- **Method:** GET
- **URL:** `?action=getRTList`
- **Parameters:**
  - `tahun` (required): Year in format "1447 H / 2026 M"
- **Response:** Array of RT values
- **Example:**
```bash
curl "http://localhost/Qurban/api/index.php?action=getRTList&tahun=1447%20H%20%2F%202026%20M"
```

---

### 🐄 HEWAN ENDPOINTS (4)

#### 1. **getHewan** - Get Livestock List
- **Method:** GET
- **URL:** `?action=getHewan`
- **Parameters:**
  - `tahun` (required): Year
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Records per page (default: 50, max: 100)
  - `jenis` (optional): Filter by animal type
  - `rt` (optional): Filter by RT
- **Response:** Paginated array of livestock records
- **Fields:**
  - `id`, `tahun`, `jenis`, `pemilik`, `rt`, `kotor`, `daging`, `permintaan`, `keterangan`

#### 2. **addHewan** - Add Livestock
- **Method:** POST
- **URL:** `?action=addHewan`
- **Body (JSON):**
```json
{
  "tahun": "1447 H / 2026 M",
  "jenis": "Sapi",
  "pemilik": "Budi Santoso, Ahmad Wijaya",
  "rt": "01",
  "kotor": 400,
  "daging": 320,
  "permintaan": "Optional request",
  "keterangan": "Optional notes"
}
```
- **Response:** Created record with ID

#### 3. **updateHewan** - Update Livestock
- **Method:** POST
- **URL:** `?action=updateHewan`
- **Body (JSON):** Same as addHewan, plus `id` field
- **Response:** Success message

#### 4. **deleteHewan** - Delete Livestock
- **Method:** POST
- **URL:** `?action=deleteHewan`
- **Body (JSON):**
```json
{
  "id": 123
}
```
- **Response:** Success message

---

### 👨‍👩‍👧‍👦 PENERIMA ENDPOINTS (5)

#### 1. **getPenerima** - Get Beneficiaries List
- **Method:** GET
- **URL:** `?action=getPenerima`
- **Parameters:**
  - `tahun` (required): Year
  - `page` (optional): Page number
  - `limit` (optional): Records per page
  - `kategori` (optional): Filter by category
  - `status` (optional): Filter by status
  - `rt` (optional): Filter by RT
- **Response:** Paginated array of beneficiary records
- **Fields:**
  - `id`, `tahun`, `nama`, `kategori`, `rt`, `status`, `panitia_id`, `permintaan`, `keterangan`

#### 2. **addPenerima** - Add Beneficiary
- **Method:** POST
- **URL:** `?action=addPenerima`
- **Body (JSON):**
```json
{
  "tahun": "1447 H / 2026 M",
  "nama": "Keluarga Test",
  "kategori": "Anak Yatim",
  "rt": "01",
  "status": "Belum Diambil",
  "permintaan": "Optional request",
  "panitia_id": null
}
```
- **Categories:** Anak Yatim, Dhuafa, Ibnu Sabil, Riyadh, Pembebasan, Gharim, Muallaf, Sahibul Qurban
- **Status:** Belum Diambil, Sudah Diambil, Selesai

#### 3. **updatePenerima** - Update Beneficiary
- **Method:** POST
- **URL:** `?action=updatePenerima`
- **Body (JSON):** Same as addPenerima, plus `id` field

#### 4. **updateStatusPenerima** - Update Beneficiary Status
- **Method:** POST
- **URL:** `?action=updateStatusPenerima`
- **Body (JSON):**
```json
{
  "id": 123,
  "status": "Sudah Diambil"
}
```

#### 5. **deletePenerima** - Delete Beneficiary
- **Method:** POST
- **URL:** `?action=deletePenerima`
- **Body (JSON):**
```json
{
  "id": 123
}
```

---

### 💰 KEUANGAN ENDPOINTS (4)

#### 1. **getKeuangan** - Get Financial Records
- **Method:** GET
- **URL:** `?action=getKeuangan`
- **Parameters:**
  - `tahun` (required): Year
  - `page` (optional): Page number
  - `limit` (optional): Records per page
  - `jenis` (optional): Filter by type (Pemasukan/Pengeluaran)
- **Response:** Paginated array of financial records
- **Fields:**
  - `id`, `tahun`, `tanggal`, `jenis`, `ekor`, `harga`, `nominal`, `keterangan`

#### 2. **addKeuangan** - Add Financial Record
- **Method:** POST
- **URL:** `?action=addKeuangan`
- **Body (JSON):**
```json
{
  "tahun": "1447 H / 2026 M",
  "tanggal": "2026-06-02",
  "jenis": "Pemasukan",
  "ekor": 1,
  "harga": 5000000,
  "nominal": 5000000,
  "keterangan": "Optional notes"
}
```
- **Jenis:** Pemasukan, Pengeluaran

#### 3. **updateKeuangan** - Update Financial Record
- **Method:** POST
- **URL:** `?action=updateKeuangan`
- **Body (JSON):** Same as addKeuangan, plus `id` field

#### 4. **deleteKeuangan** - Delete Financial Record
- **Method:** POST
- **URL:** `?action=deleteKeuangan`
- **Body (JSON):**
```json
{
  "id": 123
}
```

---

### 👔 PANITIA ENDPOINTS (4)

#### 1. **getPanitia** - Get Committee Members
- **Method:** GET
- **URL:** `?action=getPanitia`
- **Parameters:**
  - `tahun` (required): Year
  - `page` (optional): Page number
  - `limit` (optional): Records per page
- **Response:** Paginated array of committee members
- **Fields:**
  - `id`, `tahun`, `nama`, `peran`, `kontak`

#### 2. **addPanitia** - Add Committee Member
- **Method:** POST
- **URL:** `?action=addPanitia`
- **Body (JSON):**
```json
{
  "tahun": "1447 H / 2026 M",
  "nama": "Test Panitia",
  "peran": "Ketua",
  "kontak": "08123456789"
}
```

#### 3. **updatePanitia** - Update Committee Member
- **Method:** POST
- **URL:** `?action=updatePanitia`
- **Body (JSON):** Same as addPanitia, plus `id` field

#### 4. **deletePanitia** - Delete Committee Member
- **Method:** POST
- **URL:** `?action=deletePanitia`
- **Body (JSON):**
```json
{
  "id": 123
}
```

---

### 📦 DISTRIBUSI ENDPOINTS (3)

#### 1. **getDistribusi** - Get Distributions
- **Method:** GET
- **URL:** `?action=getDistribusi`
- **Parameters:**
  - `tahun` (required): Year
  - `page` (optional): Page number
  - `limit` (optional): Records per page
  - `rt` (optional): Filter by RT
- **Response:** Paginated array of distributions
- **Fields:**
  - `id`, `tahun`, `kategori`, `sumber`, `label`, `rt`, `berat_per_bungkus`, `jumlah_bungkus`, `total_berat`, `hewan_id`, `jumlah_sohibul`, `berat_per_sohibul`

#### 2. **saveDistribusi** - Save Distribution
- **Method:** POST
- **URL:** `?action=saveDistribusi`
- **Body (JSON):**
```json
{
  "tahun": "1447 H / 2026 M",
  "kategori": "Sahibul Qurban",
  "sumber": "Sapi",
  "label": "Distribution label",
  "rt": "01",
  "berat_per_bungkus": 5,
  "jumlah_bungkus": 10,
  "total_berat": 50,
  "hewan_id": 123,
  "jumlah_sohibul": 2,
  "berat_per_sohibul": 25
}
```
- **Kategori:** Sahibul Qurban, Distribusi RT, Distribusi RTM, Wakaf Daging

#### 3. **deleteDistribusi** - Delete Distribution
- **Method:** POST
- **URL:** `?action=deleteDistribusi`
- **Body (JSON):**
```json
{
  "id": 123
}
```

---

### 📊 DASHBOARD & AGGREGATION ENDPOINTS (2)

#### 1. **getDashboard** - Get Dashboard Overview
- **Method:** GET
- **URL:** `?action=getDashboard`
- **Parameters:**
  - `tahun` (required): Year
- **Response:** Aggregated dashboard data
- **Includes:**
  - Total animals, beneficiaries, financial summary
  - Distribution summary
  - RT-wise breakdown

#### 2. **getPerhitungan** - Get Calculation Summary
- **Method:** GET
- **URL:** `?action=getPerhitungan`
- **Parameters:**
  - `tahun` (required): Year
- **Response:** Calculation and distribution summary

---

## STANDARD CONSTANTS

### Animal Types (Jenis)
- Sapi
- Kambing
- Domba

### Beneficiary Categories (Kategori)
- Anak Yatim
- Dhuafa
- Ibnu Sabil
- Riyadh
- Pembebasan
- Gharim
- Muallaf
- Sahibul Qurban

### Beneficiary Status (Status Penerima)
- Belum Diambil
- Sudah Diambil
- Selesai

### Financial Type (Jenis Keuangan)
- Pemasukan
- Pengeluaran

### Distribution Categories (Kategori Distribusi)
- Sahibul Qurban
- Distribusi RT
- Distribusi RTM
- Wakaf Daging

### Distribution Coefficients
- **Sapi:** 0.8 (80% of gross weight)
- **Kambing:** 0.66 (66% of gross weight)
- **Domba:** 0.66 (66% of gross weight)

---

## ERROR CODES & MESSAGES

| HTTP Code | Error | Description |
|-----------|-------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Missing/invalid parameters |
| 404 | Not Found | Endpoint or resource not found |
| 500 | Server Error | Database or server error |

---

## TESTING

### CLI Test Suite
```bash
php tests/ApiTestSuite.php
```

### Browser Test UI
```
http://localhost/Qurban/public/debug/api-test.html
```

---

## AUTHENTICATION & SECURITY

⚠️ **Current Status:** No authentication implemented (local/intranet use)

**For Production:**
- Add API key authentication
- Implement rate limiting
- Add request logging
- Use HTTPS only
- Implement CORS whitelist

---

## PAGINATION

All list endpoints support pagination:
- **page**: Page number (default: 1)
- **limit**: Records per page (default: 50, min: 10, max: 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "totalPages": 20
  }
}
```

---

## BEST PRACTICES

### Request Format
- Use `Content-Type: application/json` for POST requests
- URL-encode parameters in GET requests
- Always include required parameters

### Response Handling
- Check `success` field before processing data
- Handle pagination in list requests
- Implement retry logic for failed requests

### Error Handling
- Always check for error responses
- Log failed requests for debugging
- Display user-friendly error messages

---

**Last Updated:** June 2, 2026
**API Version:** 1.0
**Status:** Production Ready
