<?php
/**
 * Application Constants Configuration
 * 
 * Centralized definitions for all application-wide constants,
 * calculation coefficients, and configuration values.
 */

namespace Qurban\Config;

// Application Information
const APP_NAME = 'Qurban Management System';
const APP_VERSION = '1.0.0';

// Cache Configuration
const CACHE_TTL = 3600; // Cache Time-To-Live in seconds (1 hour)

// Year/Date Format
const YEAR_FORMAT_PATTERN = '/^\d{4} H \/ \d{4} M$/';
const STANDARD_YEAR_FORMAT = '1447 H / 2026 M';

// Animal Types
const ANIMAL_TYPE_SAPI = 'SAPI';
const ANIMAL_TYPE_KAMBING = 'KAMBING';
const ANIMAL_TYPE_DOMBA = 'DOMBA';

// Animal Ownership Limits
const SAPI_MIN_OWNERS = 1;
const SAPI_MAX_OWNERS = 7;
const KAMBING_EXACT_OWNERS = 1;
const DOMBA_EXACT_OWNERS = 1;

// Distribution Calculation Coefficients
const COEFFICIENT_SAPI = 0.8;      // Sapi coefficient: 80% of gross weight
const COEFFICIENT_KAMBING = 0.66;  // Kambing coefficient: 66% of gross weight

// Beneficiary Categories
const CATEGORY_WARGA = 'Warga';
const CATEGORY_PANITIA = 'Panitia';
const CATEGORY_YATIM = 'Yatim';
const CATEGORY_LANSIA = 'Lansia';
const CATEGORY_FAKIR = 'Fakir';
const CATEGORY_MISKIN = 'Miskin';

// Beneficiary Status
const STATUS_BELUM_DIAMBIL = 'Belum Diambil';
const STATUS_SUDAH_DIAMBIL = 'Sudah Diambil';

// Pagination Settings
const PAGINATION_DEFAULT_LIMIT = 50;
const PAGINATION_MIN_LIMIT = 10;
const PAGINATION_MAX_LIMIT = 100;
const PAGINATION_DEFAULT_PAGE = 1;

// Distribution Categories
const DISTRIBUTION_CATEGORY_PANITIA = 'Panitia';
const DISTRIBUTION_CATEGORY_WARGA = 'Warga';
const DISTRIBUTION_CATEGORY_YATIM = 'Yatim';

// Financial Record Types
const FINANCIAL_TYPE_PEMASUKAN = 'Pemasukan';
const FINANCIAL_TYPE_PENGELUARAN = 'Pengeluaran';

// Committee Roles
const PANITIA_ROLE_KOORDINATOR = 'Koordinator';
const PANITIA_ROLE_WAKIL = 'Wakil Koordinator';
const PANITIA_ROLE_BENDAHARA = 'Bendahara';
const PANITIA_ROLE_SEKRETARIS = 'Sekretaris';
const PANITIA_ROLE_ANGGOTA = 'Anggota';

// API Response Messages
const RESPONSE_SUCCESS = 'Operasi berhasil';
const RESPONSE_ERROR_INVALID_INPUT = 'Input tidak valid';
const RESPONSE_ERROR_NOT_FOUND = 'Data tidak ditemukan';
const RESPONSE_ERROR_DATABASE = 'Kesalahan database';
const RESPONSE_ERROR_UNAUTHORIZED = 'Tidak diotorisasi';

// HTTP Status Codes
const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_ERROR = 500;

// Validation Rules
const MIN_LENGTH_NAME = 3;
const MAX_LENGTH_NAME = 255;
const MIN_LENGTH_KETERANGAN = 0;
const MAX_LENGTH_KETERANGAN = 1000;

// Default Values
const DEFAULT_RT_VALUE = '-';
const DEFAULT_PERMINTAAN_VALUE = '-';
const DEFAULT_KETERANGAN_VALUE = '';

// Database Settings
const DB_CONNECTION_TIMEOUT = 5;
const DB_CHARSET = 'utf8mb4';

/**
 * Get all available animal types
 * 
 * @return array List of animal types
 */
function getAnimalTypes(): array
{
    return [
        self::ANIMAL_TYPE_SAPI,
        self::ANIMAL_TYPE_KAMBING,
        self::ANIMAL_TYPE_DOMBA
    ];
}

/**
 * Get all available beneficiary categories
 * 
 * @return array List of categories
 */
function getBeneficiaryCategories(): array
{
    return [
        self::CATEGORY_WARGA,
        self::CATEGORY_PANITIA,
        self::CATEGORY_YATIM,
        self::CATEGORY_LANSIA,
        self::CATEGORY_FAKIR,
        self::CATEGORY_MISKIN
    ];
}

/**
 * Get all available status values
 * 
 * @return array List of status values
 */
function getStatusValues(): array
{
    return [
        self::STATUS_BELUM_DIAMBIL,
        self::STATUS_SUDAH_DIAMBIL
    ];
}

/**
 * Get all available committee roles
 * 
 * @return array List of roles
 */
function getPanitiaRoles(): array
{
    return [
        self::PANITIA_ROLE_KOORDINATOR,
        self::PANITIA_ROLE_WAKIL,
        self::PANITIA_ROLE_BENDAHARA,
        self::PANITIA_ROLE_SEKRETARIS,
        self::PANITIA_ROLE_ANGGOTA
    ];
}

/**
 * Get distribution coefficient for animal type
 * 
 * @param string $animalType The animal type
 * @return float Distribution coefficient
 */
function getDistributionCoefficient(string $animalType): float
{
    $type = strtoupper(trim($animalType));
    
    if (strpos($type, 'SAPI') !== false) {
        return self::COEFFICIENT_SAPI;
    }
    
    if (strpos($type, 'KAMBING') !== false || strpos($type, 'DOMBA') !== false) {
        return self::COEFFICIENT_KAMBING;
    }
    
    return 1.0; // Default coefficient
}
