<?php
/**
 * QURBAN API TEST SUITE
 * 
 * Comprehensive testing for all 24 API endpoints
 * Tests database connectivity, CRUD operations, and error handling
 * 
 * Run from command line: php tests/ApiTestSuite.php
 */

// Configuration
$BASE_URL = 'http://localhost/Qurban/api/index.php';
$TEST_RESULTS = [];
$PASSED = 0;
$FAILED = 0;

// Test Data
$TEST_TAHUN = '1447 H / 2026 M';
$TEST_DATA = [
    'hewan' => [
        'tahun' => $TEST_TAHUN,
        'jenis' => 'Sapi',
        'pemilik' => 'Budi Santoso, Ahmad Wijaya',
        'rt' => '01',
        'kotor' => 400,
        'daging' => 320,
        'permintaan' => 'Test permintaan',
        'keterangan' => 'Test hewan'
    ],
    'penerima' => [
        'tahun' => $TEST_TAHUN,
        'nama' => 'Keluarga Test',
        'kategori' => 'Anak Yatim',
        'rt' => '01',
        'status' => 'Belum Diambil',
        'permintaan' => 'Test permintaan'
    ],
    'keuangan' => [
        'tahun' => $TEST_TAHUN,
        'tanggal' => date('Y-m-d'),
        'jenis' => 'Pemasukan',
        'ekor' => 1,
        'harga' => 5000000,
        'nominal' => 5000000,
        'keterangan' => 'Test keuangan'
    ],
    'panitia' => [
        'tahun' => $TEST_TAHUN,
        'nama' => 'Test Panitia',
        'peran' => 'Ketua',
        'kontak' => '08123456789'
    ]
];

echo "\n";
echo "═══════════════════════════════════════════════════════════\n";
echo "   QURBAN API TEST SUITE - Comprehensive Endpoint Testing\n";
echo "═══════════════════════════════════════════════════════════\n\n";

// ============================================================================
// TEST GROUP 1: UTILITY ENDPOINTS
// ============================================================================

echo "📋 TEST GROUP 1: UTILITY ENDPOINTS\n";
echo "─────────────────────────────────────────────────────────────\n";

// Test 1.1: getTahun
testEndpoint('getTahun', 'GET', null, 'Get available years');

// Test 1.2: getRTList
testEndpoint('getRTList', 'GET', ['tahun' => $TEST_TAHUN], 'Get RT list for year');

// ============================================================================
// TEST GROUP 2: HEWAN (Livestock) - CRUD OPERATIONS
// ============================================================================

echo "\n📋 TEST GROUP 2: HEWAN (Livestock) - CRUD OPERATIONS\n";
echo "─────────────────────────────────────────────────────────────\n";

// Test 2.1: Create Hewan (INSERT)
$hewanResponse = testEndpoint('addHewan', 'POST', $TEST_DATA['hewan'], 'Add livestock');
$hewanId = extractIdFromResponse($hewanResponse);

// Test 2.2: Get all Hewan
testEndpoint('getHewan', 'GET', ['tahun' => $TEST_TAHUN, 'page' => 1, 'limit' => 50], 'List livestock');

// Test 2.3: Get specific Hewan (if ID retrieved)
if ($hewanId) {
    testEndpoint('getHewan', 'GET', ['id' => $hewanId, 'tahun' => $TEST_TAHUN], 'Get specific livestock');
}

// Test 2.4: Update Hewan
if ($hewanId) {
    $updateData = $TEST_DATA['hewan'];
    $updateData['id'] = $hewanId;
    $updateData['kotor'] = 420;
    testEndpoint('updateHewan', 'POST', $updateData, 'Update livestock');
}

// ============================================================================
// TEST GROUP 3: PENERIMA (Beneficiary) - CRUD OPERATIONS
// ============================================================================

echo "\n📋 TEST GROUP 3: PENERIMA (Beneficiary) - CRUD OPERATIONS\n";
echo "─────────────────────────────────────────────────────────────\n";

// Test 3.1: Create Penerima
$penerimaResponse = testEndpoint('addPenerima', 'POST', $TEST_DATA['penerima'], 'Add beneficiary');
$penerimaId = extractIdFromResponse($penerimaResponse);

// Test 3.2: Get all Penerima
testEndpoint('getPenerima', 'GET', ['tahun' => $TEST_TAHUN, 'page' => 1, 'limit' => 50], 'List beneficiaries');

