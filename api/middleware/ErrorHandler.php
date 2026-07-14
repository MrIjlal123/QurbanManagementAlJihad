<?php

/**
 * ErrorHandler.php
 * 
 * Middleware for handling exceptions and converting them to standardized JSON responses.
 * Logs errors to file and returns appropriate error responses.
 * 
 * @author Qurban System
 * @version 1.0
 */

class ErrorHandler
{
    /**
     * Path to error log file
     * @var string
     */
    private static $logPath = '../logs/errors.log';

    /**
     * Handle exceptions and convert to JSON response
     * 
     * @param Throwable $exception The thrown exception
     * @return void Outputs JSON and exits
     */
    public static function handle($exception)
    {
        // Log the error
        self::logError($exception);

        // Determine response based on exception type
        if ($exception instanceof ValidationException) {
            http_response_code($exception->getStatusCode());
            echo json_encode($exception->getResponse());
        } elseif ($exception instanceof ApiException) {
            http_response_code($exception->getStatusCode());
            echo json_encode($exception->getResponse());
        } elseif ($exception instanceof PDOException) {
            // Handle PDO exceptions as database errors
            http_response_code(500);
            $response = [
                'success' => false,
                'error' => [
                    'code' => 'DATABASE_ERROR',
                    'message' => 'Database operation failed',
                    'statusCode' => 500
                ]
            ];
            echo json_encode($response);
        } else {
            // Handle generic exceptions
            http_response_code(500);
            $response = [
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_SERVER_ERROR',
                    'message' => 'An unexpected error occurred',
                    'statusCode' => 500
                ]
            ];
            echo json_encode($response);
        }

        exit();
    }

    /**
     * Log error to file
     * 
     * Creates logs directory if it doesn't exist.
     * Logs include timestamp, exception type, message, and stack trace.
     * 
     * @param Throwable $exception The exception to log
     * @return void
     */
    private static function logError($exception)
    {
        try {
            // Ensure logs directory exists
            $logDir = dirname(self::$logPath);
            if (!is_dir($logDir)) {
                mkdir($logDir, 0755, true);
            }

            // Prepare log message
            $timestamp = date('Y-m-d H:i:s');
            $logMessage = sprintf(
                "[%s] %s: %s in %s:%d\nStack trace:\n%s\n%s\n",
                $timestamp,
                get_class($exception),
                $exception->getMessage(),
                $exception->getFile(),
                $exception->getLine(),
                $exception->getTraceAsString(),
                str_repeat('-', 80)
            );

            // Write to log file
            file_put_contents(self::$logPath, $logMessage, FILE_APPEND);
        } catch (Throwable $e) {
            // Silently fail if logging fails
        }
    }

    /**
     * Get error code mapping for common exceptions
     * 
     * @param string $exceptionClass Exception class name
     * @return string Error code
     */
    public static function getErrorCode($exceptionClass)
    {
        $errorCodeMap = [
            'ValidationException' => 'VALIDATION_ERROR',
            'DatabaseException' => 'DATABASE_ERROR',
            'ApiException' => 'API_ERROR',
            'PDOException' => 'DATABASE_ERROR'
        ];

        return $errorCodeMap[$exceptionClass] ?? 'INTERNAL_SERVER_ERROR';
    }
}
