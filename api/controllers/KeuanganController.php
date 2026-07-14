<?php
/**
 * Keuangan (Financial) Controller
 * 
 * Handles API endpoints for financial/accounting management.
 */

namespace Qurban\Controllers;

use Qurban\Models\Keuangan;
use PDO;
use PDOException;

class KeuanganController extends BaseController
{
    /**
     * Keuangan model instance
     * 
     * @var Keuangan
     */
    private Keuangan $keuanganModel;

    /**
     * Initialize KeuanganController
     * 
     * @param PDO $pdo Database connection instance
     */
    public function __construct(PDO $pdo)
    {
        $this->keuanganModel = new Keuangan($pdo);
    }

    /**
     * Get all keuangan records (paginated)
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

            $result = $this->keuanganModel->getAll($tahun, $page, $limit);
            $this->respondPaginated($result['data'], $page, $limit, $result['total']);
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get single keuangan record by ID
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

            $data = $this->keuanganModel->getById($id);

            if (!$data) {
                $this->respondError('Keuangan not found', 404);
                return;
            }

            $this->respondSuccess($data, 'Keuangan retrieved successfully');
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Search keuangan records
     * Query parameters: tahun (required), jenis (optional), page (optional), limit (optional)
     * 
     * @return void Outputs JSON response
     */
    public function search(): void
    {
        try {
            $tahun = $this->getQuery('tahun');
            $jenis = $this->getQuery('jenis');
            $page = (int)$this->getQuery('page', 1);
            $limit = (int)$this->getQuery('limit', 50);

            if (!$tahun) {
                $this->respondError('Tahun is required', 400);
                return;
            }

            $result = $this->keuanganModel->search($tahun, $jenis, $page, $limit);
            $this->respondPaginated($result['data'], $page, $limit, $result['total']);
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Insert new keuangan record
     * Request body: tahun, tanggal, jenis, ekor, harga, keterangan, nominal
     * 
     * @return void Outputs JSON response
     */
    public function insert(): void
    {
        try {
            $data = $this->getRequestBody();

            // Validate required fields
            $required = ['tahun', 'tanggal', 'jenis', 'nominal'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    $this->respondError("Field '{$field}' is required", 400);
                    return;
                }
            }

            $id = $this->keuanganModel->insert($data);
            $this->respondSuccess(['id' => $id], 'Keuangan created successfully', 201);
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Update keuangan record
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

            $success = $this->keuanganModel->update($id, $data);

            if ($success) {
                $this->respondSuccess(['id' => $id], 'Keuangan updated successfully');
            } else {
                $this->respondError('Failed to update keuangan', 400);
            }
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Delete keuangan record
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

            $success = $this->keuanganModel->delete($id);

            if ($success) {
                $this->respondSuccess(['id' => $id], 'Keuangan deleted successfully');
            } else {
                $this->respondError('Failed to delete keuangan', 400);
            }
        } catch (PDOException $e) {
            $this->respondError('Database error: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            $this->respondError('Error: ' . $e->getMessage(), 400);
        }
    }
}
