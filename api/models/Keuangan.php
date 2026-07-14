<?php
/**
 * Keuangan (Financial) Model
 * 
 * Handles database operations for financial/accounting records.
 * Table: qurban_keuangan
 */

namespace Qurban\Models;

use PDO;
use PDOException;

class Keuangan extends BaseModel
{
    protected string $table = 'qurban_keuangan';

    /**
     * Initialize Keuangan model
     * 
     * @param PDO $pdo Database connection instance
     */
    public function __construct(PDO $pdo)
    {
        parent::__construct($pdo);
    }

    /**
     * Get all keuangan records with pagination
     * 
     * @param string $tahun Year/period filter
     * @param int $page Page number (default: 1)
     * @param int $limit Items per page (default: 50)
     * 
     * @return array Associative array with 'data' and 'total'
     * @throws PDOException If query fails
     */
    public function getAll(string $tahun, int $page = 1, int $limit = 50): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $data = $this->fetchAll(
                "SELECT * FROM {$this->table} WHERE tahun = ? ORDER BY id DESC, tanggal DESC LIMIT ? OFFSET ?",
                [$tahun, $limit, $offset]
            );

            $countResult = $this->fetchOne(
                "SELECT COUNT(*) as total FROM {$this->table} WHERE tahun = ?",
                [$tahun]
            );

            return [
                'data' => $data,
                'total' => (int)$countResult['total']
            ];
        } catch (PDOException $e) {
            throw new PDOException("Error fetching all keuangan: " . $e->getMessage());
        }
    }

    /**
     * Get keuangan by ID
     * 
     * @param int $id Record ID
     * 
     * @return array|null Record data or null
     * @throws PDOException If query fails
     */
    public function getById(int $id): ?array
    {
        try {
            return $this->fetchOne(
                "SELECT * FROM {$this->table} WHERE id = ?",
                [$id]
            );
        } catch (PDOException $e) {
            throw new PDOException("Error fetching keuangan by ID: " . $e->getMessage());
        }
    }

    /**
     * Search keuangan records with filters
     * 
     * @param string $tahun Year/period filter
     * @param string|null $jenis Type filter (optional) - 'Pemasukan' or 'Pengeluaran'
     * @param int $page Page number (default: 1)
     * @param int $limit Items per page (default: 50)
     * 
     * @return array Associative array with 'data' and 'total'
     * @throws PDOException If query fails
     */
    public function search(
        string $tahun,
        ?string $jenis = null,
        int $page = 1,
        int $limit = 50
    ): array {
        try {
            $offset = ($page - 1) * $limit;
            $params = [$tahun];
            $where = "WHERE tahun = ?";

            if ($jenis) {
                $where .= " AND jenis = ?";
                $params[] = $jenis;
            }

            $params[] = $limit;
            $params[] = $offset;

            $data = $this->fetchAll(
                "SELECT * FROM {$this->table} {$where} ORDER BY id DESC, tanggal DESC LIMIT ? OFFSET ?",
                $params
            );

            $countParams = array_slice($params, 0, -2);
            $countResult = $this->fetchOne(
                "SELECT COUNT(*) as total FROM {$this->table} {$where}",
                array_slice($countParams, 0, count($countParams) - 1)
            );

            return [
                'data' => $data,
                'total' => (int)$countResult['total']
            ];
        } catch (PDOException $e) {
            throw new PDOException("Error searching keuangan: " . $e->getMessage());
        }
    }

    /**
     * Insert new keuangan record
     * 
     * @param array $data Record data with keys: tahun, tanggal, jenis, ekor, harga, keterangan, nominal
     * 
     * @return string Last inserted ID
     * @throws PDOException If insert fails
     */
    public function insert(array $data): string
    {
        try {
            parent::insert($this->table, $data);
            return $this->getLastInsertId();
        } catch (PDOException $e) {
            throw new PDOException("Error inserting keuangan: " . $e->getMessage());
        }
    }

    /**
     * Update keuangan record
     * 
     * @param int $id Record ID
     * @param array $data Fields to update
     * 
     * @return bool True on success
     * @throws PDOException If update fails
     */
    public function update(int $id, array $data): bool
    {
        try {
            return parent::update($this->table, $data, ['id' => $id]);
        } catch (PDOException $e) {
            throw new PDOException("Error updating keuangan: " . $e->getMessage());
        }
    }

    /**
     * Delete keuangan record
     * 
     * @param int $id Record ID
     * 
     * @return bool True on success
     * @throws PDOException If delete fails
     */
    public function delete(int $id): bool
    {
        try {
            return parent::delete($this->table, ['id' => $id]);
        } catch (PDOException $e) {
            throw new PDOException("Error deleting keuangan: " . $e->getMessage());
        }
    }
}