// Test 3.3: Get specific Penerima
if ($penerimaId) {
    testEndpoint('getPenerima', 'GET', ['id' => $penerimaId, 'tahun' => $TEST_TAHUN], 'Get specific beneficiary');
}

// Test 3.4: Update Penerima
if ($penerimaId) {
    $updateData = $TEST_DATA['penerima'];
    $updateData['id'] = $penerimaId;
    $updateData['status'] = 'Sudah Diambil';
    testEndpoint('updatePenerima', 'POST', $updateData, 'Update beneficiary');
}

// Test 3.5: Update Penerima Status
if ($penerimaId) {
    testEndpoint('updateStatusPenerima', 'POST', ['id' => $penerimaId, 'status' => 'Selesai'], 'Update beneficiary status');
}

// ============================================================================
// TEST GROUP 4: KEUANGAN (Financial) - CRUD OPERATIONS
// ============================================================================

echo "\n📋 TEST GROUP 4: KEUANGAN (Financial) - CRUD OPERATIONS\n";
echo "─────────────────────────────────────────────────────────────\n";

// Test 4.1: Create Keuangan
$keuanganResponse = testEndpoint('addKeuangan', 'POST', $TEST_DATA['keuangan'], 'Add financial record');
$keuanganId = extractIdFromResponse($keuanganResponse);

// Test 4.2: Get all Keuangan
testEndpoint('getKeuangan', 'GET', ['tahun' => $TEST_TAHUN, 'page' => 1, 'limit' => 50], 'List financial records');

// Test 4.3: Get specific Keuangan
if ($keuanganId) {
    testEndpoint('getKeuangan', 'GET', ['id' => $keuanganId, 'tahun' => $TEST_TAHUN], 'Get specific financial record');
}

// Test 4.4: Update Keuangan
if ($keuanganId) {
    $updateData = $TEST_DATA['keuangan'];
    $updateData['id'] = $keuanganId;
    $updateData['nominal'] = 5500000;
    testEndpoint('updateKeuangan', 'POST', $updateData, 'Update financial record');
}

// ============================================================================
// TEST GROUP 5: PANITIA (Committee) - CRUD OPERATIONS
// ============================================================================

echo "\n📋 TEST GROUP 5: PANITIA (Committee) - CRUD OPERATIONS\n";
echo "─────────────────────────────────────────────────────────────\n";

// Test 5.1: Create Panitia
$panitiaResponse = testEndpoint('addPanitia', 'POST', $TEST_DATA['panitia'], 'Add committee member');
$panitiaId = extractIdFromResponse($panitiaResponse);

// Test 5.2: Get all Panitia
testEndpoint('getPanitia', 'GET', ['tahun' => $TEST_TAHUN, 'page' => 1, 'limit' => 50], 'List committee members');

// Test 5.3: Get specific Panitia
if ($panitiaId) {
    testEndpoint('getPanitia', 'GET', ['id' => $panitiaId, 'tahun' => $TEST_TAHUN], 'Get specific committee member');
}

// Test 5.4: Update Panitia
if ($panitiaId) {
    $updateData = $TEST_DATA['panitia'];
    $updateData['id'] = $panitiaId;
    $updateData['peran'] = 'Wakil Ketua';
    testEndpoint('updatePanitia', 'POST', $updateData, 'Update committee member');
}

// ============================================================================
// TEST GROUP 6: DISTRIBUSI (Distribution) - CRUD OPERATIONS
// ============================================================================

echo "\n📋 TEST GROUP 6: DISTRIBUSI (Distribution) - CRUD OPERATIONS\n";
echo "─────────────────────────────────────────────────────────────\n";

// Test 6.1: Create Distribution
$distribusiData = [
    'tahun' => $TEST_TAHUN,
    'kategori' => 'Sahibul Qurban',
    'sumber' => 'Sapi',
    'label' => 'Distribution Test',
    'rt' => '01',
    'berat_per_bungkus' => 5,
    'jumlah_bungkus' => 10,
    'total_berat' => 50,
    'hewan_id' => $hewanId,
    'jumlah_sohibul' => 2,
    'berat_per_sohibul' => 25
];

$distribusiResponse = testEndpoint('saveDistribusi', 'POST', $distribusiData, 'Save distribution');
$distribusiId = extractIdFromResponse($distribusiResponse);

// Test 6.2: Get all Distribusi
testEndpoint('getDistribusi', 'GET', ['tahun' => $TEST_TAHUN, 'page' => 1, 'limit' => 50], 'List distributions');

