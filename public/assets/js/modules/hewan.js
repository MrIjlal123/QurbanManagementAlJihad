/**
 * HEWAN MODULE - Qurban Management System
 * Functions for animal inventory management (Sapi, Kambing, Domba)
 * 
 * Dependencies: formatters, helpers, utilities
 * API Endpoint: api.php?action=addHewan|updateHewan|deleteHewan|getHewan
 */

// ============================================
// HEADER RENDERING
// ============================================

/**
 * Render the modern header panel for hewan inventory section
 * Returns a complete template string with Tailwind CSS styling
 * Includes title, subtitle, filter dropdown, and PDF export button
 */
function renderHewanHeader() {
    return `
    <div class="w-full bg-white p-5 rounded-xl shadow-sm border border-slate-100/60 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <!-- Text Label Grouping (LEFT) -->
        <div>
            <h3 class="text-lg font-bold text-slate-800">Daftar Inventaris & Laporan Timbangan Hewan</h3>
            <p class="text-xs text-slate-400 mt-1">Tabel inventaris hewan yang responsif dan mudah dibaca.</p>
        </div>
        
        <!-- Horizontal Controls Row (RIGHT) -->
        <div class="flex items-center gap-3 self-start sm:self-center">
            <select id="filterTahunHewan" class="h-10 w-40 rounded-xl border border-slate-200 bg-slate-50/40 px-3 text-sm text-slate-600 focus:ring-1 focus:ring-emerald-500 outline-none transition-all" onchange="currentPageHewan = 1; tampilkanDataHewan()">
                <option value="SemuaTahun">Semua Tahun</option>
            </select>
            <button type="button" class="h-10 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold px-4 rounded-xl text-sm flex items-center gap-1.5 transition-all" onclick="cetakPDFHewanSaja()" title="Export to PDF">
                <i class="bi bi-file-pdf"></i>
                <span>PDF Hewan</span>
            </button>
        </div>
    </div>
    `;
}

// ============================================
// DATA INITIALIZATION & LOADING
// ============================================

/**
 * Initialize hewan data from server
 * Loads all animal inventory data with pagination
 */
