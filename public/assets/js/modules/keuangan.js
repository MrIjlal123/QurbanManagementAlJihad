/**
 * KEUANGAN MODULE - Qurban Management System
 * Functions for financial tracking and accounting (Jurnal Kas)
 * 
 * Dependencies: formatters, helpers, utilities, jsPDF
 * API Endpoint: api.php?action=addKeuangan|updateKeuangan|deleteKeuangan|getKeuangan
 */

// ============================================
// DATA INITIALIZATION & LOADING
// ============================================

/**
 * Initialize keuangan data from server
 * Loads all financial records with pagination
 */
async function initDataKeuangan() {
    try {
        const response = await fetch(`${apiUrl}?action=getKeuangan&page=${paginationKeuangan.page}&limit=${paginationKeuangan.limit}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.success) {
            dataKeuangan = (result.data || []).sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
            paginationKeuangan = result.pagination || paginationKeuangan;
        } else {
            throw new Error(result.message || 'Gagal memuat data');
        }
    } catch (error) {
        console.error("Gagal memuat data keuangan:", error);
        dataKeuangan = [];
    }
    currentPageKeuangan = 1;
    perbaruiDropdownTahun();
    tampilkanDataKeuangan();
}

/**
 * Load perhitungan data for distribution calculations
 * Called from perhitungan tab
 */
async function loadPerhitungan() {
    try {
        const response = await fetch(`${apiUrl}?action=getPerhitungan`);
        const res = await response.json();
        if (!res.success || !res.data) {
            document.getElementById('tabelRingkasan').innerHTML = '<tr><td colspan="4">Tidak ada data perhitungan.</td></tr>';
            document.getElementById('totalEkorRingkasan').innerText = '0';
            document.getElementById('totalKotorRingkasan').innerText = '0';
            document.getElementById('totalDagingRingkasan').innerText = '0';
            return;
        }

        const s = res.data.sapi || { total_ekor: 0, total_kotor: 0 };
        const k = res.data.kambing || { total_ekor: 0, total_kotor: 0 };
        const totalDagingSapi = (parseFloat(s.total_kotor) || 0) * 0.8;
        const totalDagingKambing = (parseFloat(k.total_kotor) || 0) * 0.66;
        const totalDagingMasuk = totalDagingSapi + totalDagingKambing;
        // Sum using raw per-row totals (do not round). Display formatting
        // will show integers without decimals or two decimals when needed.
        const totalDagingDidistribusikan = Array.isArray(distribusiRows)
            ? distribusiRows.reduce((sum, r) => sum + (parseFloat(r.totalBerat || r.total_berat || 0) || 0), 0)
            : 0;
        const balanceDaging = totalDagingMasuk - totalDagingDidistribusikan;

        let html = '';
        html += `<tr><td>Sapi</td><td>${s.total_ekor || 0}</td><td>${parseFloat(s.total_kotor || 0).toFixed(2)}</td><td>${totalDagingSapi.toFixed(2)}</td></tr>`;
        html += `<tr><td>Kambing</td><td>${k.total_ekor || 0}</td><td>${parseFloat(k.total_kotor || 0).toFixed(2)}</td><td>${totalDagingKambing.toFixed(2)}</td></tr>`;

        document.getElementById('tabelRingkasan').innerHTML = html;
        document.getElementById('totalEkorRingkasan').innerText = ((parseInt(s.total_ekor) || 0) + (parseInt(k.total_ekor) || 0)).toString();
        document.getElementById('totalKotorRingkasan').innerText = formatWeight((parseFloat(s.total_kotor || 0) || 0) + (parseFloat(k.total_kotor || 0) || 0));
        document.getElementById('totalDagingRingkasan').innerText = formatWeight(totalDagingMasuk);

        const totalDagingMasukEl = document.getElementById('summaryTotalDagingMasuk');
        const totalDagingDidistribusikanEl = document.getElementById('summaryTotalDagingDidistribusikan');
        const balanceDagingEl = document.getElementById('summaryBalanceDaging');
        const balanceBox = document.getElementById('summaryBalanceBox');
        if (totalDagingMasukEl) totalDagingMasukEl.innerText = formatWeight(totalDagingMasuk);
        if (totalDagingDidistribusikanEl) totalDagingDidistribusikanEl.innerText = formatWeight(totalDagingDidistribusikan);
        if (balanceDagingEl) {
            balanceDagingEl.innerText = formatWeight(balanceDaging);
            // Reset classes
            if (balanceBox) {
                balanceBox.className = 'border rounded-xl p-3 bg-white text-center';
            }
            // Negative: apply premium alert tone
            if (parseFloat(balanceDaging) < 0) {
                if (balanceBox) balanceBox.className = 'bg-rose-50/70 border border-rose-100 rounded-xl p-3 text-center';
                balanceDagingEl.className = 'text-rose-600 font-extrabold text-lg';
            } else {
                // Positive or zero
                balanceDagingEl.className = 'font-extrabold text-lg text-slate-800';
            }
        }
    } catch (error) {
        console.error('Gagal memuat perhitungan:', error);
        document.getElementById('tabelRingkasan').innerHTML = '<tr><td colspan="4">Terjadi kesalahan saat memuat data.</td></tr>';
    }
}

// ============================================
// FORM HANDLING & SUBMISSION
// ============================================

/**
 * Add or update keuangan record
 */
async function tambahKeuangan() {
    const idKeuanganEl = document.getElementById('id-keuangan') || document.getElementById('idKeuangan');
    const idKeuangan = idKeuanganEl ? idKeuanganEl.value : '';
    
    const ekorEl = document.getElementById('ekorKeuangan');
    const ekorValue = ekorEl ? (parseFloat(ekorEl.value) || 1) : 1;
    
    const hargaEl = document.getElementById('hargaEkorKeuangan');
    const hargaValue = hargaEl ? (parseFloat(hargaEl.value) || 0) : 0;
    
    const nominalAkhir = ekorValue * hargaValue;

    if (nominalAkhir <= 0) {
        showToast("Harap masukkan Jumlah dan Harga Satuan dengan benar terlebih dahulu agar nominal terhitung!", 'warning');
        return;
    }

    const tanggalInput = document.getElementById('tanggal');
    const tanggalValue = tanggalInput ? tanggalInput.value : '';

    const tahunInput = document.getElementById('tahun') || document.getElementById('tahunKeuangan');
    const jenisEl = document.getElementById('jenisKeuangan');
    const keteranganEl = document.getElementById('keteranganKeuangan');
    
    const payload = {
        tahun: tahunInput ? tahunInput.value : '',
        tanggal: tanggalValue,
        jenis: jenisEl ? jenisEl.value : 'Pemasukan',
        ekor: ekorValue,
        harga: hargaValue,
        keterangan: keteranganEl ? keteranganEl.value : '',
        nominal: nominalAkhir
    };

    const action = idKeuangan ? 'updateKeuangan' : 'addKeuangan';
    if (idKeuangan) payload.id = idKeuangan;

    try {
        const response = await fetch(`${apiUrl}?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
            showToast("Data keuangan berhasil disimpan!", 'success');
            if (window.logSystemActivity) {
                window.logSystemActivity(idKeuangan ? 'Data keuangan diperbarui.' : 'Data keuangan ditambahkan.');
            }
            await initDataKeuangan();
            if (idKeuangan) {
                resetFormKeuangan();
            } else {
                const formEl = document.getElementById('formKeuangan');
                if (formEl) formEl.reset();
                
                const tahunInput = document.getElementById('tahun') || document.getElementById('tahunKeuangan');
                if (tahunInput) tahunInput.value = getCurrentYearFormatted();
                
                const ekorInput = document.getElementById('ekorKeuangan');
                if (ekorInput) ekorInput.value = '1';
                
                const nominalInput = document.getElementById('nominalKeuangan');
                if (nominalInput) nominalInput.value = '';
            }
        } else {
            showToast("Gagal: " + result.message, 'error');
        }
    } catch (e) {
        showToast("Gagal terhubung ke server. Pastikan XAMPP sudah Start!", 'error');
        console.error(e);
    }
}

