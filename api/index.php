<?php
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$host = 'localhost';
$dbName = 'qurban_db';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ]);

    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbName`");

    // Tabel Keuangan
    $pdo->exec("CREATE TABLE IF NOT EXISTS qurban_keuangan (id INT AUTO_INCREMENT PRIMARY KEY, tahun VARCHAR(64), tanggal DATE, jenis VARCHAR(32), ekor DECIMAL(10,2), harga DECIMAL(15,2), keterangan TEXT, nominal DECIMAL(18,2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");
    
    // Tabel Hewan
    $pdo->exec("CREATE TABLE IF NOT EXISTS qurban_hewan (id INT AUTO_INCREMENT PRIMARY KEY, tahun VARCHAR(64), jenis VARCHAR(32), pemilik VARCHAR(255), rt VARCHAR(10), permintaan TEXT, kotor DECIMAL(10,2), daging DECIMAL(10,2), keterangan TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");
    
    // Tabel Penerima
    $pdo->exec("CREATE TABLE IF NOT EXISTS qurban_penerima (id INT AUTO_INCREMENT PRIMARY KEY, tahun VARCHAR(64), nama VARCHAR(255), kategori VARCHAR(32), rt VARCHAR(10), status VARCHAR(32) DEFAULT 'Belum Diambil', panitia_id INT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");
    
    // PERBAIKAN: Tambahkan kolom 'permintaan' jika belum ada (mencegah error SQL)
    $stmt = $pdo->prepare("SHOW COLUMNS FROM qurban_penerima LIKE 'permintaan'");
    $stmt->execute();
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE qurban_penerima ADD COLUMN permintaan TEXT");
    }
    
    // PERBAIKAN: Tambahkan kolom 'panitia_id' jika belum ada untuk sinkronisasi edit Panitia/Penerima
    $stmt = $pdo->prepare("SHOW COLUMNS FROM qurban_penerima LIKE 'panitia_id'");
    $stmt->execute();
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE qurban_penerima ADD COLUMN panitia_id INT NULL");
    }

    // Tabel Panitia
    $pdo->exec("CREATE TABLE IF NOT EXISTS qurban_panitia (id INT AUTO_INCREMENT PRIMARY KEY, tahun VARCHAR(64), nama VARCHAR(255), peran VARCHAR(64), kontak VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");

    // Tabel Distribusi (untuk menyimpan hasil perhitungan/pendistribusian)
    $pdo->exec("CREATE TABLE IF NOT EXISTS qurban_distribusi (id INT AUTO_INCREMENT PRIMARY KEY, tahun VARCHAR(64), kategori VARCHAR(64), sumber VARCHAR(64), label VARCHAR(255), rt VARCHAR(10), berat_per_bungkus DECIMAL(10,2), jumlah_bungkus INT, total_berat DECIMAL(14,2), hewan_id INT NULL, jumlah_sohibul INT DEFAULT 1, berat_per_sohibul DECIMAL(10,2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");

    // PERBAIKAN: Tambahkan kolom tahun jika table sudah ada tapi schema lama belum memuatnya
    $stmt = $pdo->prepare("SHOW COLUMNS FROM qurban_distribusi LIKE 'tahun'");
    $stmt->execute();
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE qurban_distribusi ADD COLUMN tahun VARCHAR(64) AFTER id");
    }

    // PERBAIKAN: Tambahkan kolom hewan_id jika belum ada
    $stmt = $pdo->prepare("SHOW COLUMNS FROM qurban_distribusi LIKE 'hewan_id'");
    $stmt->execute();
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE qurban_distribusi ADD COLUMN hewan_id INT NULL");
    }

    // PERBAIKAN: Tambahkan kolom jumlah_sohibul jika belum ada
    $stmt = $pdo->prepare("SHOW COLUMNS FROM qurban_distribusi LIKE 'jumlah_sohibul'");
    $stmt->execute();
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE qurban_distribusi ADD COLUMN jumlah_sohibul INT DEFAULT 1");
    }

    // PERBAIKAN: Tambahkan kolom berat_per_sohibul jika belum ada
    $stmt = $pdo->prepare("SHOW COLUMNS FROM qurban_distribusi LIKE 'berat_per_sohibul'");
    $stmt->execute();
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE qurban_distribusi ADD COLUMN berat_per_sohibul DECIMAL(10,2)");
    }

    // PERBAIKAN: Tambahkan kolom RT pada tabel hewan jika belum ada
    $stmt = $pdo->prepare("SHOW COLUMNS FROM qurban_hewan LIKE 'rt'");
    $stmt->execute();
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE qurban_hewan ADD COLUMN rt VARCHAR(10) AFTER pemilik");
    }

    // OPTIMASI: Tambahkan INDEX pada kolom-kolom yang sering difilter
    $indexes = [
        'qurban_hewan' => ['tahun', 'jenis', 'rt'],
        'qurban_penerima' => ['tahun', 'rt', 'status'],
        'qurban_panitia' => ['tahun'],
        'qurban_keuangan' => ['tahun', 'jenis'],
        'qurban_distribusi' => ['tahun', 'rt']
    ];
    
    foreach ($indexes as $table => $columns) {
        foreach ($columns as $col) {
            $indexName = $table . '_' . $col . '_idx';
            try {
                $checkIdx = $pdo->prepare("SHOW INDEX FROM `$table` WHERE Key_name = ?");
                $checkIdx->execute([$indexName]);
                if ($checkIdx->rowCount() == 0) {
                    $pdo->exec("ALTER TABLE `$table` ADD INDEX `$indexName` (`$col`)");
                }
            } catch (Exception $e) {
                // ignore index creation failures
            }
        }
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB Connection Error: ' . $e->getMessage()]);
    exit;
}

// Standardize year format across tables
$standardYear = '1447 H / 2026 M';
$tablesToSync = ['qurban_hewan', 'qurban_penerima', 'qurban_panitia', 'qurban_keuangan', 'qurban_distribusi'];
foreach ($tablesToSync as $t) {
    try {
        $pdo->exec("UPDATE `$t` SET tahun = " . $pdo->quote($standardYear));
    } catch (Exception $e) {
        // ignore per-table failures
    }
}

function normalizeOwners($pemilik) {
    if (is_array($pemilik)) {
        $names = array_map('trim', $pemilik);
        $names = array_filter($names, fn($v) => $v !== '');
        return array_values($names);
    }
    if (is_string($pemilik)) {
        $parts = array_map('trim', explode(',', $pemilik));
        $parts = array_filter($parts, fn($v) => $v !== '');
        return array_values($parts);
    }
    return [];
}

function countOwners($pemilik) {
    return count(normalizeOwners($pemilik));
}

function formatOwnersForExport($pemilik) {
    $owners = normalizeOwners($pemilik);
    return !empty($owners) ? implode(', ', $owners) : '-';
}

// PERBAIKAN: Fungsi untuk validasi format tahun
function isValidYearFormat($tahun) {
    $tahun = trim((string)($tahun ?? ''));
    $pattern = '/^\d{4} H \/ \d{4} M$/';
    return (bool)preg_match($pattern, $tahun);
}

function validateYearOrFail($tahun, $fieldName = 'tahun') {
    if (!isValidYearFormat($tahun)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => "Format $fieldName tidak valid. Gunakan format: XXXX H / YYYY M (contoh: 1447 H / 2026 M)"
        ]);
        exit;
    }
}

// OPTIMASI: Helper function untuk pagination
function getPaginationParams() {
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(100, max(10, intval($_GET['limit'] ?? 50))); // default 50, max 100
    $offset = ($page - 1) * $limit;
    return compact('page', 'limit', 'offset');
}

// OPTIMASI: Helper function untuk menghitung total rows
function getTotalRows($pdo, $table, $whereCondition = '', $params = []) {
    $query = "SELECT COUNT(*) as total FROM `$table`" . ($whereCondition ? " WHERE $whereCondition" : '');
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $result = $stmt->fetch();
    return intval($result['total'] ?? 0);
}

// OPTIMASI: Helper function untuk mengembalikan response dengan pagination metadata
function responsePaginated($data, $page, $limit, $total) {
    return [
        'success' => true,
        'data' => $data,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'totalPages' => ceil($total / $limit)
        ]
    ];
}

$action = $_GET['action'] ?? '';
$year = isset($_GET['tahun']) ? trim($_GET['tahun']) : '';
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

try {
    switch ($action) {
        case 'getKeuangan':
            $pag = getPaginationParams();
            $total = getTotalRows($pdo, 'qurban_keuangan');
            $stmt = $pdo->prepare('SELECT id, tahun, tanggal, jenis, ekor, harga, nominal, keterangan FROM qurban_keuangan ORDER BY id DESC, tanggal DESC LIMIT ' . intval($pag['limit']) . ' OFFSET ' . intval($pag['offset']));
            $stmt->execute();
            echo json_encode(responsePaginated($stmt->fetchAll(), $pag['page'], $pag['limit'], $total));
            break;
        
        case 'getHewan':
            $pag = getPaginationParams();
            $total = getTotalRows($pdo, 'qurban_hewan');
            $stmt = $pdo->prepare('SELECT id, tahun, jenis, pemilik, rt, kotor, daging, permintaan, keterangan FROM qurban_hewan ORDER BY id DESC LIMIT ' . intval($pag['limit']) . ' OFFSET ' . intval($pag['offset']));
            $stmt->execute();
            echo json_encode(responsePaginated($stmt->fetchAll(), $pag['page'], $pag['limit'], $total));
            break;
        
        case 'getPenerima':
            $pag = getPaginationParams();
            $total = getTotalRows($pdo, 'qurban_penerima');
            $stmt = $pdo->prepare('SELECT id, tahun, nama, kategori, rt, permintaan, status FROM qurban_penerima ORDER BY id DESC LIMIT ' . intval($pag['limit']) . ' OFFSET ' . intval($pag['offset']));
            $stmt->execute();
            echo json_encode(responsePaginated($stmt->fetchAll(), $pag['page'], $pag['limit'], $total));
            break;
        
        case 'getPanitia':
            $pag = getPaginationParams();
            $total = getTotalRows($pdo, 'qurban_panitia');
            $stmt = $pdo->prepare('SELECT id, tahun, nama, peran, kontak FROM qurban_panitia ORDER BY id DESC LIMIT ' . intval($pag['limit']) . ' OFFSET ' . intval($pag['offset']));
            $stmt->execute();
            echo json_encode(responsePaginated($stmt->fetchAll(), $pag['page'], $pag['limit'], $total));
            break;
        
        case 'getDistribusi':
            $pag = getPaginationParams();
            if ($year !== '') {
                $total = getTotalRows($pdo, 'qurban_distribusi', 'tahun = ?', [$year]);
                $stmt = $pdo->prepare('SELECT id, tahun, kategori, sumber, label, rt, berat_per_bungkus, jumlah_bungkus, total_berat, hewan_id, jumlah_sohibul, berat_per_sohibul FROM qurban_distribusi WHERE tahun = ? ORDER BY id DESC LIMIT ' . intval($pag['limit']) . ' OFFSET ' . intval($pag['offset']));
                $stmt->execute([$year]);
            } else {
                $total = getTotalRows($pdo, 'qurban_distribusi');
                $stmt = $pdo->prepare('SELECT id, tahun, kategori, sumber, label, rt, berat_per_bungkus, jumlah_bungkus, total_berat, hewan_id, jumlah_sohibul, berat_per_sohibul FROM qurban_distribusi ORDER BY id DESC LIMIT ' . intval($pag['limit']) . ' OFFSET ' . intval($pag['offset']));
                $stmt->execute();
            }
            echo json_encode(responsePaginated($stmt->fetchAll(), $pag['page'], $pag['limit'], $total));
            break;

        case 'getDashboard':
            $hewanParams = [];
            $penerimaParams = [];
            $distribusiParams = [];
            $yearCondition = '';
            if ($year !== '') {
                $yearCondition = ' AND tahun = ?';
                $hewanParams[] = $year;
                $penerimaParams[] = $year;
                $distribusiParams[] = $year;
            }

            $sapiStmt = $pdo->prepare("SELECT COUNT(*) AS total_ekor, SUM(kotor) AS total_kotor, SUM(daging) AS total_daging FROM qurban_hewan WHERE jenis LIKE '%SAPI%'" . $yearCondition);
            $sapiStmt->execute($hewanParams);
            $sapi = $sapiStmt->fetch();

            $kambingStmt = $pdo->prepare("SELECT COUNT(*) AS total_ekor, SUM(kotor) AS total_kotor, SUM(daging) AS total_daging FROM qurban_hewan WHERE jenis LIKE '%KAMBING%'" . $yearCondition);
            $kambingStmt->execute($hewanParams);
            $kambing = $kambingStmt->fetch();

            $totalHewanStmt = $pdo->prepare('SELECT COUNT(*) AS total_ekor, SUM(daging) AS total_berat_daging FROM qurban_hewan WHERE 1=1' . $yearCondition);
            $totalHewanStmt->execute($hewanParams);
            $totalHewan = $totalHewanStmt->fetch();

            $totalPenerimaStmt = $pdo->prepare('SELECT COUNT(*) AS total_penerima, SUM(CASE WHEN status = "Sudah Diambil" THEN 1 ELSE 0 END) AS sudah_diambil, SUM(CASE WHEN status != "Sudah Diambil" THEN 1 ELSE 0 END) AS belum_diambil FROM qurban_penerima WHERE 1=1' . $yearCondition);
            $totalPenerimaStmt->execute($penerimaParams);
            $penerima = $totalPenerimaStmt->fetch();

            $rtDistribusiStmt = $pdo->prepare('SELECT rt, COUNT(*) AS total_bks FROM qurban_penerima WHERE 1=1' . $yearCondition . ' GROUP BY rt ORDER BY rt ASC');
            $rtDistribusiStmt->execute($penerimaParams);
            $rtDistribusi = $rtDistribusiStmt->fetchAll();

            echo json_encode(['success' => true, 'data' => [
                'hewan' => [
                    'total' => intval($totalHewan['total_ekor'] ?? 0),
                    'total_berat_daging' => floatval($totalHewan['total_berat_daging'] ?? 0),
                    'sapi' => [
                        'total_ekor' => intval($sapi['total_ekor'] ?? 0),
                        'total_kotor' => floatval($sapi['total_kotor'] ?? 0),
                        'total_daging' => floatval($sapi['total_daging'] ?? 0)
                    ],
                    'kambing' => [
                        'total_ekor' => intval($kambing['total_ekor'] ?? 0),
                        'total_kotor' => floatval($kambing['total_kotor'] ?? 0),
                        'total_daging' => floatval($kambing['total_daging'] ?? 0)
                    ]
                ],
                'penerima' => [
                    'total' => intval($penerima['total_penerima'] ?? 0),
                    'sudah_diambil' => intval($penerima['sudah_diambil'] ?? 0),
                    'belum_diambil' => intval($penerima['belum_diambil'] ?? 0)
                ],
                'rt_distribution' => $rtDistribusi
            ]]);
            break;

        case 'updateHewan':
            try {
                validateYearOrFail($input['tahun'] ?? '', 'tahun');
                if (empty($input['id'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'ID is required for update']);
                    exit;
                }
                
                $jenis = strtoupper(trim($input['jenis'] ?? ''));
                $owners = normalizeOwners($input['pemilik'] ?? '');
                $ownerCount = count($owners);
                if ($jenis === 'SAPI') {
                    if ($ownerCount < 1 || $ownerCount > 7) { 
                        http_response_code(400);
                        echo json_encode(['success'=>false,'message'=>'Sapi harus memiliki 1 sampai 7 pemilik (sebutkan nama masing-masing).']);
                        exit;
                    }
                } else {
                    if ($ownerCount !== 1) { 
                        http_response_code(400);
                        echo json_encode(['success'=>false,'message'=>'Kambing/Domba harus memiliki tepat 1 pemilik.']);
                        exit;
                    }
                }
                $pemilikStr = implode(', ', $owners);
                $stmt = $pdo->prepare('UPDATE qurban_hewan SET tahun=?, jenis=?, pemilik=?, rt=?, permintaan=?, kotor=?, daging=?, keterangan=? WHERE id=?');
                $result = $stmt->execute([
                    $input['tahun'],
                    $input['jenis'], 
                    $pemilikStr, 
                    $input['rt']??'', 
                    $input['permintaan']??'', 
                    $input['kotor']??0, 
                    $input['daging']??0, 
                    $input['keterangan']??'', 
                    $input['id']
                ]);
                if (!$result) {
                    throw new PDOException('Failed to update hewan: ' . json_encode($stmt->errorInfo()));
                }
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Hewan updated successfully']);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
            }
            exit;
            break;

        case 'addKeuangan':
            try {
                validateYearOrFail($input['tahun'] ?? '', 'tahun');
                
                if (empty($input['tahun']) || empty($input['tanggal']) || empty($input['jenis'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Tahun, tanggal, and jenis are required fields']);
                    exit;
                }
                
                $stmt = $pdo->prepare('INSERT INTO qurban_keuangan (tahun, tanggal, jenis, ekor, harga, keterangan, nominal) VALUES (?,?,?,?,?,?,?)');
                $result = $stmt->execute([$input['tahun'], $input['tanggal'], $input['jenis'], $input['ekor']??0, $input['harga']??0, $input['keterangan']??'', $input['nominal']??0]);
                
                if (!$result) {
                    throw new PDOException('Failed to insert keuangan: ' . json_encode($stmt->errorInfo()));
                }
                
                http_response_code(201);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
            }
            exit;
            break;

        case 'addHewan':
            try {
                validateYearOrFail($input['tahun'] ?? '', 'tahun');
                $jenis = strtoupper(trim($input['jenis'] ?? ''));
                $owners = normalizeOwners($input['pemilik'] ?? '');
                $ownerCount = count($owners);
                
                if ($jenis === 'SAPI') {
                    if ($ownerCount < 1 || $ownerCount > 7) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'message' => 'Sapi harus memiliki 1 sampai 7 pemilik (sebutkan nama masing-masing).']);
                        exit;
                    }
                } else {
                    if ($ownerCount !== 1) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'message' => 'Kambing/Domba harus memiliki tepat 1 pemilik.']);
                        exit;
                    }
                }
                
                if (empty($input['tahun']) || empty($jenis)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Tahun and jenis are required fields']);
                    exit;
                }
                
                $pemilikStr = implode(', ', $owners);
                $stmt = $pdo->prepare('INSERT INTO qurban_hewan (tahun, jenis, pemilik, rt, permintaan, kotor, daging, keterangan) VALUES (?,?,?,?,?,?,?,?)');
                $result = $stmt->execute([$input['tahun'], $input['jenis'], $pemilikStr, $input['rt']??'', $input['permintaan']??'', $input['kotor']??0, $input['daging']??0, $input['keterangan']??'']);
                
                if (!$result) {
                    throw new PDOException('Failed to insert hewan: ' . json_encode($stmt->errorInfo()));
                }
                
                http_response_code(201);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
            }
            exit;
            break;

        case 'addPenerima':
            try {
                validateYearOrFail($input['tahun'] ?? '', 'tahun');
                
                if (empty($input['tahun']) || empty($input['nama']) || empty($input['kategori'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Tahun, nama, and kategori are required fields']);
                    exit;
                }
                
                $stmt = $pdo->prepare('INSERT INTO qurban_penerima (tahun, nama, kategori, rt, permintaan, status) VALUES (?,?,?,?,?,?)');
                $result = $stmt->execute([$input['tahun'], $input['nama'], $input['kategori'], $input['rt']??'', $input['permintaan'] ?? '-', $input['status']??'Belum Diambil']);
                
                if (!$result) {
                    throw new PDOException('Failed to insert penerima: ' . json_encode($stmt->errorInfo()));
                }
                
                http_response_code(201);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
            }
            exit;
            break;

        case 'addPanitia':
            validateYearOrFail($input['tahun'] ?? '', 'tahun');
            $pdo->beginTransaction();
            $stmt = $pdo->prepare('INSERT INTO qurban_panitia (tahun, nama, peran, kontak) VALUES (?,?,?,?)');
            $stmt->execute([$input['tahun']??'', $input['nama']??'', $input['peran']??'', $input['kontak']??'']);
            $panitiaId = $pdo->lastInsertId();
            $stmt2 = $pdo->prepare('INSERT INTO qurban_penerima (tahun, nama, kategori, rt, permintaan, status, panitia_id) VALUES (?,?,?,?,?,?,?)');
            $stmt2->execute([
                $input['tahun']??'',
                $input['nama']??'',
                'Panitia',
                '',
                'Panitia ' . ($input['peran'] ?? ''),
                'Belum Diambil',
                $panitiaId
            ]);
            $pdo->commit();
            echo json_encode(['success' => true]); break;

        case 'saveDistribusi':
            try {
                // Validate input
                if (empty($input['rows']) || !is_array($input['rows'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false, 
                        'message' => 'Invalid request: rows array is required and must not be empty'
                    ]);
                    exit;
                }

                // Start transaction for atomic operations
                $pdo->beginTransaction();

                $ids = [];
                $stmt = $pdo->prepare('INSERT INTO qurban_distribusi (tahun, kategori, sumber, label, rt, berat_per_bungkus, jumlah_bungkus, total_berat, hewan_id, jumlah_sohibul, berat_per_sohibul) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
                $checkExistingDistribusi = function(string $tahun, string $kategori, string $rt = '', $hewanId = null) use ($pdo): bool {
                    $normalizedCategory = strtolower(trim($kategori));
                    if ($normalizedCategory === 'per rt') {
                        if ($rt === '') {
                            return false;
                        }
                        $existingStmt = $pdo->prepare('SELECT id FROM qurban_distribusi WHERE tahun = ? AND kategori = ? AND rt = ? LIMIT 1');
                        $existingStmt->execute([$tahun, 'Per RT', $rt]);
                        return (bool) $existingStmt->fetch();
                    }

                    if ($normalizedCategory === 'sahibul qurban' || $normalizedCategory === 'shahibul qurban') {
                        if ($hewanId === null || $hewanId === '') {
                            return false;
                        }
                        $existingStmt = $pdo->prepare('SELECT id FROM qurban_distribusi WHERE tahun = ? AND kategori = ? AND hewan_id = ? LIMIT 1');
                        $existingStmt->execute([$tahun, 'Sahibul Qurban', (int) $hewanId]);
                        return (bool) $existingStmt->fetch();
                    }

                    return false;
                };
                
                foreach ($input['rows'] as $rowIndex => $row) {
                    $kategori = trim((string) ($row['kategori'] ?? ''));
                    $rtValue = trim((string) ($row['rt'] ?? ''));
                    $hewanIdValue = $row['hewanId'] ?? null;

                    // Validate required fields for each row
                    $requiresRt = strtolower($kategori) === 'per rt';
                    if (empty($row['tahun']) || $kategori === '' || ($requiresRt && $rtValue === '') || !isset($row['totalBerat'])) {
                        throw new PDOException("Row " . ($rowIndex + 1) . " is missing required fields: tahun, kategori, rt, or totalBerat");
                    }

                    if ($checkExistingDistribusi((string) $row['tahun'], $kategori, $rtValue, $hewanIdValue)) {
                        throw new PDOException("Distribusi untuk " . ($requiresRt ? "RT {$rtValue}" : 'hewan yang dipilih') . " pada tahun {$row['tahun']} sudah pernah dibuat.");
                    }

                    $executeResult = $stmt->execute([
                        $row['tahun'],
                        $row['kategori'],
                        $row['sumber'] ?? '',
                        $row['label'] ?? '',
                        $row['rt'],
                        $row['beratPerBungkus'] ?? 0,
                        $row['jumlahBungkus'] ?? 0,
                        $row['totalBerat'],
                        $row['hewanId'] ?? null,
                        $row['jumlahSohibul'] ?? 1,
                        $row['beratPerSohibul'] ?? 0
                    ]);

                    if (!$executeResult) {
                        throw new PDOException("Failed to execute insert for row " . ($rowIndex + 1) . ". Statement error info: " . json_encode($stmt->errorInfo()));
                    }

                    $lastId = $pdo->lastInsertId();
                    if (!$lastId) {
                        throw new PDOException("Failed to retrieve last insert ID for row " . ($rowIndex + 1));
                    }

                    $ids[] = $lastId;
                }

                // Commit transaction if all inserts succeeded
                $pdo->commit();

                http_response_code(201);
                echo json_encode([
                    'success' => true, 
                    'message' => 'All distribusi records saved successfully',
                    'ids' => $ids,
                    'count' => count($ids)
                ]);
            } catch (PDOException $e) {
                // Rollback transaction on error
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Database error while saving distribusi: ' . $e->getMessage(),
                    'error_code' => 'DB_INSERT_ERROR'
                ]);
            } catch (Exception $e) {
                // Rollback transaction on error
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Unexpected error: ' . $e->getMessage(),
                    'error_code' => 'UNKNOWN_ERROR'
                ]);
            }
            exit;
            break;

        case 'getTahun':
            // OPTIMASI: Cache di client-side, return cached list dari database
            $stmt = $pdo->query("SELECT DISTINCT tahun FROM qurban_hewan WHERE tahun IS NOT NULL AND tahun != '' UNION SELECT DISTINCT tahun FROM qurban_penerima WHERE tahun IS NOT NULL AND tahun != '' UNION SELECT DISTINCT tahun FROM qurban_panitia WHERE tahun IS NOT NULL AND tahun != '' UNION SELECT DISTINCT tahun FROM qurban_keuangan WHERE tahun IS NOT NULL AND tahun != '' UNION SELECT DISTINCT tahun FROM qurban_distribusi WHERE tahun IS NOT NULL AND tahun != '' ORDER BY tahun DESC");
            $tahunList = array_values(array_filter($stmt->fetchAll(PDO::FETCH_COLUMN), fn($v) => $v !== '' && $v !== null));
            header('Cache-Control: public, max-age=3600'); // Cache for 1 hour
            echo json_encode(['success' => true, 'data' => $tahunList]);
            break;
        
        case 'getRTList':
            // OPTIMASI: Fetch ALL RT values (tidak filter tahun, karena RT adalah data statis per kampung)
            // RT dropdown bisa langsung ter-populate tanpa user klik tahun dulu
            $query = "SELECT DISTINCT rt FROM qurban_penerima WHERE rt IS NOT NULL AND rt != '' AND rt != '-' ORDER BY CAST(rt AS UNSIGNED) ASC";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute();
            $rtList = array_values(array_filter($stmt->fetchAll(PDO::FETCH_COLUMN), fn($v) => $v !== '' && $v !== null));
            
            header('Cache-Control: public, max-age=3600'); // Cache for 1 hour
            echo json_encode(['success' => true, 'data' => $rtList]);
            break;

        case 'debugDatabaseInfo':
            // Debug endpoint untuk check database info
            $countPenerima = $pdo->query("SELECT COUNT(*) as cnt FROM qurban_penerima")->fetch()['cnt'];
            $countHewan = $pdo->query("SELECT COUNT(*) as cnt FROM qurban_hewan")->fetch()['cnt'];
            $countDistribusi = $pdo->query("SELECT COUNT(*) as cnt FROM qurban_distribusi")->fetch()['cnt'];
            $penerimaCategories = $pdo->query("SELECT kategori, COUNT(*) as cnt FROM qurban_penerima GROUP BY kategori")->fetchAll();
            $allRT = $pdo->query("SELECT DISTINCT rt FROM qurban_penerima WHERE rt IS NOT NULL AND rt != '' AND rt != '-' ORDER BY CAST(rt AS UNSIGNED)")->fetchAll(PDO::FETCH_COLUMN);
            $allTahun = $pdo->query("SELECT DISTINCT tahun FROM qurban_penerima WHERE tahun IS NOT NULL AND tahun != '' ORDER BY tahun DESC")->fetchAll(PDO::FETCH_COLUMN);
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'penerima_total' => intval($countPenerima),
                    'hewan_total' => intval($countHewan),
                    'distribusi_total' => intval($countDistribusi),
                    'penerima_by_kategori' => $penerimaCategories,
                    'all_rt_values' => $allRT,
                    'all_tahun_values' => $allTahun
                ]
            ]);
            break;

        case 'debugPenerimaCount':
            // Debug endpoint untuk check penerima dengan Warga kategori
            $wargaCount = $pdo->query("SELECT COUNT(*) as cnt FROM qurban_penerima WHERE kategori = 'Warga'")->fetch()['cnt'];
            $wargaWithRT = $pdo->query("SELECT COUNT(*) as cnt FROM qurban_penerima WHERE kategori = 'Warga' AND rt IS NOT NULL AND rt != '' AND rt != '-'")->fetch()['cnt'];
            $rtDistribution = $pdo->query("SELECT rt, COUNT(*) as cnt FROM qurban_penerima WHERE kategori = 'Warga' AND rt IS NOT NULL AND rt != '' AND rt != '-' GROUP BY rt ORDER BY CAST(rt AS UNSIGNED)")->fetchAll();
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'total_warga' => intval($wargaCount),
                    'warga_with_rt' => intval($wargaWithRT),
                    'rt_distribution' => $rtDistribution
                ]
            ]);
            break;
        
        case 'getWargaCountPerRT':
            // OPTIMASI: Get jumlah Warga per RT untuk perhitungan distribusi (no pagination limits)
            $tahun = isset($_GET['tahun']) ? trim($_GET['tahun']) : '';
            $rt = isset($_GET['rt']) ? trim($_GET['rt']) : '';
            
            if ($tahun === '' || $rt === '') {
                echo json_encode(['success' => false, 'data' => 0]);
                break;
            }
            
            $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM qurban_penerima WHERE kategori = 'Warga' AND rt = ? AND tahun = ?");
            $stmt->execute([$rt, $tahun]);
            $result = $stmt->fetch();
            $count = intval($result['cnt'] ?? 0);
            
            echo json_encode(['success' => true, 'data' => $count]);
            break;
        
        case 'deleteDistribusi':
            try {
                if (empty($_GET['id'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'ID is required for delete']);
                    exit;
                }
                $stmt = $pdo->prepare('DELETE FROM qurban_distribusi WHERE id = ?');
                $result = $stmt->execute([$_GET['id']]);
                if (!$result) {
                    throw new PDOException('Failed to delete distribusi: ' . json_encode($stmt->errorInfo()));
                }
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Distribusi deleted successfully']);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
            }
            exit;
            break;

        case 'updateKeuangan':
            try {
                validateYearOrFail($input['tahun'] ?? '', 'tahun');
                if (empty($input['id'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'ID is required for update']);
                    exit;
                }
                $stmt = $pdo->prepare('UPDATE qurban_keuangan SET tahun=?, tanggal=?, jenis=?, ekor=?, harga=?, keterangan=?, nominal=? WHERE id=?');
                $result = $stmt->execute([
                    $input['tahun'], $input['tanggal']??'', $input['jenis']??'',
                    $input['ekor']??0, $input['harga']??0, $input['keterangan']??'',
                    $input['nominal']??0, $input['id']
                ]);
                if (!$result) {
                    throw new PDOException('Failed to update keuangan: ' . json_encode($stmt->errorInfo()));
                }
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Keuangan updated successfully']);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
            }
            exit;
            break;

        case 'updatePenerima':
            try {
                validateYearOrFail($input['tahun'] ?? '', 'tahun');
                if (empty($input['id'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'ID is required for update']);
                    exit;
                }
                $stmt = $pdo->prepare('UPDATE qurban_penerima SET tahun = ?, nama = ?, kategori = ?, rt = ?, permintaan = ?, status = ? WHERE id = ?');
                $result = $stmt->execute([
                    $input['tahun'],
                    $input['nama']??'',
                    $input['kategori']??'',
                    $input['rt']??'',
                    $input['permintaan']??'-',
                    $input['status']??'Belum Diambil',
                    $input['id']
                ]);
                if (!$result) {
                    throw new PDOException('Failed to update penerima: ' . json_encode($stmt->errorInfo()));
                }
                http_response_code(200);
                echo json_encode(['success' => true, 'message' => 'Penerima updated successfully']);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
            }
            exit;
            break;

        case 'updatePanitia':
            validateYearOrFail($input['tahun'] ?? '', 'tahun');
            $pdo->beginTransaction();
            $stmt = $pdo->prepare('UPDATE qurban_panitia SET tahun = ?, nama = ?, peran = ?, kontak = ? WHERE id = ?');
            $stmt->execute([
                $input['tahun']??'',
                $input['nama']??'',
                $input['peran']??'',
                $input['kontak']??'',
                $input['id']??0
            ]);
            $stmt2 = $pdo->prepare('UPDATE qurban_penerima SET tahun = ?, nama = ?, kategori = ?, rt = ?, permintaan = ? WHERE panitia_id = ?');
            $stmt2->execute([
                $input['tahun']??'',
                $input['nama']??'',
                'Panitia',
                '',
                'Panitia ' . ($input['peran'] ?? ''),
                $input['id']??0
            ]);
            $pdo->commit();
            echo json_encode(['success' => true]); break;

        case 'getPerhitungan':
            $yearCondition = '';
            $params = [];
            if ($year !== '') {
                $yearCondition = ' AND tahun = ?';
                $params[] = $year;
            }

            $stmtSapi = $pdo->prepare("SELECT COUNT(*) as total_ekor, SUM(kotor) as total_kotor FROM qurban_hewan WHERE jenis LIKE '%SAPI%'" . $yearCondition);
            $stmtSapi->execute($params);
            $sapi = $stmtSapi->fetch();

            $stmtKambing = $pdo->prepare("SELECT COUNT(*) as total_ekor, SUM(kotor) as total_kotor FROM qurban_hewan WHERE jenis LIKE '%KAMBING%'" . $yearCondition);
            $stmtKambing->execute($params);
            $kambing = $stmtKambing->fetch();

            $stmtDistribusi = $pdo->prepare('SELECT rt, COUNT(*) as total_bks FROM qurban_penerima WHERE 1=1' . $yearCondition . ' GROUP BY rt');
            $stmtDistribusi->execute($params);
            $distribusi = $stmtDistribusi->fetchAll();

            echo json_encode(['success' => true, 'data' => [
                'sapi' => $sapi,
                'kambing' => $kambing,
                'distribusi' => $distribusi
            ]]);
            break;
        
            case 'deleteKeuangan': $pdo->prepare("DELETE FROM qurban_keuangan WHERE id = ?")->execute([$_GET['id']??0]); echo json_encode(['success' => true]); break;
        case 'deleteHewan': $pdo->prepare("DELETE FROM qurban_hewan WHERE id = ?")->execute([$_GET['id']??0]); echo json_encode(['success' => true]); break;
        case 'deletePenerima': $pdo->prepare("DELETE FROM qurban_penerima WHERE id = ?")->execute([$_GET['id']??0]); echo json_encode(['success' => true]); break;
        case 'deletePanitia':
            $pdo->beginTransaction();
            $pdo->prepare("DELETE FROM qurban_penerima WHERE panitia_id = ?")->execute([$_GET['id']??0]);
            $pdo->prepare("DELETE FROM qurban_panitia WHERE id = ?")->execute([$_GET['id']??0]);
            $pdo->commit();
            echo json_encode(['success' => true]); break;
        case 'updateStatusPenerima': $pdo->prepare('UPDATE qurban_penerima SET status = ? WHERE id = ?')->execute([$_GET['status']??'', $_GET['id']??0]); echo json_encode(['success' => true]); break;

        default:
            echo json_encode(['success' => false, 'message' => 'Action tidak dikenal']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Query Error: ' . $e->getMessage()]);
}
?>