async function initDataHewan() {
    try {
        const response = await fetch(`${apiUrl}?action=getHewan&page=${paginationHewan.page}&limit=${paginationHewan.limit}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.success) {
            dataHewan = (result.data || []).sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
            paginationHewan = result.pagination || paginationHewan;
        } else {
            throw new Error(result.message || 'Gagal memuat data');
        }
    } catch (error) {
        console.error("Gagal memuat data hewan:", error);
        dataHewan = [];
    }
    currentPageHewan = 1;
    perbaruiDropdownTahun();
    
    // Render header into container
    const headerContainer = document.getElementById('hewanHeaderContainer');
    if (headerContainer) {
        headerContainer.innerHTML = renderHewanHeader();
    }
    
    await loadDashboardMetrics();
    tampilkanDataHewan();
    updateDashboard();
}

// ============================================
// HEWAN OWNER FIELD MANAGEMENT
// ============================================

/**
 * Create a new owner field row for hewan form
 * @returns {HTMLElement} Owner field wrapper
 */
function createHewanOwnerRow() {
    const wrapper = document.createElement('div');
    wrapper.className = 'hewan-owner-row d-flex gap-2 align-items-center';
    wrapper.innerHTML = `
        <input type="text" class="hewan-owner-name form-control flex-grow-1" style="min-height: 40px;" placeholder="Nama pemilik" required>
        <button type="button" class="btn btn-sm btn-outline-secondary flex-shrink-0" style="min-height: 40px; min-width: 44px;" onclick="removeHewanOwnerField(this)" title="Hapus">−</button>
    `;
    return wrapper;
}

/**
 * Add a new owner field to hewan form
 * Max 7 owners for sapi, 1 for kambing/domba
 */
function addHewanOwnerField() {
    const container = document.getElementById('pemilikFieldsContainerHewan');
    if (!container) return;
    const jenis = document.getElementById('jenisHewan') ? document.getElementById('jenisHewan').value : 'Kambing';
    const current = container.querySelectorAll('.hewan-owner-row').length;
    const maxOwners = jenis.toLowerCase() === 'sapi' ? 7 : 1;
    
    if (current >= maxOwners) {
        if (maxOwners === 1) {
            showToast(`Jumlah pemilik ${jenis} maksimal 1 orang.`, 'warning');
        } else {
            showToast(`Jumlah pemilik ${jenis} maksimal ${maxOwners} orang.`, 'warning');
        }
        return;
    }
    container.appendChild(createHewanOwnerRow());
    updateHewanOwnerControls();
}

/**
 * Remove owner field from hewan form
 * @param {HTMLElement} button - Remove button element
 */
function removeHewanOwnerField(button) {
    const row = button.closest('.hewan-owner-row');
    if (!row) return;
    row.remove();
    updateHewanOwnerControls();
}

/**
 * Update owner field controls based on animal type and count
 * Hides remove buttons if only 1 owner, hides add button if max owners reached
 */
function updateHewanOwnerControls() {
    const container = document.getElementById('pemilikFieldsContainerHewan');
    if (!container) return;
    const jenis = document.getElementById('jenisHewan') ? document.getElementById('jenisHewan').value : 'Kambing';
    const maxOwners = jenis.toLowerCase() === 'sapi' ? 7 : 1;
    const rows = container.querySelectorAll('.hewan-owner-row');
    
    rows.forEach((row, idx) => {
        const btn = row.querySelector('button');
        if (btn) btn.style.display = rows.length === 1 ? 'none' : 'block';
    });
    
    const addBtn = document.getElementById('addPemilikHewanBtn');
    if (addBtn) addBtn.style.display = (rows.length >= maxOwners) ? 'none' : 'inline-block';
}

/**
 * Set hewan owner field count based on jenis
 * @param {number} count - Number of owner fields to create
 */
function setHewanOwnerFields(count) {
    const container = document.getElementById('pemilikFieldsContainerHewan');
    if (!container) return;
    container.innerHTML = '';
    const n = Math.max(1, Math.min(7, parseInt(count) || 1));
    for (let i = 0; i < n; i++) container.appendChild(createHewanOwnerRow());
    updateHewanOwnerControls();
}

/**
 * Adjust owner fields based on selected animal type
 * Sapi: 7 fields (dapat multiple pemilik)
 * Kambing/Domba: 1 field (single owner)
 */
function adjustOwnerFieldsForJenis() {
    const jenis = document.getElementById('jenisHewan') ? document.getElementById('jenisHewan').value : 'Kambing';
    if (jenis.toLowerCase() === 'sapi') {
        setHewanOwnerFields(7);
    } else {
        setHewanOwnerFields(1);
    }
}

// ============================================
// FORM HANDLING & SUBMISSION
// ============================================

/**
 * Format berat daging dengan dua digit desimal hanya saat ada pecahan.
 * Contoh: 10 -> "10 KG", 10.5 -> "10.50 KG"
 * @param {number|string} value - Berat yang akan diformat
 * @returns {string} String berat yang diformat
 */
function formatBeratDaging(value) {
    const numericValue = parseFloat(value);
    if (Number.isNaN(numericValue)) return '';

    if (numericValue === 0) return '';

    const roundedValue = Number(numericValue.toFixed(2));
    const formattedValue = Number.isInteger(roundedValue) ? roundedValue.toString() : roundedValue.toFixed(2);
    return formattedValue;
}

/**
 * Format berat kotor: no decimals when whole number, two decimals when fractional.
 * Example: 18 -> "18 KG", 18.5 -> "18.50 KG"
 * @param {number|string} value
 * @returns {string}
 */
function formatBeratKotor(value) {
    const numericValue = parseFloat(value);
    if (Number.isNaN(numericValue)) return '';

    if (numericValue === 0) return '';

    const rounded = Math.round(numericValue * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

/**
 * Calculate estimated berat bersih (netto) based on jenis and berat kotor
 * Uses coefficients: Sapi 0.8, Kambing/Domba 0.66
 */
function hitungEstimasiDaging() {
    const beratKotorEl = document.getElementById('beratKotor');
    const kotor = beratKotorEl ? parseFloat(beratKotorEl.value) || 0 : 0;
    
    const jenisEl = document.getElementById('jenisHewan');
    const jenis = jenisEl ? jenisEl.value : 'Kambing';
    
    const multiplier = getMultiplierHewan(jenis);
    const daging = kotor * multiplier;
    
    const beratDagingEl = document.getElementById('beratDaging');
    if (beratDagingEl) {
        beratDagingEl.value = daging === 0 ? '' : formatBeratDaging(daging);
    }
}

/**
 * Get meat multiplier based on animal type
 * @param {string} jenis - Animal type (Sapi, Kambing, Domba)
 * @returns {number} Multiplier coefficient
 */
function getMultiplierHewan(jenis) {
    const lower = jenis ? jenis.toString().toLowerCase().trim() : '';
    switch (lower) {
        case 'sapi':
            return COEFFICIENT_SAPI; // 0.8
        case 'kambing':
        case 'domba':
            return COEFFICIENT_KAMBING; // 0.66
        default:
            return COEFFICIENT_KAMBING;
    }
}

/**
 * Handle hewan form submission
 * Creates or updates animal inventory record
 */
document.addEventListener('DOMContentLoaded', function() {
    const formHewan = document.getElementById('formHewan');
    if (formHewan) {
        formHewan.addEventListener('submit', async function(e) {
            e.preventDefault();

            const idHewanEl = document.getElementById('idHewan');
            const idHewan = idHewanEl ? idHewanEl.value : '';
            
            const jenisHewanEl = document.getElementById('jenisHewan');
            const jenisHewan = jenisHewanEl ? jenisHewanEl.value : 'Kambing';
            
            const beratKotorEl = document.getElementById('beratKotor');
            const beratKotorValue = beratKotorEl ? parseFloat(beratKotorEl.value) || 0 : 0;
            
            const multiplierHewan = getMultiplierHewan(jenisHewan);
            const dagingValue = parseFloat((beratKotorValue * multiplierHewan).toFixed(2));

            const beratDagingEl = document.getElementById('beratDaging');
            if (beratDagingEl) {
                beratDagingEl.value = dagingValue === 0 ? '' : formatBeratDaging(dagingValue);
            }

            let pemilikValue = '';
            const pemilikContainer = document.getElementById('pemilikFieldsContainerHewan');
            if (pemilikContainer) {
                const names = [...pemilikContainer.querySelectorAll('.hewan-owner-name')].map(i => i.value.trim()).filter(Boolean);
                pemilikValue = names;
            } else {
                const pemilikEl = document.getElementById('pemilikHewan');
                pemilikValue = pemilikEl ? pemilikEl.value : '';
            }

            const tahunEl = document.getElementById('tahunHewan');
            const rtEl = document.getElementById('rtHewan');
            const permintaanEl = document.getElementById('permintaanHewan');
            const keteranganEl = document.getElementById('keteranganHewan');

            const payload = {
                tahun: tahunEl ? tahunEl.value : '',
                rt: rtEl ? (rtEl.value || '-') : '-',
                jenis: jenisHewan,
                pemilik: pemilikValue,
                permintaan: permintaanEl ? (permintaanEl.value || '-') : '-',
                kotor: beratKotorValue,
                daging: dagingValue,
                keterangan: keteranganEl ? (keteranganEl.value || '-') : '-'
            };

            const action = idHewan ? 'updateHewan' : 'addHewan';
            if (idHewan) payload.id = idHewan;

            try {
                const response = await fetch(`${apiUrl}?action=${action}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (!result.success) {
                    showToast(result.message || 'Gagal menyimpan data hewan ke MySQL.', 'error');
                    return;
                }

                showToast('Data hewan berhasil disimpan!', 'success');
                if (window.logSystemActivity) {
                    window.logSystemActivity(idHewan ? 'Data hewan diperbarui.' : 'Data hewan ditambahkan.');
                }
                await initDataHewan();
                if (idHewan) resetFormHewan();
            } catch (error) {
                console.error(error);
                showToast('Terjadi kesalahan saat menyimpan data hewan.', 'error');
                return;
            }

            if (!idHewan) {
                this.reset();
                const tahunEl = document.getElementById('tahunHewan');
                if (tahunEl) tahunEl.value = "1447 H / 2026 M";
                const beratEl = document.getElementById('beratDaging');
                if (beratEl) beratEl.value = '';
            }
        });
    }
});

