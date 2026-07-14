<?php
/**
 * Hewan (Livestock) Model
 * 
 * Handles database operations for livestock/animal records.
 * Table: qurban_hewan
 */

namespace Qurban\Models;

use PDO;
use PDOException;

class Hewan extends BaseModel
{
    protected string $table = 'qurban_hewan';

    /**
     * Initialize Hewan model
     * 
     * @param PDO $pdo Database connection instance
     */
    public function __construct(PDO $pdo)
    {
        parent::__construct($pdo);
    }

    /**
     * Get all hewan records with pagination
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
            throw new PDOException("Error fetching all hewan: " . $e->getMessage());
        }
    }

    /**
     * Get hewan by ID
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
            throw new PDOException("Error fetching hewan by ID: " . $e->getMessage());
        }
    }

    /**
     * Search hewan records with filters
     * 
     * @param string $tahun Year/period filter
     * @param string|null $jenis Animal type filter (optional)
     * @param string|null $rt RT filter (optional)
     * @param int $page Page number (default: 1)
     * @param int $limit Items per page (default: 50)
     * 
     * @return array Associative array with 'data' and 'total'
     * @throws PDOException If query fails
     */
    public function search(
        string $tahun,
        ?string $jenis = null,
        ?string $rt = null,
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

            if ($rt) {
                $where .= " AND rt = ?";
                $params[] = $rt;
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
            throw new PDOException("Error searching hewan: " . $e->getMessage());
        }
    }

    /**
     * Insert new hewan record
     * 
     * @param array $data Record data with keys: tahun, jenis, pemilik, rt, kotor, daging, permintaan, keterangan
     * 
     * @return string Last inserted ID
     * @throws PDOException If insert fails
     */
    public function insert(array $data): string
    {
        try {
            $this->insert($this->table, $data);
            return $this->getLastInsertId();
        } catch (PDOException $e) {
            throw new PDOException("Error inserting hewan: " . $e->getMessage());
        }
    }

    /**
     * Update hewan record
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
            return $this->update($this->table, $data, ['id' => $id]);
        } catch (PDOException $e) {
            throw new PDOException("Error updating hewan: " . $e->getMessage());
        }
    }

    /**
     * Delete hewan record
     * 
     * @param int $id Record ID
     * 
     * @return bool True on success
     * @throws PDOException If delete fails
     */
    public function delete(int $id): bool
    {
        try {
            return $this->delete($this->table, ['id' => $id]);
        } catch (PDOException $e) {
            throw new PDOException("Error deleting hewan: " . $e->getMessage());
        }
    }

    /**
     * Get distinct tahun (year) values
     * 
     * @return array List of distinct tahun values
     * @throws PDOException If query fails
     */
    public function getTahunList(): array
    {
        try {
            $results = $this->fetchAll(
                "SELECT DISTINCT tahun FROM {$this->table} ORDER BY tahun DESC"
            );
            return array_column($results, 'tahun');
        } catch (PDOException $e) {
            throw new PDOException("Error fetching tahun list: " . $e->getMessage());
        }
    }

    /**
     * Get distinct RT values for a specific tahun
     * 
     * @param string $tahun Year/period filter
     * 
     * @return array List of distinct RT values
     * @throws PDOException If query fails
     */
    public function getRTList(string $tahun): array
    {
        try {
            $results = $this->fetchAll(
                "SELECT DISTINCT rt FROM {$this->table} WHERE tahun = ? ORDER BY rt ASC",
                [$tahun]
            );
            return array_column($results, 'rt');
        } catch (PDOException $e) {
            throw new PDOException("Error fetching RT list: " . $e->getMessage());
        }
    }

    /**
     * Get hewan records by RT with pagination
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
            throw new PDOException("Error fetching hewan by RT: " . $e->getMessage());
        }
    }
}
