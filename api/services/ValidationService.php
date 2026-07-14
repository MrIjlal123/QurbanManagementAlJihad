<?php
/**
 * Validation Service
 * 
 * Provides static validation methods for input data validation and normalization.
 */

namespace Qurban\Services;

use InvalidArgumentException;

class ValidationService
{
    /**
     * Normalize owner names from text input
     * 
     * Converts various text formats (comma, line break, semicolon separated)
     * into standardized array format for storage.
     * 
     * @param string $text Raw owner text input
     * 
     * @return array Array of normalized owner names
     */
    public static function normalizeOwners(string $text): array
    {
        if (empty($text)) {
            return [];
        }

        // Replace multiple delimiters with commas
        $normalized = preg_replace('/[\n\r,;]+/', ',', $text);
        // Split by comma and trim each name
        $owners = array_map('trim', explode(',', $normalized));
        // Filter out empty strings and reindex
        return array_values(array_filter($owners));
    }

    /**
     * Validate year format (Hijri / Masehi format)
     * 
     * Expected format: "1447 H / 2026 M"
     * 
     * @param string $year Year string to validate
     * 
     * @return bool True if format is valid
     */
    public static function validateYearFormat(string $year): bool
    {
        $pattern = '/^\d{4}\s+H\s+\/\s+\d{4}\s+M$/';
        return (bool)preg_match($pattern, $year);
    }

    /**
     * Validate input data against rules
     * 
     * Example rules:
     * [
     *     'tahun' => ['required', 'string'],
     *     'jenis' => ['required', 'string', 'in:SAPI,KAMBING,DOMBA'],
     *     'kotor' => ['required', 'numeric', 'min:0'],
     *     'email' => ['email']
     * ]
     * 
     * @param array $data Input data to validate
     * @param array $rules Validation rules
     * 
     * @return bool True if all validations pass
     * @throws InvalidArgumentException If validation fails
     */
    public static function validateInput(array $data, array $rules): bool
    {
        foreach ($rules as $field => $constraints) {
            $value = $data[$field] ?? null;

            foreach ($constraints as $constraint) {
                self::validateConstraint($field, $value, $constraint);
            }
        }

        return true;
    }

    /**
     * Validate a single constraint
     * 
     * Supported constraints:
     * - required: Field must not be empty
     * - string: Value must be a string
     * - numeric: Value must be numeric
     * - integer: Value must be an integer
     * - boolean: Value must be boolean
     * - email: Value must be valid email
     * - url: Value must be valid URL
     * - min:N: Numeric value >= N or string length >= N
     * - max:N: Numeric value <= N or string length <= N
     * - in:val1,val2,val3: Value must be in list
     * 
     * @param string $field Field name
     * @param mixed $value Value to validate
     * @param string $constraint Constraint definition
     * 
     * @return bool True if valid
     * @throws InvalidArgumentException If validation fails
     */
    private static function validateConstraint(string $field, $value, string $constraint): bool
    {
        $constraint = trim($constraint);

        if ($constraint === 'required') {
            if (empty($value)) {
                throw new InvalidArgumentException("Field '{$field}' is required");
            }
            return true;
        }

        if ($constraint === 'string') {
            if (!is_string($value)) {
                throw new InvalidArgumentException("Field '{$field}' must be a string");
            }
            return true;
        }

        if ($constraint === 'numeric') {
            if (!is_numeric($value)) {
                throw new InvalidArgumentException("Field '{$field}' must be numeric");
            }
            return true;
        }

        if ($constraint === 'integer') {
            if (!is_int($value) && !ctype_digit((string)$value)) {
                throw new InvalidArgumentException("Field '{$field}' must be an integer");
            }
            return true;
        }

        if ($constraint === 'boolean') {
            if (!is_bool($value)) {
                throw new InvalidArgumentException("Field '{$field}' must be boolean");
            }
            return true;
        }

        if ($constraint === 'email') {
            if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                throw new InvalidArgumentException("Field '{$field}' must be a valid email");
            }
            return true;
        }

        if ($constraint === 'url') {
            if (!filter_var($value, FILTER_VALIDATE_URL)) {
                throw new InvalidArgumentException("Field '{$field}' must be a valid URL");
            }
            return true;
        }

        // Handle min:N constraint
        if (strpos($constraint, 'min:') === 0) {
            $minValue = (int)substr($constraint, 4);
            $checkValue = is_numeric($value) ? (float)$value : strlen((string)$value);
            if ($checkValue < $minValue) {
                throw new InvalidArgumentException("Field '{$field}' must be at least {$minValue}");
            }
            return true;
        }

        // Handle max:N constraint
        if (strpos($constraint, 'max:') === 0) {
            $maxValue = (int)substr($constraint, 4);
            $checkValue = is_numeric($value) ? (float)$value : strlen((string)$value);
            if ($checkValue > $maxValue) {
                throw new InvalidArgumentException("Field '{$field}' must be at most {$maxValue}");
            }
            return true;
        }

        // Handle in:val1,val2,val3 constraint
        if (strpos($constraint, 'in:') === 0) {
            $allowedValues = explode(',', substr($constraint, 3));
            if (!in_array($value, $allowedValues)) {
                throw new InvalidArgumentException("Field '{$field}' must be one of: " . implode(', ', $allowedValues));
            }
            return true;
        }

        return true;
    }
}