// ============================================
// TABLE DISPLAY & PAGINATION
// ============================================

/**
 * Display hewan data in table with pagination
 */
function tampilkanDataHewan() {
    const tabelLayar = document.getElementById('tabelHewanLayar');
    const tabelPdfBody = document.getElementById('tabelHewanPdfBody');
    const tabelPdfSajaBody = document.getElementById('tabelHewanPdfSajaBody');
    const pagination = document.getElementById('paginationHewan');
    const filterTahunSelect = document.getElementById('filterTahunHewan');
    const filterTahun = filterTahunSelect ? filterTahunSelect.value : 'SemuaTahun';
    
    const daftarHewan = Array.isArray(dataHewan) ? dataHewan : [];

    if (tabelLayar) tabelLayar.innerHTML = '';
    if (tabelPdfBody) tabelPdfBody.innerHTML = '';
    if (tabelPdfSajaBody) tabelPdfSajaBody.innerHTML = '';

    const hewanTerfilter = daftarHewan.filter(h => filterTahun === 'SemuaTahun' || h.tahun === filterTahun);
    // Sort by id descending (newest first)
    hewanTerfilter.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
    const totalItems = hewanTerfilter.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPageHewan));
    if (currentPageHewan > totalPages) currentPageHewan = totalPages;
    if (currentPageHewan < 1) currentPageHewan = 1;
    const startIndex = (currentPageHewan - 1) * itemsPerPageHewan;
    const pageItems = hewanTerfilter.slice(startIndex, startIndex + itemsPerPageHewan);

    if (pageItems.length === 0) {
        if (tabelLayar) tabelLayar.innerHTML = `<tr><td colspan="9" class="px-4 py-6 text-center text-sm text-slate-400">Tidak ada data hewan untuk filter ini.</td></tr>`;
    } else {
        pageItems.forEach((h, index) => {
            const rtValue = h.rt && h.rt !== '-' ? formatRtLabel(h.rt) : '-';
            const beratKotor = parseFloat(h.kotor || 0) || 0;
            const beratNetto = h.daging && parseFloat(h.daging) > 0 ? parseFloat(h.daging) : calculateBeratBersih(beratKotor, h.jenis);
            const row = `<tr class="transition hover:bg-slate-50"><td class="font-bold text-slate-900">${STANDARD_YEAR}</td><td>${rtValue}</td><td><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">${h.jenis || '-'}</span></td><td class="font-medium text-slate-900">${formatOwnersForExport(h.pemilik)}</td><td>${h.permintaan || '-'}</td><td>${formatBeratKotor(beratKotor)}</td><td>${formatBeratDaging(beratNetto)}</td><td>${h.keterangan || '-'}</td>`;
            if (tabelLayar) tabelLayar.innerHTML += row + `<td class="no-print"><div class="flex justify-center gap-2"><button class="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50" onclick="editHewan(${h.id})">Ubah</button><button class="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50" onclick="hapusHewan(${h.id})">Hapus</button></div></td></tr>`;
            if (tabelPdfBody) tabelPdfBody.innerHTML += row + `</tr>`;
            if (tabelPdfSajaBody) tabelPdfSajaBody.innerHTML += `<tr><td>${startIndex + index + 1}</td><td>${STANDARD_YEAR}</td><td>${rtValue}</td><td>${h.jenis || '-'}</td><td>${formatOwnersForExport(h.pemilik)}</td><td>${h.permintaan || '-'}</td><td>${formatBeratKotor(beratKotor)}</td><td>${formatBeratDaging(beratNetto)}</td><td>${h.keterangan || '-'}</td></tr>`;
        });
    }

    renderPaginationControls('paginationHewan', currentPageHewan, totalPages, 'goToHewanPage');
}

