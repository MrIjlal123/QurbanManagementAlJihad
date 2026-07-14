<?php
/**
 * Base Model Class
 * 
 * Abstract base class for all models in the Qurban application.
 * Provides common database operations with PDO error handling.
 */

namespace Qurban\Models;

use PDO;
use PDOException;

abstract class BaseModel
{
    /**
     * PDO database connection instance
     * 
     * @var PDO
     */
    protected PDO $pdo;

    /**
     * Table name for the model
     * 
     * @var string
     */
    protected string $table = '';

    /**
     * Initialize model with PDO connection
     * 
     * @param PDO $pdo Database connection instance
     */
    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Execute a SQL statement with parameters
     * 
     * @param string $sql SQL query string
     * @param array $params Query parameters (for prepared statements)
     * 
     * @return bool True on success
     * @throws PDOException If query execution fails
     */
    protected function execute(string $sql, array $params = []): bool
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            throw new PDOException("Query execution error: " . $e->getMessage());
        }
    }

    /**
     * Fetch all results from a query
     * 
     * @param string $sql SQL query string
     * @param array $params Query parameters
     * 
     * @return array Array of results
     * @throws PDOException If query fails
     */
    protected function fetchAll(string $sql, array $params = []): array
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new PDOException("Fetch all error: " . $e->getMessage());
        }
    }

    /**
     * Fetch a single row from a query
     * 
     * @param string $sql SQL query string
     * @param array $params Query parameters
     * 
     * @return array|null Single result row or null if not found
     * @throws PDOException If query fails
     */
    protected function fetchOne(string $sql, array $params = []): ?array
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            throw new PDOException("Fetch one error: " . $e->getMessage());
        }
    }

    /**
     * Insert a new record into the table
     * 
     * @param string $table Table name
     * @param array $data Associative array of column => value pairs
     * 
     * @return bool True on success
     * @throws PDOException If insert fails
     */
    protected function insert(string $table, array $data): bool
    {
        try {
            $columns = implode(', ', array_keys($data));
            $placeholders = implode(', ', array_fill(0, count($data), '?'));
            
            $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
            $stmt = $this->pdo->prepare($sql);
            
            return $stmt->execute(array_values($data));
        } catch (PDOException $e) {
            throw new PDOException("Insert error: " . $e->getMessage());
        }
    }

    /**
     * Update existing records in the table
     * 
     * @param string $table Table name
     * @param array $data Associative array of column => value pairs to update
     * @param array $where Associative array of column => value pairs for WHERE clause
     * 
     * @return bool True on success
     * @throws PDOException If update fails
     */
    protected function update(string $table, array $data, array $where): bool
    {
        try {
            $set = implode(', ', array_map(fn($key) => "{$key} = ?", array_keys($data)));
            $whereClause = implode(' AND ', array_map(fn($key) => "{$key} = ?", array_keys($where)));
            
            $sql = "UPDATE {$table} SET {$set} WHERE {$whereClause}";
            $stmt = $this->pdo->prepare($sql);
            
            $values = array_merge(array_values($data), array_values($where));
            return $stmt->execute($values);
        } catch (PDOException $e) {
            throw new PDOException("Update error: " . $e->getMessage());
        }
    }

    /**
     * Delete records from the table
     * 
     * @param string $table Table name
     * @param array $where Associative array of column => value pairs for WHERE clause
     * 
     * @return bool True on success
     * @throws PDOException If delete fails
     */
    protected function delete(string $table, array $where): bool
    {
        try {
            $whereClause = implode(' AND ', array_map(fn($key) => "{$key} = ?", array_keys($where)));
            
            $sql = "DELETE FROM {$table} WHERE {$whereClause}";
            $stmt = $this->pdo->prepare($sql);
            
            return $stmt->execute(array_values($where));
        } catch (PDOException $e) {
            throw new PDOException("Delete error: " . $e->getMessage());
        }
    }

    /**
     * Get the ID of the last inserted row
     * 
     * @return string Last insert ID
     */
    protected function getLastInsertId(): string
    {
        return $this->pdo->lastInsertId();
    }
}
