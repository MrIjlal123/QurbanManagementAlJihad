<?php
/**
 * Distribusi (Distribution) Controller
 * 
 * Handles API endpoints for distribution/allocation management.
 */

namespace Qurban\Controllers;

use Qurban\Models\Distribusi;
use PDO;
use PDOException;

class DistribusiController extends BaseController
{
    /**
     * Distribusi model instance
     * 
     * @var Distribusi
     */
    private Distribusi $distribusiModel;

    /**
     * Initialize DistribusiController
     * 
     * @param PDO $pdo Database connection instance
     */
    public function __construct(PDO $pdo)
    {
        $this->distribusiModel = new Distribusi($pdo);
    }

    /**
     * Get all distribusi records (paginated)
     * Query parameters: tahun (required), page (optional), limit (optional)
     * 
     * @return void Outputs JSON response
     */
    public function getAll(): void
    {
        try {
            $tahun = $this->getQuery('tahun');
            $page = (int)$this->getQuery('page', 1);
            $limit = (int)$this->getQuery('limit', 50);

            if (!$tahun) {
                $this->respondError('Tahun is required', 400);
                return;
            }

            $result = $this->distribusiModel->getAll($tahun, $page, $limit);
            $this->respondPaginated($result['data'], $page, $limit, $result['total']);
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get single distribusi record by ID
     * Query parameter: id (required)
     * 
     * @return void Outputs JSON response
     */
    public function getById(): void
    {
        try {
            $id = (int)$this->getQuery('id');

            if (!$id) {
                $this->respondError('ID is required', 400);
                return;
            }

            $data = $this->distribusiModel->getById($id);

            if (!$data) {
                $this->respondError('Distribusi not found', 404);
                return;
            }

            $this->respondSuccess($data, 'Distribusi retrieved successfully');
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get distribusi by RT with pagination
     * Query parameters: tahun (required), rt (required), page (optional), limit (optional)
     * 
     * @return void Outputs JSON response
     */
    public function getByRT(): void
    {
        try {
            $tahun = $this->getQuery('tahun');
            $rt = $this->getQuery('rt');
            $page = (int)$this->getQuery('page', 1);
            $limit = (int)$this->getQuery('limit', 50);

            if (!$tahun || !$rt) {
                $this->respondError('Tahun and RT are required', 400);
                return;
            }

            $result = $this->distribusiModel->getByRT($tahun, $rt, $page, $limit);
            $this->respondPaginated($result['data'], $page, $limit, $result['total']);
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Insert new distribusi record
     * Request body: tahun, kategori, sumber, label, rt, berat_per_bungkus, jumlah_bungkus, 
     *               total_berat, hewan_id, jumlah_sohibul, berat_per_sohibul
     * 
     * @return void Outputs JSON response
     */
    public function insert(): void
    {
        try {
            $data = $this->getRequestBody();

            // Validate required fields
            $required = ['tahun', 'kategori', 'sumber', 'rt', 'total_berat'];
            foreach ($required as $field) {
                if (!isset($data[$field])) {
                    $this->respondError("Field '{$field}' is required", 400);
                    return;
                }
            }

            $id = $this->distribusiModel->insert($data);
            $this->respondSuccess(['id' => $id], 'Distribusi created successfully', 201);
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Delete distribusi record
     * Query parameter: id (required)
     * 
     * @return void Outputs JSON response
     */
    public function delete(): void
    {
        try {
            $id = (int)$this->getQuery('id');

            if (!$id) {
                $this->respondError('ID is required', 400);
                return;
            }

            $success = $this->distribusiModel->delete($id);

            if ($success) {
                $this->respondSuccess(['id' => $id], 'Distribusi deleted successfully');
            } else {
                $this->respondError('Failed to delete distribusi', 400);
            }
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Delete all distribusi records for a specific tahun
     * Query parameter: tahun (required)
     * 
     * @return void Outputs JSON response
     */
    public function deleteAllByTahun(): void
    {
        try {
            $tahun = $this->getQuery('tahun');

            if (!$tahun) {
                $this->respondError('Tahun is required', 400);
                return;
            }

            $success = $this->distribusiModel->deleteAllByTahun($tahun);

            if ($success) {
                $this->respondSuccess(['tahun' => $tahun], 'All distribusi records deleted successfully');
            } else {
                $this->respondError('Failed to delete distribusi records', 400);
            }
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }
}