/**
 * Navigate to hewan table page
 * @param {number} page - Page number
 */
function goToHewanPage(page) {
    currentPageHewan = page;
    tampilkanDataHewan();
}

// ============================================
// EDIT & DELETE FUNCTIONS
// ============================================

/**
 * Edit existing hewan record
 * @param {number} id - Hewan ID
 */
function editHewan(id) {
    const item = dataHewan.find(h => String(h.id) === String(id));
    if (!item) return;
    
    // Set ID
    const idEl = document.getElementById('idHewan');
    if (idEl) idEl.value = item.id;
    
    // Set Tahun
    const tahunEl = document.getElementById('tahunHewan');
    if (tahunEl) tahunEl.value = item.tahun || '';
    
    // Set Jenis and adjust owner fields
    const jenisEl = document.getElementById('jenisHewan');
    if (jenisEl) jenisEl.value = item.jenis || 'Sapi';
    adjustOwnerFieldsForJenis();
    
    // Set RT
    const rtEl = document.getElementById('rtHewan');
    if (rtEl) rtEl.value = item.rt || '';
    
    // Set Pemilik (dynamic fields)
    const pemilikContainer = document.getElementById('pemilikFieldsContainerHewan');
    if (pemilikContainer) {
        const ownerFields = pemilikContainer.querySelectorAll('.hewan-owner-name');
        const ownerList = Array.isArray(item.pemilik) ? item.pemilik : 
                         (typeof item.pemilik === 'string' && item.pemilik ? item.pemilik.split(', ').map(s => s.trim()) : []);
        
        ownerFields.forEach((field, idx) => {
            field.value = ownerList[idx] || '';
        });
    }
    
    // Set Permintaan
    const permintaanEl = document.getElementById('permintaanHewan');
    if (permintaanEl) permintaanEl.value = item.permintaan || '';
    
    // Set Berat Kotor
    const beratEl = document.getElementById('beratKotor');
    if (beratEl) beratEl.value = item.kotor || '';
    
    // Calculate estimated meat weight
    hitungEstimasiDaging();
    
    // Set Keterangan
    const keteranganEl = document.getElementById('keteranganHewan');
    if (keteranganEl) keteranganEl.value = item.keterangan || '';
    
    // Update button states
    const submitBtn = document.getElementById('submitHewanBtn');
    if (submitBtn) submitBtn.innerText = 'Simpan Perubahan';
    
    const cancelBtn = document.getElementById('cancelEditHewan');
    if (cancelBtn) cancelBtn.style.display = 'block';
}