/**
 * Handle keuangan form submission
 */
document.addEventListener('DOMContentLoaded', function() {
    const formKeuangan = document.getElementById('formKeuangan');
    if (formKeuangan) {
        formKeuangan.addEventListener('submit', async function(e) {
            e.preventDefault();
            await tambahKeuangan();
        });
    }

    const elEkor = document.getElementById('ekorKeuangan');
    const elHarga = document.getElementById('hargaEkorKeuangan');
    if (elEkor && elHarga) {
        elEkor.addEventListener('input', hitungOtomatisNominal);
        elEkor.addEventListener('change', hitungOtomatisNominal);
        elHarga.addEventListener('input', hitungOtomatisNominal);
        elHarga.addEventListener('change', hitungOtomatisNominal);
    }
});

/**
 * Calculate nominal automatically based on ekor and harga
 */
function hitungOtomatisNominal() {
    const elEkor = document.getElementById('ekorKeuangan');
    const elHarga = document.getElementById('hargaEkorKeuangan');
    const elNominal = document.getElementById('nominalKeuangan');

    if (elEkor && elHarga && elNominal) {
        const ekor = parseFloat(elEkor.value) || 0;
        const harga = parseFloat(elHarga.value) || 0;
        const hasilKali = ekor * harga;
        elNominal.value = hasilKali > 0 ? hasilKali : '';
    }
}

