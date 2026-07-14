<?php
/**
 * Distribusi Service
 * 
 * Provides helper methods for distribution calculations and formatting.
 */

namespace Qurban\Services;

use InvalidArgumentException;

class DistribusiService
{
    /**
     * Animal coefficients for calculating net weight from gross weight
     */
    const COEFFICIENT_SAPI = 0.8;      // Sapi (cattle): 80% of gross weight
    const COEFFICIENT_KAMBING = 0.66;  // Kambing (goat): 66% of gross weight
    const COEFFICIENT_DOMBA = 0.66;    // Domba (sheep): 66% of gross weight

    /**
     * Calculate net weight (berat bersih) from gross weight
     * 
     * Net weight = gross_weight * coefficient
     * Different coefficients based on animal type
     * 
     * @param float $beratKotor Gross weight in kg
     * @param string $jenis Animal type (SAPI, KAMBING, DOMBA)
     * @param int $jumlahEkor Number of animals (optional, for reference)
     * 
     * @return float Net weight in kg
     * @throws InvalidArgumentException If animal type is invalid
     */
    public static function calculateBeratBersih(
        float $beratKotor,
        string $jenis,
        int $jumlahEkor = 1
    ): float {
        $coefficient = self::getCoefficient($jenis);
        return round($beratKotor * $coefficient, 2);
    }

    /**
     * Get coefficient for animal type
     * 
     * @param string $jenis Animal type
     * 
     * @return float Coefficient value
     * @throws InvalidArgumentException If animal type is unknown
     */
    private static function getCoefficient(string $jenis): float
    {
        $jenis = strtoupper(trim($jenis));

        return match ($jenis) {
            'SAPI' => self::COEFFICIENT_SAPI,
            'KAMBING' => self::COEFFICIENT_KAMBING,
            'DOMBA' => self::COEFFICIENT_DOMBA,
            default => throw new InvalidArgumentException("Unknown animal type: {$jenis}")
        };
    }

    /**
     * Count number of owners from owner text
     * 
     * Counts comma-separated or newline-separated owner names.
     * 
     * @param string $pemilikText Owner names (comma or newline separated)
     * 
     * @return int Number of owners
     */
    public static function countOwners(string $pemilikText): int
    {
        if (empty($pemilikText)) {
            return 0;
        }

        $owners = preg_split('/[\n\r,;]+/', $pemilikText);
        $owners = array_map('trim', $owners);
        $owners = array_filter($owners);

        return count($owners);
    }

    /**
     * Format owner names for display
     * 
     * Converts stored owner format to readable list format.
     * 
     * @param string $pemilikText Owner names (comma or newline separated)
     * 
     * @return string Formatted owner list (HTML line breaks)
     */
    public static function formatOwnersForDisplay(string $pemilikText): string
    {
        if (empty($pemilikText)) {
            return '-';
        }

        $owners = preg_split('/[\n\r,;]+/', $pemilikText);
        $owners = array_map('trim', $owners);
        $owners = array_filter($owners);

        return implode('<br />', $owners);
    }

    /**
     * Calculate distribution per beneficiary
     * 
     * Divides total weight by number of beneficiaries.
     * 
     * @param float $totalWeight Total available weight
     * @param int $beneficiaryCount Number of beneficiaries
     * 
     * @return float Weight per beneficiary
     * @throws InvalidArgumentException If beneficiary count is zero or negative
     */
    public static function calculatePerBeneficiary(float $totalWeight, int $beneficiaryCount): float
    {
        if ($beneficiaryCount <= 0) {
            throw new InvalidArgumentException('Beneficiary count must be greater than 0');
        }

        return round($totalWeight / $beneficiaryCount, 2);
    }

    /**
     * Calculate package weight per package
     * 
     * Divides total weight into packages of specified weight each.
     * 
     * @param float $totalWeight Total available weight
     * @param float $weightPerPackage Desired weight per package
     * 
     * @return int Number of full packages
     * @throws InvalidArgumentException If weight per package is invalid
     */
    public static function calculatePackages(float $totalWeight, float $weightPerPackage): int
    {
        if ($weightPerPackage <= 0) {
            throw new InvalidArgumentException('Weight per package must be greater than 0');
        }

        return (int)floor($totalWeight / $weightPerPackage);
    }

    /**
     * Get weight summary statistics
     * 
     * @param array $distributions Array of distribution records
     * 
     * @return array Summary with total, average, min, max weights
     */
    public static function getWeightSummary(array $distributions): array
    {
        if (empty($distributions)) {
            return [
                'total' => 0,
                'count' => 0,
                'average' => 0,
                'min' => 0,
                'max' => 0
            ];
        }

        $weights = array_column($distributions, 'total_berat');
        $totalWeight = array_sum($weights);
        $count = count($weights);

        return [
            'total' => round($totalWeight, 2),
            'count' => $count,
            'average' => round($totalWeight / $count, 2),
            'min' => round(min($weights), 2),
            'max' => round(max($weights), 2)
        ];
    }
}
