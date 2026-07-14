<?php

/**
 * ApiException.php
 * 
 * Base exception class for API errors.
 * Provides standardized error responses with status codes and error codes.
 * 
 * @author Qurban System
 * @version 1.0
 */

class ApiException extends Exception
{
    /**
     * HTTP Status Code
     * @var int
     */
    protected $statusCode;

    /**
     * API Error Code
     * @var string
     */
    protected $errorCode;

    /**
     * Constructor for ApiException
     * 
     * @param string $message Error message
     * @param int $statusCode HTTP status code (default: 400)
     * @param string $errorCode API error code (default: 'API_ERROR')
     * @param Throwable $previous Previous exception for chaining
     */
    public function __construct(
        $message = 'API Error',
        $statusCode = 400,
        $errorCode = 'API_ERROR',
        Throwable $previous = null
    ) {
        $this->statusCode = $statusCode;
        $this->errorCode = $errorCode;
        parent::__construct($message, 0, $previous);
    }

    /**
     * Get the HTTP status code
     * 
     * @return int Status code
     */
    public function getStatusCode()
    {
        return $this->statusCode;
    }

    /**
     * Set the HTTP status code
     * 
     * @param int $statusCode Status code
     */
    public function setStatusCode($statusCode)
    {
        $this->statusCode = $statusCode;
    }

    /**
     * Get the error code
     * 
     * @return string Error code
     */
    public function getErrorCode()
    {
        return $this->errorCode;
    }

    /**
     * Set the error code
     * 
     * @param string $errorCode Error code
     */
    public function setErrorCode($errorCode)
    {
        $this->errorCode = $errorCode;
    }

    /**
     * Get standardized JSON error response
     * 
     * @return array Response array
     */
    public function getResponse()
    {
        return [
            'success' => false,
            'error' => [
                'code' => $this->errorCode,
                'message' => $this->getMessage(),
                'statusCode' => $this->statusCode
            ]
        ];
    }
}
