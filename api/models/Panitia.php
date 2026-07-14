<?php
/**
 * Panitia (Committee) Model
 * 
 * Handles database operations for committee/panitia member records.
 * Table: qurban_panitia
 */

namespace Qurban\Models;

use PDO;
use PDOException;

class Panitia extends BaseModel
{
    protected string $table = 'qurban_panitia';

    /**
     * Initialize Panitia model
     * 
     * @param PDO $pdo Database connection instance
     */
    public function __construct(PDO $pdo)
    {
        parent::__construct($pdo);
    }

    /**
     * Get all panitia records with pagination
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
            throw new PDOException("Error fetching all panitia: " . $e->getMessage());
        }
    }

    /**
     * Get panitia by ID
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
            throw new PDOException("Error fetching panitia by ID: " . $e->getMessage());
        }
    }

    /**
     * Insert new panitia record
     * 
     * @param array $data Record data with keys: tahun, nama, peran, kontak
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
            throw new PDOException("Error inserting panitia: " . $e->getMessage());
        }
    }

    /**
     * Update panitia record
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
            throw new PDOException("Error updating panitia: " . $e->getMessage());
        }
    }

    /**
     * Delete panitia record
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
            throw new PDOException("Error deleting panitia: " . $e->getMessage());
        }
    }
}
