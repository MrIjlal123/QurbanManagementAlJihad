<?php
/**
 * Hewan (Livestock) Controller
 * 
 * Handles API endpoints for livestock/animal management.
 */

namespace Qurban\Controllers;

use Qurban\Models\Hewan;
use PDO;
use PDOException;

class HewanController extends BaseController
{
    /**
     * Hewan model instance
     * 
     * @var Hewan
     */
    private Hewan $hewanModel;

    /**
     * Initialize HewanController
     * 
     * @param PDO $pdo Database connection instance
     */
    public function __construct(PDO $pdo)
    {
        $this->hewanModel = new Hewan($pdo);
    }

    /**
     * Get all hewan records (paginated)
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

            $result = $this->hewanModel->getAll($tahun, $page, $limit);
            $this->respondPaginated($result['data'], $page, $limit, $result['total']);
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get single hewan record by ID
     * Query parameters: id (required), tahun (required)
     * 
     * @return void Outputs JSON response
     */
    public function getById(): void
    {
        try {
            $id = (int)$this->getQuery('id');
            $tahun = $this->getQuery('tahun');

            if (!$id || !$tahun) {
                $this->respondError('ID and tahun are required', 400);
                return;
            }

            $data = $this->hewanModel->getById($id, $tahun);

            if (!$data) {
                $this->respondError('Hewan not found', 404);
                return;
            }

            $this->respondSuccess($data, 'Hewan retrieved successfully');
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get distinct tahun (year) values
     * 
     * @return void Outputs JSON response
     */
    public function getTahun(): void
    {
        try {
            $tahunList = $this->hewanModel->getTahunList();
            $this->respondSuccess($tahunList, 'Tahun list retrieved successfully');
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get distinct RT list for a tahun
     * Query parameters: tahun (required)
     * 
     * @return void Outputs JSON response
     */
    public function getRTList(): void
    {
        try {
            $tahun = $this->getQuery('tahun');

            if (!$tahun) {
                $this->respondError('Tahun is required', 400);
                return;
            }

            $rtList = $this->hewanModel->getRTList($tahun);
            $this->respondSuccess($rtList, 'RT list retrieved successfully');
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Insert new hewan record
     * Request body: tahun, jenis, pemilik, rt, kotor, daging, permintaan, keterangan
     * 
     * @return void Outputs JSON response
     */
    public function insert(): void
    {
        try {
            $data = $this->getRequestBody();

            // Validate required fields
            $required = ['tahun', 'jenis', 'pemilik', 'rt', 'kotor'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    $this->respondError("Field '{$field}' is required", 400);
                    return;
                }
            }

            $id = $this->hewanModel->insert($data);
            $this->respondSuccess(['id' => $id], 'Hewan created successfully', 201);
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Update hewan record
     * Query parameter: id (required)
     * Request body: fields to update
     * 
     * @return void Outputs JSON response
     */
    public function update(): void
    {
        try {
            $id = (int)$this->getQuery('id');
            $data = $this->getRequestBody();

            if (!$id) {
                $this->respondError('ID is required', 400);
                return;
            }

            if (empty($data)) {
                $this->respondError('No data to update', 400);
                return;
            }

            $success = $this->hewanModel->update($id, $data);

            if ($success) {
                $this->respondSuccess(['id' => $id], 'Hewan updated successfully');
            } else {
                $this->respondError('Failed to update hewan', 400);
            }
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Delete hewan record
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

            $success = $this->hewanModel->delete($id);

            if ($success) {
                $this->respondSuccess(['id' => $id], 'Hewan deleted successfully');
            } else {
                $this->respondError('Failed to delete hewan', 400);
            }
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }
}
