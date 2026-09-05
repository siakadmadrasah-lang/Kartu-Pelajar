<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config.php';

$results = [];
$status = 'success';

try {
    $pdo = getDbConnection();
    if ($pdo) {
        $results[] = [
            'step' => 'Koneksi MySQL',
            'status' => 'OK',
            'message' => 'Berhasil terhubung ke MySQL Server (' . DB_HOST . ') dengan database ' . DB_NAME
        ];

        // Pastikan tabel madrasah_info, siswa, dan pengaturan_kartu ada
        $sqlFile = __DIR__ . '/database.sql';
        if (file_exists($sqlFile)) {
            $sqlContent = file_get_contents($sqlFile);
            $pdo->exec($sqlContent);
            $results[] = [
                'step' => 'Skema & Tabel Database',
                'status' => 'OK',
                'message' => 'Tabel madrasah_info, siswa, dan pengaturan_kartu berhasil dimigrasi.'
            ];
        }

        $stmt = $pdo->query("SELECT COUNT(*) as total FROM siswa");
        $totalSiswa = $stmt->fetch()['total'] ?? 0;
        $results[] = [
            'step' => 'Data Siswa Terverifikasi',
            'status' => 'OK',
            'message' => "Total siswa tersimpan di database MySQL: $totalSiswa siswa"
        ];

        $stmtM = $pdo->query("SELECT * FROM madrasah_info ORDER BY id ASC LIMIT 1");
        $madrasahRow = $stmtM->fetch();
        if ($madrasahRow) {
            $results[] = [
                'step' => 'Profil Madrasah',
                'status' => 'OK',
                'message' => "Profil Madrasah: " . ($madrasahRow['nama_madrasah'] ?? 'Siap digunakan') . " (NSM: " . ($madrasahRow['nsm'] ?? '-') . ")"
            ];
        }
    } else {
        throw new Exception("Gagal membuat koneksi PDO. Periksa konfigurasi di config.php");
    }
} catch (Exception $e) {
    $status = 'error';
    $results[] = [
        'step' => 'Error Pemasangan',
        'status' => 'FAILED',
        'message' => $e->getMessage()
    ];
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auto Setup MySQL - Kartu Pelajar MI</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans">
    <div class="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div class="bg-gradient-to-r from-emerald-900 to-teal-900 p-6 text-white border-b border-emerald-700">
            <h1 class="text-xl font-black uppercase">Plesk MySQL Auto-Setup & Verifier</h1>
            <p class="text-xs text-emerald-200 mt-1">Status Koneksi & Database Kartu Pelajar Madrasah</p>
        </div>
        <div class="p-6 space-y-4">
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2 font-mono">
                <div class="flex justify-between text-slate-400"><span>Database Name:</span><strong class="text-amber-400"><?= htmlspecialchars(defined('DB_NAME') ? DB_NAME : '-') ?></strong></div>
                <div class="flex justify-between text-slate-400"><span>Database User:</span><strong class="text-emerald-400"><?= htmlspecialchars(defined('DB_USER') ? DB_USER : '-') ?></strong></div>
                <div class="flex justify-between text-slate-400"><span>Host:</span><strong class="text-white"><?= htmlspecialchars(defined('DB_HOST') ? DB_HOST : '-') ?></strong></div>
            </div>

            <div class="space-y-2">
                <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Hasil Verifikasi:</h3>
                <?php foreach ($results as $res): ?>
                    <div class="p-3 rounded-lg border flex items-start justify-between text-xs <?= $res['status'] === 'OK' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-rose-950/40 border-rose-800 text-rose-300' ?>">
                        <div>
                            <strong class="block font-bold"><?= htmlspecialchars($res['step']) ?></strong>
                            <span class="text-[11px] text-slate-300"><?= htmlspecialchars($res['message']) ?></span>
                        </div>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase <?= $res['status'] === 'OK' ? 'bg-emerald-800 text-emerald-100' : 'bg-rose-800 text-rose-100' ?>"><?= $res['status'] ?></span>
                    </div>
                <?php endforeach; ?>
            </div>

            <div class="pt-4 border-t border-slate-800 flex gap-3">
                <a href="./" class="flex-1 text-center py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition">Buka Aplikasi</a>
                <a href="auto_setup.php" class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition">Tes Ulang</a>
            </div>
        </div>
    </div>
</body>
</html>
