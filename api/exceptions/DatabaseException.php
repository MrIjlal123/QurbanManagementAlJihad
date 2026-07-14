<?php

/**
 * DatabaseException.php
 * 
 * Exception class for database errors.
 * Extends ApiException with default 500 status code.
 * Used for database-related exceptions and PDO errors.
 * 
 * @author Qurban System
 * @version 1.0
 */

class DatabaseException extends ApiException
{
    /**
     * Constructor for DatabaseException
     * 
     * @param string $message Error message
     * @param Throwable $previous Previous exception for chaining
     */
    public function __construct(
        $message = 'Database Error',
        Throwable $previous = null
    ) {
        // Set default values for database errors
        parent::__construct($message, 500, 'DATABASE_ERROR', $previous);
    }
}
