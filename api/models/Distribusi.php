<?php
/**
 * Distribusi (Distribution) Model
 * 
 * Handles database operations for distribution/allocation records.
 * Table: qurban_distribusi
 */

namespace Qurban\Models;

use PDO;
use PDOException;

class Distribusi extends BaseModel
{
    protected string $table = 'qurban_distribusi';

    /**
     * Initialize Distribusi model
     * 
     * @param PDO $pdo Database connection instance
     */
    public function __construct(PDO $pdo)
    {
        parent::__construct($pdo);
    }

    /**
     * Get all distribusi records with pagination
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
                "SELECT * FROM {$this->table} WHERE tahun = ? ORDER BY id DESC LIMIT ? OFFSET ?",
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
            throw new PDOException("Error fetching all distribusi: " . $e->getMessage());
        }
    }

    /**
     * Get distribusi by ID
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
            throw new PDOException("Error fetching distribusi by ID: " . $e->getMessage());
        }
    }

    /**
     * Get distribusi records by RT with pagination
     * 
     * @param string $tahun Year/period filter
     * @param string $rt RT filter
     * @param int $page Page number (default: 1)
     * @param int $limit Items per page (default: 50)
     * 
     * @return array Associative array with 'data' and 'total'
     * @throws PDOException If query fails
     */
    public function getByRT(string $tahun, string $rt, int $page = 1, int $limit = 50): array
    {
        try {
            $offset = ($page - 1) * $limit;

            $data = $this->fetchAll(
                "SELECT * FROM {$this->table} WHERE tahun = ? AND rt = ? ORDER BY id DESC LIMIT ? OFFSET ?",
                [$tahun, $rt, $limit, $offset]
            );

            $countResult = $this->fetchOne(
                "SELECT COUNT(*) as total FROM {$this->table} WHERE tahun = ? AND rt = ?",
                [$tahun, $rt]
            );

            return [
                'data' => $data,
                'total' => (int)$countResult['total']
            ];
        } catch (PDOException $e) {
            throw new PDOException("Error fetching distribusi by RT: " . $e->getMessage());
        }
    }

    /**
     * Insert new distribusi record
     * 
     * @param array $data Record data with keys: tahun, kategori, sumber, label, rt, berat_per_bungkus, 
     *                      jumlah_bungkus, total_berat, hewan_id, jumlah_sohibul, berat_per_sohibul
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
            throw new PDOException("Error inserting distribusi: " . $e->getMessage());
        }
    }

    /**
     * Delete distribusi record
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
            throw new PDOException("Error deleting distribusi: " . $e->getMessage());
        }
    }

    /**
     * Delete all distribusi records for a specific tahun
     * 
     * @param string $tahun Year/period to delete
     * 
     * @return bool True on success
     * @throws PDOException If delete fails
     */
    public function deleteAllByTahun(string $tahun): bool
    {
        try {
            $sql = "DELETE FROM {$this->table} WHERE tahun = ?";
            return $this->execute($sql, [$tahun]);
        } catch (PDOException $e) {
            throw new PDOException("Error deleting distribusi by tahun: " . $e->getMessage());
        }
    }
}
