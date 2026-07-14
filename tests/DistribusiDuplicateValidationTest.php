<?php
/**
 * Regression test for duplicate distribution validation.
 * Ensures a second submission for the same RT in the same year is rejected.
 */

$baseUrl = 'http://localhost/Qurban/api/index.php';
$year = 'TEST_DUP_' . date('YmdHis') . '_' . random_int(1000, 9999);

function sendJsonRequest(string $url, array $payload): array {
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => json_encode($payload),
            'ignore_errors' => true,
            'timeout' => 15,
        ]
    ]);

    $response = file_get_contents($url, false, $context);
    $statusLine = $http_response_header[0] ?? 'HTTP/1.1 0';
    preg_match('#HTTP/\d\.\d\s(\d{3})#', $statusLine, $matches);
    $statusCode = isset($matches[1]) ? (int) $matches[1] : 0;

    $body = $response === false ? '' : $response;
    $decoded = json_decode($body, true);

    return [
        'status' => $statusCode,
        'body' => $decoded ?: $body,
    ];
}

$payload = [
    'rows' => [[
        'tahun' => $year,
        'kategori' => 'Per RT',
        'sumber' => 'Sapi',
        'label' => 'RT 99',
        'rt' => '99',
        'beratPerBungkus' => 5,
        'jumlahBungkus' => 2,
        'totalBerat' => 10,
    ]],
];

$first = sendJsonRequest($baseUrl . '?action=saveDistribusi', $payload);
$second = sendJsonRequest($baseUrl . '?action=saveDistribusi', $payload);

if ($first['status'] !== 201 || empty($first['body']['success'])) {
    fwrite(STDERR, "First submission failed unexpectedly.\n" . json_encode($first, JSON_PRETTY_PRINT) . "\n");
    exit(1);
}

$secondSuccess = is_array($second['body']) && !empty($second['body']['success']);
$message = is_array($second['body']) ? ($second['body']['message'] ?? '') : '';

if ($secondSuccess || strpos(strtolower($message), 'sudah pernah dibuat') === false) {
    fwrite(STDERR, "Duplicate validation did not trigger as expected.\n" . json_encode($second, JSON_PRETTY_PRINT) . "\n");
    exit(1);
}

echo "Duplicate validation test passed.\n";
