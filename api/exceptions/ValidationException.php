<?php

/**
 * ValidationException.php
 * 
 * Exception class for validation errors.
 * Extends ApiException with default 400 status code.
 * Stores field-specific validation errors.
 * 
 * @author Qurban System
 * @version 1.0
 */

class ValidationException extends ApiException
{
    /**
     * Array of field-specific validation errors
     * @var array
     */
    protected $errors = [];

    /**
     * Constructor for ValidationException
     * 
     * @param string $message General validation error message
     * @param array $errors Field-specific validation errors
     * @param Throwable $previous Previous exception for chaining
     */
    public function __construct(
        $message = 'Validation Error',
        $errors = [],
        Throwable $previous = null
    ) {
        $this->errors = $errors;
        // Set default values for validation errors
        parent::__construct($message, 400, 'VALIDATION_ERROR', $previous);
    }

    /**
     * Get field-specific validation errors
     * 
     * @return array Errors array
     */
    public function getErrors()
    {
        return $this->errors;
    }

    /**
     * Set field-specific validation errors
     * 
     * @param array $errors Errors array
     */
    public function setErrors($errors)
    {
        $this->errors = $errors;
    }

    /**
     * Add a field-specific error
     * 
     * @param string $field Field name
     * @param string $error Error message
     */
    public function addError($field, $error)
    {
        if (!isset($this->errors[$field])) {
            $this->errors[$field] = [];
        }
        if (!in_array($error, $this->errors[$field])) {
            $this->errors[$field][] = $error;
        }
    }

    /**
     * Get standardized JSON error response with field errors
     * 
     * @return array Response array
     */
    public function getResponse()
    {
        $response = parent::getResponse();
        if (!empty($this->errors)) {
            $response['error']['fields'] = $this->errors;
        }
        return $response;
    }
}