// ============================================
// TABLE DISPLAY & PAGINATION
// ============================================

/**
 * Display keuangan data in table with pagination
 */
function tampilkanDataKeuangan() {
    const daftarKeuangan = Array.isArray(dataKeuangan) ? dataKeuangan : [];

    const tabelLayar = document.getElementById('tabelKeuanganLayar');
    const tabelPdf = document.getElementById('tabelKeuanganPdfBody');
    const pagination = document.getElementById('paginationKeuangan');
    const filterTahunSelect = document.getElementById('filterTahunKeuangan');
    const filterTahun = filterTahunSelect ? filterTahunSelect.value : 'SemuaTahun';
    
    if (tabelLayar) tabelLayar.innerHTML = '';
    if (tabelPdf) tabelPdf.innerHTML = '';

    let totalMasuk = 0;
    let totalKeluar = 0;

    const dataFilter = daftarKeuangan.filter(k => filterTahun === 'SemuaTahun' || k.tahun === filterTahun);
    // Sort by id descending (newest first)
    dataFilter.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
    const totalItems = dataFilter.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPageKeuangan));
    if (currentPageKeuangan > totalPages) currentPageKeuangan = totalPages;
    if (currentPageKeuangan < 1) currentPageKeuangan = 1;
    const startIndex = (currentPageKeuangan - 1) * itemsPerPageKeuangan;
    const pageItems = dataFilter.slice(startIndex, startIndex + itemsPerPageKeuangan);

    if (pageItems.length === 0) {
        if (tabelLayar) tabelLayar.innerHTML = `<tr><td colspan="7" class="px-4 py-6 text-center text-sm text-slate-400">Tidak ada data keuangan untuk filter ini.</td></tr>`;
    } else {
        pageItems.forEach((k, idx) => {
            const pmskn = k.jenis === 'Pemasukan' ? parseFloat(k.nominal) : 0;
            const penglran = k.jenis === 'Pengeluaran' ? parseFloat(k.nominal) : 0;

            totalMasuk += pmskn;
            totalKeluar += penglran;

            const ekorValue = k.ekor || 0;
            const hargaValue = typeof k.harga === 'number' ? k.harga : parseFloat(k.harga) || 0;
            const rumusDetail = ekorValue > 0 && hargaValue > 0
                ? `${ekorValue} x ${hargaValue.toLocaleString('id-ID')}`
                : '-';

            if (tabelLayar) {
                tabelLayar.innerHTML += `<tr class="transition hover:bg-slate-50">
                    <td class="font-bold text-slate-900">${k.tahun || '-'}</td>
                    <td>${k.tanggal || '-'}</td>
                    <td class="text-start font-medium text-slate-900">${k.keterangan || '-'}</td>
                    <td><small class="text-slate-400">${rumusDetail}</small></td>
                    <td class="text-slate-600">${pmskn > 0 ? `<span class="text-emerald-600 font-bold">${formatRupiah(pmskn)}</span>` : '-'}</td>
                    <td class="text-slate-600">${penglran > 0 ? `<span class="text-rose-600 font-bold">${formatRupiah(penglran)}</span>` : '-'}</td>
                    <td class="no-print"><div class="flex justify-center gap-2"><button class="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50" onclick="editKeuangan(${k.id})">Ubah</button><button class="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50" onclick="hapusKeuangan(${k.id})">Hapus</button></div></td>
                </tr>`;
            }

            if (tabelPdf) {
                tabelPdf.innerHTML += `<tr>
                    <td>${startIndex + idx + 1}</td>
                    <td>${k.tahun || '-'}</td>
                    <td>${k.tanggal || '-'}</td>
                    <td class="text-start">${k.keterangan || '-'}</td>
                    <td><small>${rumusDetail}</small></td>
                    <td class="text-success">${pmskn > 0 ? formatRupiah(pmskn) : '-'}</td>
                    <td class="text-danger">${penglran > 0 ? formatRupiah(penglran) : '-'}</td>
                </tr>`;
            }
        });
    }

    renderPaginationControls('paginationKeuangan', currentPageKeuangan, totalPages, 'goToKeuanganPage');

    const kasBersih = totalMasuk - totalKeluar;

    if (document.getElementById('totalPemasukanLayar')) document.getElementById('totalPemasukanLayar').innerText = formatRupiah(totalMasuk);
    if (document.getElementById('totalPengeluaranLayar')) document.getElementById('totalPengeluaranLayar').innerText = formatRupiah(totalKeluar);
    if (document.getElementById('saldoAkhirLayar')) document.getElementById('saldoAkhirLayar').innerText = formatRupiah(kasBersih);

    if (document.getElementById('pdfTotalMasuk')) document.getElementById('pdfTotalMasuk').innerText = formatRupiah(totalMasuk);
    if (document.getElementById('pdfTotalKeluar')) document.getElementById('pdfTotalKeluar').innerText = formatRupiah(totalKeluar);
    if (document.getElementById('pdfTotalSaldo')) document.getElementById('pdfTotalSaldo').innerText = formatRupiah(kasBersih);
}

