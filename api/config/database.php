<?php
/**
 * Database Configuration and Initialization
 * 
 * Handles PDO connection setup, database and table creation,
 * schema migrations, and indexing for the Qurban application.
 */

namespace Qurban\Config;

use PDO;
use PDOException;

/**
 * Database connection configuration
 */
const DB_HOST = 'localhost';
const DB_NAME = 'qurban_db';
const DB_USER = 'root';
const DB_PASS = '';

/**
 * Initialize database connection and setup tables
 * 
 * @return PDO Database connection instance
 * @throws PDOException If connection fails
 */
function initializeDatabase(): PDO
{
    try {
        // Initial connection to MySQL server (without database selection)
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ]
        );

        // Create database if not exists
        $pdo->exec(
            "CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` 
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );

        // Select the database
        $pdo->exec("USE `" . DB_NAME . "`");

        // Create all tables
        createTables($pdo);

        // Add missing columns (migrations)
        runMigrations($pdo);

        // Create indexes for performance
        createIndexes($pdo);

        // Standardize year format across all tables
        synchronizeYearFormat($pdo);

        return $pdo;

    } catch (PDOException $e) {
        throw new PDOException("Database Connection Error: " . $e->getMessage());
    }
}

/**
 * Create all required tables
 * 
 * @param PDO $pdo Database connection
 */
function createTables(PDO $pdo): void
{
    // Table: Keuangan (Financial Records)
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS qurban_keuangan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tahun VARCHAR(64),
            tanggal DATE,
            jenis VARCHAR(32),
            ekor DECIMAL(10,2),
            harga DECIMAL(15,2),
            keterangan TEXT,
            nominal DECIMAL(18,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB"
    );

    // Table: Hewan (Animal/Livestock Records)
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS qurban_hewan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tahun VARCHAR(64),
            jenis VARCHAR(32),
            pemilik VARCHAR(255),
            rt VARCHAR(10),
            permintaan TEXT,
            kotor DECIMAL(10,2),
            daging DECIMAL(10,2),
            keterangan TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB"
    );

    // Table: Penerima (Beneficiary Records)
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS qurban_penerima (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tahun VARCHAR(64),
            nama VARCHAR(255),
            kategori VARCHAR(32),
            rt VARCHAR(10),
            status VARCHAR(32) DEFAULT 'Belum Diambil',
            panitia_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB"
    );

    // Table: Panitia (Committee Members)
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS qurban_panitia (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tahun VARCHAR(64),
            nama VARCHAR(255),
            peran VARCHAR(64),
            kontak VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB"
    );

    // Table: Distribusi (Distribution/Allocation Records)
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS qurban_distribusi (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tahun VARCHAR(64),
            kategori VARCHAR(64),
            sumber VARCHAR(64),
            label VARCHAR(255),
            rt VARCHAR(10),
            berat_per_bungkus DECIMAL(10,2),
            jumlah_bungkus INT,
            total_berat DECIMAL(14,2),
            hewan_id INT NULL,
            jumlah_sohibul INT DEFAULT 1,
            berat_per_sohibul DECIMAL(10,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB"
    );
}

/**
 * Run database schema migrations
 * Adds missing columns to existing tables
 * 
 * @param PDO $pdo Database connection
 */