/**
 * Reset hewan form to initial state
 */
function resetFormHewan() {
    const formEl = document.getElementById('formHewan');
    if (formEl) formEl.reset();
    
    const idEl = document.getElementById('idHewan');
    if (idEl) idEl.value = '';
    
    const tahunEl = document.getElementById('tahunHewan');
    if (tahunEl) tahunEl.value = getCurrentYearFormatted();
    
    const rtEl = document.getElementById('rtHewan');
    if (rtEl) rtEl.value = '';
    
    const beratEl = document.getElementById('beratDaging');
    if (beratEl) beratEl.value = '';
    
    const submitBtn = document.getElementById('submitHewanBtn');
    if (submitBtn) submitBtn.innerText = 'Simpan Data Hewan';
    
    const cancelBtn = document.getElementById('cancelEditHewan');
    if (cancelBtn) cancelBtn.style.display = 'none';
    
    adjustOwnerFieldsForJenis();
}

/**
 * Delete hewan record
 * @param {number} id - Hewan ID
 */
async function hapusHewan(id) {
    if(!confirm("Apakah Anda yakin ingin menghapus data hewan ini?")) return;
    showLoading();
    try {
        const response = await fetch(`${apiUrl}?action=deleteHewan&id=${encodeURIComponent(id)}`, {
            method: 'POST'
        });
        const result = await parseJsonResponse(response);
        if (!result || !result.success) {
            showToast(result?.message || 'Gagal menghapus data hewan.', 'error');
            return;
        }
        if (window.logSystemActivity) {
            window.logSystemActivity('Data hewan dihapus.');
        }
        await initDataHewan();
    } catch (error) {
        console.error(error);
        showToast('Terjadi kesalahan saat menghapus data hewan.', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export hewan data to PDF
 */
function cetakPDFHewanSaja() {
    const th = document.getElementById('filterTahunHewan') ? document.getElementById('filterTahunHewan').value : 'SemuaTahun';
    const label = th === 'SemuaTahun' ? 'Semua Periode Anggaran' : 'Periode: ' + th;
    const safeName = th.replace(/[^a-zA-Z0-9]/g, '_');
    const daftarHewan = Array.isArray(dataHewan) ? dataHewan : [];
    const hewanToPrint = daftarHewan.filter(h => th === 'SemuaTahun' || h.tahun === th);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(16);
    doc.setTextColor(27, 94, 32);
    doc.text('LAPORAN INVENTARISASI & TIMBANGAN HEWAN QURBAN', 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(87, 107, 85);
    doc.text(label, 14, 26);
    doc.setDrawColor(42, 143, 93);
    doc.setLineWidth(0.8);
    doc.line(14, 30, pageWidth - 14, 30);

    if (hewanToPrint.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('Tidak ada data hewan untuk filter yang dipilih.', 14, 45);
        doc.save(`Laporan_Hewan_Qurban_${safeName}.pdf`);
        return;
    }

    doc.autoTable({
        startY: 36,
        theme: 'grid',
        head: [['No', 'Tahun', 'RT', 'Jenis Hewan', 'Nama Pemilik', 'Permintaan Khusus', 'Berat Kotor (KG)', 'Berat Daging (KG)', 'Keterangan']],
            body: hewanToPrint.map((h, idx) => [
            idx + 1,
            STANDARD_YEAR,
            h.rt ? formatRtLabel(h.rt) : '-',
            h.jenis || '-',
            formatOwnersForExport(h.pemilik),
            h.permintaan || '-',
                formatBeratKotor(h.kotor || 0),
                formatBeratDaging(h.daging || 0),
            h.keterangan || '-'
        ]),
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

    doc.save(`Laporan_Hewan_Qurban_${safeName}.pdf`);
}

if(typeof module !== 'undefined') module.exports = {
    renderHewanHeader,
    initDataHewan,
    createHewanOwnerRow,
    addHewanOwnerField,
    removeHewanOwnerField,
    updateHewanOwnerControls,
    setHewanOwnerFields,
    adjustOwnerFieldsForJenis,
    hitungEstimasiDaging,
    formatBeratDaging,
    getMultiplierHewan,
    tampilkanDataHewan,
    goToHewanPage,
    editHewan,
    resetFormHewan,
    hapusHewan,
    cetakPDFHewanSaja
};
