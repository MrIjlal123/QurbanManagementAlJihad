<?php
/**
 * Pagination Service
 * 
 * Provides static methods for handling pagination calculations and parameters.
 */

namespace Qurban\Services;

use InvalidArgumentException;

class PaginationService
{
    /**
     * Extract pagination parameters from request
     * 
     * @param array $request Query/request parameters
     * @param int $defaultPage Default page number
     * @param int $defaultLimit Default items per page
     * 
     * @return array Associative array with 'page' and 'limit' keys
     * @throws InvalidArgumentException If parameters are invalid
     */
    public static function getParams(array $request, int $defaultPage = 1, int $defaultLimit = 50): array
    {
        $page = (int)($request['page'] ?? $defaultPage);
        $limit = (int)($request['limit'] ?? $defaultLimit);

        if ($page < 1) {
            throw new InvalidArgumentException('Page must be at least 1');
        }

        if ($limit < 1) {
            throw new InvalidArgumentException('Limit must be at least 1');
        }

        if ($limit > 100) {
            $limit = 100; // Cap maximum limit at 100
        }

        return [
            'page' => $page,
            'limit' => $limit
        ];
    }

    /**
     * Calculate database OFFSET from page and limit
     * 
     * OFFSET = (page - 1) * limit
     * 
     * @param int $page Current page number (1-indexed)
     * @param int $limit Items per page
     * 
     * @return int OFFSET value for SQL query
     */
    public static function calculateOffset(int $page, int $limit): int
    {
        return ($page - 1) * $limit;
    }

    /**
     * Calculate total number of pages
     * 
     * total_pages = ceil(total_items / limit)
     * 
     * @param int $total Total number of items
     * @param int $limit Items per page
     * 
     * @return int Total number of pages
     */
    public static function getTotalPages(int $total, int $limit): int
    {
        return (int)ceil($total / $limit);
    }

    /**
     * Check if current page has next page
     * 
     * @param int $page Current page number
     * @param int $totalPages Total number of pages
     * 
     * @return bool True if next page exists
     */
    public static function hasNextPage(int $page, int $totalPages): bool
    {
        return $page < $totalPages;
    }

    /**
     * Check if current page has previous page
     * 
     * @param int $page Current page number
     * 
     * @return bool True if previous page exists
     */
    public static function hasPreviousPage(int $page): bool
    {
        return $page > 1;
    }

    /**
     * Build complete pagination metadata
     * 
     * @param int $page Current page number
     * @param int $limit Items per page
     * @param int $total Total number of items
     * 
     * @return array Pagination metadata
     */
    public static function buildMetadata(int $page, int $limit, int $total): array
    {
        $totalPages = self::getTotalPages($total, $limit);

        return [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'total_pages' => $totalPages,
            'has_next' => self::hasNextPage($page, $totalPages),
            'has_previous' => self::hasPreviousPage($page),
            'offset' => self::calculateOffset($page, $limit)
        ];
    }
}
