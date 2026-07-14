<?php

/**
 * CorsMiddleware.php
 * 
 * Middleware for handling CORS (Cross-Origin Resource Sharing) headers.
 * Allows cross-origin requests from any domain and handles OPTIONS pre-flight requests.
 * 
 * @author Qurban System
 * @version 1.0
 */

class CorsMiddleware
{
    /**
     * Handle CORS headers and pre-flight requests
     * 
     * Sets appropriate CORS headers to allow cross-origin requests
     * and handles OPTIONS HTTP method for pre-flight requests.
     * Should be called at the beginning of each API request.
     * 
     * @return void
     */
    public static function handle()
    {
        // Set CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');
        header('Access-Control-Max-Age: 86400'); // Cache preflight for 24 hours

        // Handle preflight OPTIONS request
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit(json_encode(['success' => true, 'message' => 'CORS preflight successful']));
        }
    }
}