// ============================================================================
// TEST GROUP 7: DASHBOARD & AGGREGATION
// ============================================================================

echo "\n📋 TEST GROUP 7: DASHBOARD & AGGREGATION\n";
echo "─────────────────────────────────────────────────────────────\n";

// Test 7.1: Get Dashboard Data
testEndpoint('getDashboard', 'GET', ['tahun' => $TEST_TAHUN], 'Get dashboard overview');

// Test 7.2: Get Perhitungan (Calculation)
testEndpoint('getPerhitungan', 'GET', ['tahun' => $TEST_TAHUN], 'Get calculation summary');

// ============================================================================
// TEST GROUP 8: ERROR HANDLING & EDGE CASES
// ============================================================================

echo "\n📋 TEST GROUP 8: ERROR HANDLING & EDGE CASES\n";
echo "─────────────────────────────────────────────────────────────\n";

// Test 8.1: Invalid action
testEndpoint('invalidAction', 'GET', null, 'Invalid action (should error)', true);

// Test 8.2: Missing required field
$incompleteData = ['tahun' => $TEST_TAHUN];
testEndpoint('addHewan', 'POST', $incompleteData, 'Missing required field (should error)', true);

// Test 8.3: Delete operations (clean up test data)
if ($hewanId) {
    testEndpoint('deleteHewan', 'POST', ['id' => $hewanId], 'Delete livestock');
}

if ($penerimaId) {
    testEndpoint('deletePenerima', 'POST', ['id' => $penerimaId], 'Delete beneficiary');
}

if ($keuanganId) {
    testEndpoint('deleteKeuangan', 'POST', ['id' => $keuanganId], 'Delete financial record');
}

if ($panitiaId) {
    testEndpoint('deletePanitia', 'POST', ['id' => $panitiaId], 'Delete committee member');
}

if ($distribusiId) {
    testEndpoint('deleteDistribusi', 'POST', ['id' => $distribusiId], 'Delete distribution');
}

// ============================================================================
// FINAL RESULTS
// ============================================================================

echo "\n";
echo "═══════════════════════════════════════════════════════════\n";
echo "   TEST RESULTS SUMMARY\n";
echo "═══════════════════════════════════════════════════════════\n";
echo "✅ Passed: $PASSED\n";
echo "❌ Failed: $FAILED\n";
echo "📊 Total:  " . ($PASSED + $FAILED) . "\n";
echo "📈 Success Rate: " . round(($PASSED / ($PASSED + $FAILED)) * 100, 2) . "%\n";
echo "═══════════════════════════════════════════════════════════\n\n";

if ($FAILED === 0) {
    echo "🎉 ALL TESTS PASSED! API is working correctly.\n\n";
    exit(0);
} else {
    echo "⚠️  Some tests failed. Review results above.\n\n";
    exit(1);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Execute API test
 */
function testEndpoint($action, $method = 'GET', $data = null, $description = '', $expectError = false) {
    global $BASE_URL, $PASSED, $FAILED, $TEST_RESULTS;
    
    try {
        $url = $BASE_URL . '?action=' . urlencode($action);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        
        if ($method !== 'GET' && $data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            echo "❌ $action - $description\n";
            echo "   Error: $error\n";
            $FAILED++;
            return null;
        }
        
        $decoded = json_decode($response, true);
        $success = isset($decoded['success']) ? $decoded['success'] : false;
        
        // Check if result matches expectation
        if ($expectError) {
            $passed = !$success;
        } else {
            $passed = $success && ($httpCode === 200 || $httpCode === 201);
        }
        
        if ($passed) {
            echo "✅ $action - $description\n";
            echo "   Status: $httpCode, Response: " . substr($response, 0, 80) . "...\n";
            $PASSED++;
        } else {
            echo "❌ $action - $description\n";
            echo "   Status: $httpCode, Response: " . substr($response, 0, 150) . "\n";
            $FAILED++;
        }
        
        return $decoded;
        
    } catch (Exception $e) {
        echo "❌ $action - $description\n";
        echo "   Exception: " . $e->getMessage() . "\n";
        $FAILED++;
        return null;
    }
}

/**
 * Extract ID from API response
 */
function extractIdFromResponse($response) {
    if (is_array($response) && isset($response['data'])) {
        if (isset($response['data']['id'])) {
            return $response['data']['id'];
        } elseif (is_array($response['data']) && !empty($response['data'])) {
            return $response['data'][0]['id'] ?? null;
        }
    }
    return null;
}
?>
