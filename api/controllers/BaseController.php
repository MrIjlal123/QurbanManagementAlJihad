<?php
/**
 * Base Controller Class
 * 
 * Abstract base class for all controllers in the Qurban application.
 * Provides common response formatting with JSON headers setup.
 */

namespace Qurban\Controllers;

abstract class BaseController
{
    /**
     * Send success response
     * 
     * @param mixed $data Response data payload
     * @param string|null $message Success message
     * @param int $code HTTP status code (default: 200)
     * 
     * @return void Outputs JSON response and exits
     */
    protected function respondSuccess($data = null, ?string $message = null, int $code = 200): void
    {
        $this->setJsonHeaders();
        http_response_code($code);
        
        $response = [
            'success' => true,
            'code' => $code,
            'data' => $data,
            'message' => $message ?? 'Success'
        ];
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Send error response
     * 
     * @param string $message Error message
     * @param int $code HTTP status code (default: 400)
     * @param mixed $data Additional error data (optional)
     * 
     * @return void Outputs JSON response and exits
     */
    protected function respondError(string $message, int $code = 400, $data = null): void
    {
        $this->setJsonHeaders();
        http_response_code($code);
        
        $response = [
            'success' => false,
            'code' => $code,
            'message' => $message,
            'data' => $data
        ];
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Send paginated response
     * 
     * @param array $data Array of results
     * @param int $page Current page number
     * @param int $limit Items per page
     * @param int $total Total count of items
     * @param string $message Response message
     * @param int $code HTTP status code (default: 200)
     * 
     * @return void Outputs JSON response and exits
     */
    protected function respondPaginated(
        array $data,
        int $page,
        int $limit,
        int $total,
        string $message = 'Success',
        int $code = 200
    ): void {
        $this->setJsonHeaders();
        http_response_code($code);
        
        $totalPages = ceil($total / $limit);
        
        $response = [
            'success' => true,
            'code' => $code,
            'message' => $message,
            'data' => $data,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'total_pages' => $totalPages,
                'has_next' => $page < $totalPages,
                'has_previous' => $page > 1
            ]
        ];
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Set JSON response headers
     * 
     * @return void
     */
    protected function setJsonHeaders(): void
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
    }

    /**
     * Get request body as JSON
     * 
     * @return array Decoded JSON request body
     */
    protected function getRequestBody(): array
    {
        $input = file_get_contents('php://input');
        return json_decode($input, true) ?? [];
    }

    /**
     * Get request parameter (GET, POST)
     * 
     * @param string $key Parameter key
     * @param mixed $default Default value if not found
     * 
     * @return mixed Parameter value or default
     */
    protected function getParam(string $key, $default = null)
    {
        return $_REQUEST[$key] ?? $default;
    }

    /**
     * Get query parameter (GET)
     * 
     * @param string $key Parameter key
     * @param mixed $default Default value if not found
     * 
     * @return mixed Parameter value or default
     */
    protected function getQuery(string $key, $default = null)
    {
        return $_GET[$key] ?? $default;
    }

    /**
     * Get post parameter (POST)
     * 
     * @param string $key Parameter key
     * @param mixed $default Default value if not found
     * 
     * @return mixed Parameter value or default
     */
    protected function getPost(string $key, $default = null)
    {
        return $_POST[$key] ?? $default;
    }

    /**
     * Get request method (GET, POST, PUT, DELETE, etc.)
     * 
     * @return string HTTP method in uppercase
     */
    protected function getMethod(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD']);
    }
}