/**
 * Navigate to keuangan table page
 * @param {number} page - Page number
 */
function goToKeuanganPage(page) {
    currentPageKeuangan = page;
    tampilkanDataKeuangan();
}

// ============================================
// EDIT & DELETE FUNCTIONS
// ============================================

/**
 * Edit existing keuangan record
 * @param {number} id - Keuangan ID
 */
function editKeuangan(id) {
    const item = dataKeuangan.find(k => String(k.id) === String(id));
    if (!item) return;
    
    const idEl = document.getElementById('id-keuangan');
    if (idEl) idEl.value = item.id;
    
    const tahunEl = document.getElementById('tahun');
    if (tahunEl) tahunEl.value = item.tahun || '';
    
    const tanggalEl = document.getElementById('tanggal');
    if (tanggalEl) tanggalEl.value = item.tanggal || '';
    
    const jenisEl = document.getElementById('jenisKeuangan');
    if (jenisEl) jenisEl.value = item.jenis || 'Pemasukan';
    
    const ekorEl = document.getElementById('ekorKeuangan');
    if (ekorEl) ekorEl.value = item.ekor || 1;
    
    const hargaEl = document.getElementById('hargaEkorKeuangan');
    if (hargaEl) hargaEl.value = item.harga || '';
    
    const keteranganEl = document.getElementById('keteranganKeuangan');
    if (keteranganEl) keteranganEl.value = item.keterangan || '';
    
    const nominalEl = document.getElementById('nominalKeuangan');
    if (nominalEl) nominalEl.value = item.nominal || '';
    
    const submitBtn = document.getElementById('submitKeuanganBtn');
    if (submitBtn) submitBtn.innerText = 'Simpan Perubahan';
    
    const cancelBtn = document.getElementById('cancelEditKeuangan');
    if (cancelBtn) cancelBtn.style.display = 'block';
}

/**
 * Reset keuangan form to initial state
 */
function resetFormKeuangan() {
    const formKeuangan = document.getElementById('formKeuangan');
    if (formKeuangan) formKeuangan.reset();
    
    const idKeuanganEl = document.getElementById('id-keuangan');
    if (idKeuanganEl) idKeuanganEl.value = '';
    
    const tahunInput = document.getElementById('tahun') || document.getElementById('tahunKeuangan');
    if (tahunInput) tahunInput.value = getCurrentYearFormatted();
    
    const ekorInput = document.getElementById('ekorKeuangan');
    if (ekorInput) ekorInput.value = '1';
    
    const hargaInput = document.getElementById('hargaEkorKeuangan');
    if (hargaInput) hargaInput.value = '';
    
    const nominalInput = document.getElementById('nominalKeuangan');
    if (nominalInput) nominalInput.value = '';
    
    const submitBtn = document.getElementById('submitKeuanganBtn');
    if (submitBtn) submitBtn.innerText = 'Tambahkan ke Jurnal';
    
    const cancelBtn = document.getElementById('cancelEditKeuangan');
    if (cancelBtn) cancelBtn.style.display = 'none';
}

/**
 * Delete keuangan record
 * @param {number} id - Keuangan ID
 */
