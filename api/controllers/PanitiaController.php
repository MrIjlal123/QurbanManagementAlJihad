<?php
/**
 * Panitia (Committee) Controller
 * 
 * Handles API endpoints for committee/panitia member management.
 */

namespace Qurban\Controllers;

use Qurban\Models\Panitia;
use PDO;
use PDOException;

class PanitiaController extends BaseController
{
    /**
     * Panitia model instance
     * 
     * @var Panitia
     */
    private Panitia $panitiaModel;

    /**
     * Initialize PanitiaController
     * 
     * @param PDO $pdo Database connection instance
     */
    public function __construct(PDO $pdo)
    {
        $this->panitiaModel = new Panitia($pdo);
    }

    /**
     * Get all panitia records (paginated)
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

            $result = $this->panitiaModel->getAll($tahun, $page, $limit);
            $this->respondPaginated($result['data'], $page, $limit, $result['total']);
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get single panitia record by ID
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

            $data = $this->panitiaModel->getById($id);

            if (!$data) {
                $this->respondError('Panitia not found', 404);
                return;
            }

            $this->respondSuccess($data, 'Panitia retrieved successfully');
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Insert new panitia record
     * Request body: tahun, nama, peran, kontak
     * 
     * @return void Outputs JSON response
     */
    public function insert(): void
    {
        try {
            $data = $this->getRequestBody();

            // Validate required fields
            $required = ['tahun', 'nama', 'peran'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    $this->respondError("Field '{$field}' is required", 400);
                    return;
                }
            }

            $id = $this->panitiaModel->insert($data);
            $this->respondSuccess(['id' => $id], 'Panitia created successfully', 201);
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Update panitia record
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

            $success = $this->panitiaModel->update($id, $data);

            if ($success) {
                $this->respondSuccess(['id' => $id], 'Panitia updated successfully');
            } else {
                $this->respondError('Failed to update panitia', 400);
            }
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Delete panitia record
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

            $success = $this->panitiaModel->delete($id);

            if ($success) {
                $this->respondSuccess(['id' => $id], 'Panitia deleted successfully');
            } else {
                $this->respondError('Failed to delete panitia', 400);
            }
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }
}
