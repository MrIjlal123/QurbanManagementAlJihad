<?php
/**
 * Penerima (Beneficiary) Controller
 * 
 * Handles API endpoints for beneficiary/recipient management.
 */

namespace Qurban\Controllers;

use Qurban\Models\Penerima;
use PDO;
use PDOException;

class PenerimaController extends BaseController
{
    /**
     * Penerima model instance
     * 
     * @var Penerima
     */
    private Penerima $penerimaModel;

    /**
     * Initialize PenerimaController
     * 
     * @param PDO $pdo Database connection instance
     */
    public function __construct(PDO $pdo)
    {
        $this->penerimaModel = new Penerima($pdo);
    }

    /**
     * Get all penerima records (paginated)
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

            $result = $this->penerimaModel->getAll($tahun, $page, $limit);
            $this->respondPaginated($result['data'], $page, $limit, $result['total']);
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get single penerima record by ID
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

            $data = $this->penerimaModel->getById($id, $tahun);

            if (!$data) {
                $this->respondError('Penerima not found', 404);
                return;
            }

            $this->respondSuccess($data, 'Penerima retrieved successfully');
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Insert new penerima record
     * Request body: tahun, nama, kategori, rt, status, panitia_id, permintaan
     * 
     * @return void Outputs JSON response
     */
    public function insert(): void
    {
        try {
            $data = $this->getRequestBody();

            // Validate required fields
            $required = ['tahun', 'nama', 'kategori', 'rt', 'status'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    $this->respondError("Field '{$field}' is required", 400);
                    return;
                }
            }

            $id = $this->penerimaModel->insert($data);
            $this->respondSuccess(['id' => $id], 'Penerima created successfully', 201);
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Update penerima record
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

            $success = $this->penerimaModel->update($id, $data);

            if ($success) {
                $this->respondSuccess(['id' => $id], 'Penerima updated successfully');
            } else {
                $this->respondError('Failed to update penerima', 400);
            }
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Delete penerima record
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

            $success = $this->penerimaModel->delete($id);

            if ($success) {
                $this->respondSuccess(['id' => $id], 'Penerima deleted successfully');
            } else {
                $this->respondError('Failed to delete penerima', 400);
            }
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Update penerima status
     * Query parameters: id (required), status (required)
     * 
     * @return void Outputs JSON response
     */
    public function updateStatus(): void
    {
        try {
            $id = (int)$this->getQuery('id');
            $status = $this->getQuery('status');

            if (!$id || !$status) {
                $this->respondError('ID and status are required', 400);
                return;
            }

            $success = $this->penerimaModel->updateStatus($id, $status);

            if ($success) {
                $this->respondSuccess(['id' => $id, 'status' => $status], 'Penerima status updated successfully');
            } else {
                $this->respondError('Failed to update penerima status', 400);
            }
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }
}