async function hapusKeuangan(id) {
    if(!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;
    try {
        const response = await fetch(`${apiUrl}?action=deleteKeuangan&id=${encodeURIComponent(id)}`, {
            method: 'POST'
        });
        const result = await parseJsonResponse(response);
        if (!result || !result.success) {
            showToast(result?.message || 'Gagal menghapus jurnal.', 'error');
            return;
        }
        if (window.logSystemActivity) {
            window.logSystemActivity('Data keuangan dihapus.');
        }
        await initDataKeuangan();
    } catch (error) {
        console.error(error);
        showToast('Terjadi kesalahan saat menghapus jurnal.', 'error');
    }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export keuangan data to PDF
 */
function cetakPDFKeuanganSaja() {
    const th = document.getElementById('filterTahunKeuangan') ? document.getElementById('filterTahunKeuangan').value : 'SemuaTahun';
    const label = th === 'SemuaTahun' ? 'Semua Akuntansi Jurnal Kas' : 'Tahun Anggaran Finansial: ' + th;
    const safeName = th.replace(/[^a-zA-Z0-9]/g, '_');
    const daftarKeuangan = Array.isArray(dataKeuangan) ? dataKeuangan : [];
    const keuanganToPrint = daftarKeuangan.filter(k => th === 'SemuaTahun' || k.tahun === th);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(16);
    doc.setTextColor(27, 94, 32);
    doc.text('LAPORAN REKAPITULASI KEUANGAN QURBAN MASJID AL JIHAD', 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(87, 107, 85);
    doc.text(label, 14, 26);
    doc.setDrawColor(42, 143, 93);
    doc.setLineWidth(0.8);
    doc.line(14, 30, pageWidth - 14, 30);

    let totalMasuk = 0;
    let totalKeluar = 0;
    const body = keuanganToPrint.map((k, idx) => {
        const pmskn = k.jenis === 'Pemasukan' ? parseFloat(k.nominal) : 0;
        const penglran = k.jenis === 'Pengeluaran' ? parseFloat(k.nominal) : 0;
        totalMasuk += pmskn;
        totalKeluar += penglran;
        const ekorValue = k.ekor || 0;
        const hargaValue = typeof k.harga === 'number' ? k.harga : parseFloat(k.harga) || 0;
        const rumusDetail = ekorValue > 0 && hargaValue > 0 ? `${ekorValue} x ${hargaValue.toLocaleString('id-ID')}` : '-';
        return [
            idx + 1,
            STANDARD_YEAR,
            k.tanggal || '-',
            k.keterangan || '-',
            rumusDetail,
            pmskn > 0 ? formatRupiah(pmskn) : '-',
            penglran > 0 ? formatRupiah(penglran) : '-'
        ];
    });

    const kasBersih = totalMasuk - totalKeluar;

    doc.autoTable({
        startY: 36,
        theme: 'grid',
        head: [['No', 'Tahun', 'Tanggal', 'Uraian / Keterangan', 'Detail Rumus', 'Pemasukan (Rp)', 'Pengeluaran (Rp)']],
        body,
        showHead: 'everyPage',
        headStyles: { fillColor: [42, 143, 93], textColor: [255, 255, 255], halign: 'center' },
        bodyStyles: { fontSize: 9 },
        styles: { cellPadding: 3, font: 'helvetica', overflow: 'linebreak' },
        rowPageBreak: 'auto',
        margin: { left: 14, right: 14 },
        didDrawPage: () => {
            const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
            doc.setFontSize(9);
            doc.setTextColor(120);
            doc.text(`Halaman ${pageNumber}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
        }
    });

    if (body.length > 0) {
        const summaryY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : 45;
        doc.setFontSize(10);
        doc.setTextColor(87, 107, 85);
        doc.text(`Total Pemasukan: ${formatRupiah(totalMasuk)}`, 14, summaryY);
        doc.text(`Total Pengeluaran: ${formatRupiah(totalKeluar)}`, 14, summaryY + 5);
        doc.text(`Saldo Bersih: ${formatRupiah(kasBersih)}`, 14, summaryY + 10);
    } else {
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('Tidak ada data keuangan untuk filter yang dipilih.', 14, 45);
    }

    doc.save(`Laporan_Finansial_Kas_Qurban_${safeName}.pdf`);
}

/**
 * Format rupiah currency
 * @param {number} angka - Amount to format
 * @returns {string} Formatted rupiah string
 */
function formatRupiah(angka) {
    return "Rp " + parseFloat(angka).toLocaleString('id-ID');
}

if(typeof module !== 'undefined') module.exports = {
    initDataKeuangan,
    loadPerhitungan,
    tambahKeuangan,
    hitungOtomatisNominal,
    tampilkanDataKeuangan,
    goToKeuanganPage,
    editKeuangan,
    resetFormKeuangan,
    hapusKeuangan,
    cetakPDFKeuanganSaja,
    formatRupiah
};