function runMigrations(PDO $pdo): void
{
    // Migration: Add permintaan column to qurban_penerima
    $columns = $pdo->query(
        "SHOW COLUMNS FROM qurban_penerima LIKE 'permintaan'"
    )->fetchAll();
    
    if (empty($columns)) {
        $pdo->exec("ALTER TABLE qurban_penerima ADD COLUMN permintaan TEXT");
    }

    // Migration: Add panitia_id column to qurban_penerima
    $columns = $pdo->query(
        "SHOW COLUMNS FROM qurban_penerima LIKE 'panitia_id'"
    )->fetchAll();
    
    if (empty($columns)) {
        $pdo->exec("ALTER TABLE qurban_penerima ADD COLUMN panitia_id INT NULL");
    }

    // Migration: Add tahun column to qurban_distribusi
    $columns = $pdo->query(
        "SHOW COLUMNS FROM qurban_distribusi LIKE 'tahun'"
    )->fetchAll();
    
    if (empty($columns)) {
        $pdo->exec("ALTER TABLE qurban_distribusi ADD COLUMN tahun VARCHAR(64) AFTER id");
    }

    // Migration: Add hewan_id column to qurban_distribusi
    $columns = $pdo->query(
        "SHOW COLUMNS FROM qurban_distribusi LIKE 'hewan_id'"
    )->fetchAll();
    
    if (empty($columns)) {
        $pdo->exec("ALTER TABLE qurban_distribusi ADD COLUMN hewan_id INT NULL");
    }

    // Migration: Add jumlah_sohibul column to qurban_distribusi
    $columns = $pdo->query(
        "SHOW COLUMNS FROM qurban_distribusi LIKE 'jumlah_sohibul'"
    )->fetchAll();
    
    if (empty($columns)) {
        $pdo->exec("ALTER TABLE qurban_distribusi ADD COLUMN jumlah_sohibul INT DEFAULT 1");
    }

    // Migration: Add berat_per_sohibul column to qurban_distribusi
    $columns = $pdo->query(
        "SHOW COLUMNS FROM qurban_distribusi LIKE 'berat_per_sohibul'"
    )->fetchAll();
    
    if (empty($columns)) {
        $pdo->exec("ALTER TABLE qurban_distribusi ADD COLUMN berat_per_sohibul DECIMAL(10,2)");
    }

    // Migration: Add rt column to qurban_hewan
    $columns = $pdo->query(
        "SHOW COLUMNS FROM qurban_hewan LIKE 'rt'"
    )->fetchAll();
    
    if (empty($columns)) {
        $pdo->exec("ALTER TABLE qurban_hewan ADD COLUMN rt VARCHAR(10) AFTER pemilik");
    }
}

/**
 * Create database indexes for performance optimization
 * 
 * @param PDO $pdo Database connection
 */
function createIndexes(PDO $pdo): void
{
    $indexes = [
        'qurban_hewan' => ['tahun', 'jenis', 'rt'],
        'qurban_penerima' => ['tahun', 'rt', 'status'],
        'qurban_panitia' => ['tahun'],
        'qurban_keuangan' => ['tahun', 'jenis'],
        'qurban_distribusi' => ['tahun', 'rt']
    ];

    foreach ($indexes as $table => $columns) {
        foreach ($columns as $col) {
            $indexName = $table . '_' . $col . '_idx';
            try {
                $checkIdx = $pdo->prepare(
                    "SHOW INDEX FROM `$table` WHERE Key_name = ?"
                );
                $checkIdx->execute([$indexName]);

                if ($checkIdx->rowCount() === 0) {
                    $pdo->exec(
                        "ALTER TABLE `$table` ADD INDEX `$indexName` (`$col`)"
                    );
                }
            } catch (Exception $e) {
                // Ignore index creation failures
            }
        }
    }
}

/**
 * Synchronize year format across all tables
 * Ensures consistent date format: "XXXX H / YYYY M" (e.g., "1447 H / 2026 M")
 * 
 * @param PDO $pdo Database connection
 */
function synchronizeYearFormat(PDO $pdo): void
{
    $standardYear = '1447 H / 2026 M';
    $tablesToSync = [
        'qurban_hewan',
        'qurban_penerima',
        'qurban_panitia',
        'qurban_keuangan',
        'qurban_distribusi'
    ];

    foreach ($tablesToSync as $table) {
        try {
            $pdo->exec(
                "UPDATE `$table` SET tahun = " . $pdo->quote($standardYear)
            );
        } catch (Exception $e) {
            // Ignore per-table failures
        }
    }
}

/**
 * Global PDO instance
 */
$GLOBALS['pdo'] = null;

/**
 * Get or initialize the global PDO connection
 * 
 * @return PDO Database connection instance
 */
function getPDO(): PDO
{
    if ($GLOBALS['pdo'] === null) {
        $GLOBALS['pdo'] = initializeDatabase();
    }
    return $GLOBALS['pdo'];
}
