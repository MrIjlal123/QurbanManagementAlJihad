<?php
/**
 * Penerima (Beneficiary) Model
 * 
 * Handles database operations for beneficiary/recipient records.
 * Table: qurban_penerima
 */

namespace Qurban\Models;

use PDO;
use PDOException;

class Penerima extends BaseModel
{
    protected string $table = 'qurban_penerima';

    /**
     * Initialize Penerima model
     * 
     * @param PDO $pdo Database connection instance
     */
    public function __construct(PDO $pdo)
    {
        parent::__construct($pdo);
    }

    /**
     * Get all penerima records with pagination
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
            throw new PDOException("Error fetching all penerima: " . $e->getMessage());
        }
    }

    /**
     * Get penerima by ID
     * 
     * @param int $id Record ID
     * @param string $tahun Year/period filter
     * 
     * @return array|null Record data or null
     * @throws PDOException If query fails
     */
    public function getById(int $id, string $tahun): ?array
    {
        try {
            return $this->fetchOne(
                "SELECT * FROM {$this->table} WHERE id = ? AND tahun = ?",
                [$id, $tahun]
            );
        } catch (PDOException $e) {
            throw new PDOException("Error fetching penerima by ID: " . $e->getMessage());
        }
    }

    /**
     * Search penerima records with filters
     * 
     * @param string $tahun Year/period filter
     * @param string|null $kategori Category filter (optional)
     * @param string|null $status Status filter (optional)
     * @param int $page Page number (default: 1)
     * @param int $limit Items per page (default: 50)
     * 
     * @return array Associative array with 'data' and 'total'
     * @throws PDOException If query fails
     */
    public function search(
        string $tahun,
        ?string $kategori = null,
        ?string $status = null,
        int $page = 1,
        int $limit = 50
    ): array {
        try {
            $offset = ($page - 1) * $limit;
            $params = [$tahun];
            $where = "WHERE tahun = ?";

            if ($kategori) {
                $where .= " AND kategori = ?";
                $params[] = $kategori;
            }

            if ($status) {
                $where .= " AND status = ?";
                $params[] = $status;
            }

            $params[] = $limit;
            $params[] = $offset;

            $data = $this->fetchAll(
                "SELECT * FROM {$this->table} {$where} ORDER BY id DESC LIMIT ? OFFSET ?",
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
            throw new PDOException("Error searching penerima: " . $e->getMessage());
        }
    }

    /**
     * Insert new penerima record
     * 
     * @param array $data Record data with keys: tahun, nama, kategori, rt, status, panitia_id, permintaan
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
            throw new PDOException("Error inserting penerima: " . $e->getMessage());
        }
    }

    /**
     * Update penerima record
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
            throw new PDOException("Error updating penerima: " . $e->getMessage());
        }
    }

    /**
     * Delete penerima record
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
            throw new PDOException("Error deleting penerima: " . $e->getMessage());
        }
    }

    /**
     * Update status of a penerima record
     * 
     * @param int $id Record ID
     * @param string $status New status value
     * 
     * @return bool True on success
     * @throws PDOException If update fails
     */
    public function updateStatus(int $id, string $status): bool
    {
        try {
            return $this->update($id, ['status' => $status]);
        } catch (PDOException $e) {
            throw new PDOException("Error updating penerima status: " . $e->getMessage());
        }
    }

    /**
     * Get penerima records by RT with pagination
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
            throw new PDOException("Error fetching penerima by RT: " . $e->getMessage());
        }
    }
}
