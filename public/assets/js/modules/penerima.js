/**
 * PENERIMA MODULE - Qurban Management System
 * Functions for beneficiary/recipient management (Warga, Panitia)
 * 
 * Dependencies: formatters, helpers, utilities
 * API Endpoint: api.php?action=addPenerima|updatePenerima|deletePenerima|getPenerima
 */

// ============================================
// DATA INITIALIZATION & LOADING
// ============================================

function syncRtFilterVisibility() {
    const fKat = document.getElementById('filterKategori');
    const wrapperRT = document.getElementById('wrapperFilterRT');
    const fRT = document.getElementById('filterRT');

    if (!fKat || !wrapperRT) return;

    const isWarga = fKat.value === 'Warga';
    wrapperRT.classList.toggle('hidden', !isWarga);

    if (!isWarga && fRT) {
        fRT.value = 'SemuaRT';
    }
}

function populateRtFilterOptions(daftarPenerima) {
    const fRTSelect = document.getElementById('filterRT');
    if (!fRTSelect) return;

    const selectedValue = fRTSelect.value || 'SemuaRT';
    while (fRTSelect.options.length > 1) {
        fRTSelect.remove(1);
    }

    const rtUnique = [...new Set(
        daftarPenerima
            .filter(p => normalizeRtValue(p.rt))
            .map(p => normalizeRtValue(p.rt))
    )].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    rtUnique.forEach(rt => {
        const opt = document.createElement('option');
        opt.value = rt;
        opt.textContent = formatRtLabel(rt);
        fRTSelect.appendChild(opt);
    });

    const normalizedSelection = normalizeRtValue(selectedValue);
    const matchingOption = rtUnique.find(rt => rt === normalizedSelection);
    fRTSelect.value = matchingOption ? matchingOption : 'SemuaRT';
}

function renderPenerimaRtMonitoringWidget(dataTerfilter) {
    const wrapper = document.getElementById('wrapperPenerimaMonitoringRT');
    const container = document.getElementById('listPenerimaStatistikRT');
    const fKat = document.getElementById('filterKategori') ? document.getElementById('filterKategori').value : 'Semua';

    if (!wrapper || !container) return;

    if (fKat !== 'Warga' || !Array.isArray(dataTerfilter) || dataTerfilter.length === 0) {
        wrapper.classList.add('hidden', 'd-none');
        wrapper.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    wrapper.classList.remove('hidden', 'd-none');
    wrapper.style.display = 'block';
    container.innerHTML = '';

    const statistik = {};
    dataTerfilter.forEach(p => {
        if (p.kategori === 'Warga') {
            const rtValue = normalizeRtValue(p.rt);
            if (rtValue) {
                statistik[rtValue] = (statistik[rtValue] || 0) + 1;
            }
        }
    });

    const rtEntries = Object.keys(statistik).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    if (rtEntries.length === 0) {
        container.innerHTML = '<div class="col-span-2 text-sm text-slate-500">Belum ada data warga per RT.</div>';
        return;
    }

    container.innerHTML = rtEntries.map(rt => `
        <div class="rounded-xl border border-slate-100 bg-white p-3 text-center shadow-xs">
            <div class="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">${formatRtLabel(rt)}</div>
            <div class="mt-1 text-sm font-semibold text-slate-900">${statistik[rt]} Penerima</div>
        </div>
    `).join('');
}

/**
 * Fetch all penerima pages from server and merge them into one dataset
 * This ensures reports and summary dashboards use complete recipient data
 */
async function fetchAllPenerimaPages(limit = 100, extraParams = '') {
    const rows = [];
    let page = 1;
    let totalPages = 1;
    const extraQuery = extraParams ? `&${extraParams}` : '';

    do {
        const response = await fetch(`${apiUrl}?action=getPenerima${extraQuery}&page=${page}&limit=${limit}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Gagal memuat data penerima');
        }

        rows.push(...(Array.isArray(result.data) ? result.data : []));
        const pagination = result.pagination || {};
        totalPages = pagination.totalPages || 1;
        page += 1;
    } while (page <= totalPages);

    return {
        rows,
        pagination: {
            page: 1,
            limit,
            total: rows.length,
            totalPages: Math.max(1, totalPages)
        }
    };
}

/**
 * Initialize penerima data from server
 * Loads all recipient data with pagination
 */
async function initDataPenerima() {
    try {
        const { rows, pagination } = await fetchAllPenerimaPages(paginationPenerima.limit);
        dataPenerima = rows.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
        paginationPenerima = pagination;
    } catch (error) {
        console.error("Gagal memuat data penerima:", error);
        dataPenerima = [];
    }
    currentPagePenerima = 1;
    perbaruiDropdownTahun();
    tampilkanData();
    
    // Refresh dashboard metrics when penerima data changes
    await loadDashboardMetrics();
    updateDashboard();
}

// ============================================
// FORM HANDLING & SUBMISSION
// ============================================

/**
 * Toggle RT field visibility based on kategori
 * Only shows RT field for 'Warga' category
 */
function toggleRTField() {
    const kat = document.getElementById('kategori').value;
    document.getElementById('groupRT').style.display = kat === 'Warga' ? 'block' : 'none';
}

/**
 * Handle kategori filter change
 * Updates RT filter display and resets pagination
 */
function handleFilterKategoriChange() {
    const fKat = document.getElementById('filterKategori');
    const fRT = document.getElementById('filterRT');

    if (!fKat) return;

    const kat = fKat.value;

    syncRtFilterVisibility();

    if (kat !== 'Warga' && fRT) {
        fRT.value = 'SemuaRT';
    }

    currentPagePenerima = 1;
    tampilkanData();
}

/**
 * Handle Enter key in search input
 * @param {KeyboardEvent} e
 */
function handleEnter(e) { 
    if (e.key === 'Enter') { 
        currentPagePenerima = 1; 
        tampilkanData(); 
    } 
}

/**
 * Reset search input and reload data
 */
function resetPencarian() {
    const inputCari = document.getElementById('inputCari');
    const filterKategori = document.getElementById('filterKategori');
    const filterTahun = document.getElementById('filterTahunPenerima');
    const filterRT = document.getElementById('filterRT');
    const wrapperRT = document.getElementById('wrapperFilterRT');

    if (inputCari) {
        inputCari.value = '';
    }
    if (filterKategori) {
        filterKategori.value = 'Semua';
    }
    if (filterTahun) {
        filterTahun.value = 'SemuaTahun';
    }
    if (filterRT) {
        filterRT.value = 'SemuaRT';
    }
    if (wrapperRT) {
        wrapperRT.classList.add('hidden');
    }

    syncRtFilterVisibility();
    currentPagePenerima = 1;
    tampilkanData();
}

/**
 * Handle penerima form submission
 * Creates or updates recipient record
 */
document.addEventListener('DOMContentLoaded', function() {
    const formPenerima = document.getElementById('formPenerima');
    if (formPenerima) {
        formPenerima.addEventListener('submit', async function(e) {
            e.preventDefault();
            const idPenerimaEl = document.getElementById('idPenerima');
            const idPenerima = idPenerimaEl ? idPenerimaEl.value : '';
            
            const kategoriEl = document.getElementById('kategori');
            const kat = kategoriEl ? kategoriEl.value : 'Warga';
            
            const currentPenerima = idPenerima ? dataPenerima.find(p => String(p.id) === String(idPenerima)) : null;

            const tahunEl = document.getElementById('tahunPenerima');
            const namaEl = document.getElementById('nama');
            const rtEl = document.getElementById('rt');

            const payload = {
                tahun: tahunEl ? tahunEl.value : '',
                nama: namaEl ? namaEl.value : '',
                kategori: kat,
                rt: kat === 'Warga' ? (rtEl ? (rtEl.value || '-') : '-') : '-',
                permintaan: '-',
                status: currentPenerima ? currentPenerima.status : 'Belum Diambil'
            };

            const action = idPenerima ? 'updatePenerima' : 'addPenerima';
            if (idPenerima) payload.id = idPenerima;

            try {
                const response = await fetch(`${apiUrl}?action=${action}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();
                if (!result.success) {
                    showToast(result.message || 'Gagal menyimpan data penerima ke MySQL.', 'error');
                    return;
                }
                showToast('Data penerima berhasil disimpan!', 'success');
                if (window.logSystemActivity) {
                    window.logSystemActivity(idPenerima ? 'Data penerima diperbarui.' : 'Data penerima ditambahkan.');
                }
                // Reload data and refresh dashboard
                await initDataPenerima();
                await loadDashboardMetrics();
                updateDashboard();
                // Reset filters to show new data
                const filterTahunPenerima = document.getElementById('filterTahunPenerima');
                const filterKategori = document.getElementById('filterKategori');
                if (filterTahunPenerima) filterTahunPenerima.value = 'SemuaTahun';
                if (filterKategori) filterKategori.value = 'Semua';
                const wrapperRT = document.getElementById('wrapperFilterRT');
                if (wrapperRT) wrapperRT.classList.add('hidden');
                currentPagePenerima = 1;
                tampilkanData();
                if (idPenerima) resetFormPenerima();
            } catch (error) {
                console.error(error);
                showToast('Terjadi kesalahan saat menyimpan data penerima.', 'error');
                return;
            }

            if (!idPenerima) {
                this.reset();
                const tahunEl = document.getElementById('tahunPenerima');
                if (tahunEl) tahunEl.value = getCurrentYearFormatted();
                toggleRTField();
            }
        });
    }
});

// ============================================
// TABLE DISPLAY & FILTERING
// ============================================

/**
 * Display penerima data in table with pagination and filtering
 */
function tampilkanData() {
    const tabel = document.getElementById('tabelPenerima');
    const tabelPdfPenerimaBody = document.getElementById('tabelPenerimaPdfBody');
    if (!tabel) return;
    tabel.innerHTML = '';
    if (tabelPdfPenerimaBody) tabelPdfPenerimaBody.innerHTML = '';

    const daftarPenerima = Array.isArray(dataPenerima) ? dataPenerima : [];

    const cari = document.getElementById('inputCari') ? document.getElementById('inputCari').value.toLowerCase() : '';
    const fKat = document.getElementById('filterKategori') ? document.getElementById('filterKategori').value : 'Semua';
    const fTahunSelect = document.getElementById('filterTahunPenerima');
    const fTahun = fTahunSelect ? fTahunSelect.value : 'SemuaTahun';

    syncRtFilterVisibility();

    const fRTSelect = document.getElementById('filterRT');
    populateRtFilterOptions(daftarPenerima);

    const fRT = fRTSelect ? fRTSelect.value : 'SemuaRT';

    dataTerfilterSaatIni = daftarPenerima.filter(p => {
        const mCari = p.nama ? p.nama.toLowerCase().includes(cari) : false;
        const mKat = fKat === 'Semua' || p.kategori === fKat;
        const mTahun = fTahun === 'SemuaTahun' || p.tahun === fTahun;
        const mRT = (fKat !== 'Warga' || fRT === 'SemuaRT' || normalizeRtValue(p.rt) === normalizeRtValue(fRT));

        return mCari && mKat && mTahun && mRT;
    });
    // Sort by id descending (newest first)
    dataTerfilterSaatIni.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));

    renderPenerimaRtMonitoringWidget(dataTerfilterSaatIni);

    if (typeof hitungPenerimaPerRT === 'function') {
        hitungPenerimaPerRT(dataTerfilterSaatIni);
    }

    const totalItems = dataTerfilterSaatIni.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPagePenerima));
    if (currentPagePenerima > totalPages) currentPagePenerima = totalPages;
    const startIndex = (currentPagePenerima - 1) * itemsPerPagePenerima;
    const endIndex = startIndex + itemsPerPagePenerima;
    const pageItems = dataTerfilterSaatIni.slice(startIndex, endIndex);

    renderPenerimaPagination(totalPages);

    pageItems.forEach((p, idx) => {
        const nomorUrut = startIndex + idx + 1;
        const statusValue = (p.status || 'Belum Diambil').toString();
        const statusBadge = statusValue === 'Sudah Diambil'
            ? `<span class="rounded-full px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50">Sudah Diambil</span>`
            : `<span class="rounded-full px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50">Belum Diambil</span>`;
        const actionButtonMarkup = statusValue === 'Belum Diambil'
            ? `<button class="btn-ambil-daging h-7 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-all whitespace-nowrap" onclick="toggleStatus(${p.id})" data-id="${p.id}">Ambil</button>`
            : `<button class="btn-ubah-distribusi h-7 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition-all whitespace-nowrap" onclick="toggleStatus(${p.id})" data-id="${p.id}">Ubah</button>`;
        const aksiCellContent = `<td class="no-print px-4 py-3 flex items-center justify-center gap-2">${actionButtonMarkup}<button class="btn-hapus-penerima h-7 px-2 text-rose-600 hover:text-rose-700 font-semibold text-xs transition-all" onclick="hapusPenerima(${p.id})" data-id="${p.id}">Hapus</button></td>`;
        
        tabel.innerHTML += `<tr class="transition hover:bg-slate-50">
            <td>${nomorUrut}</td>
            <td>${STANDARD_YEAR}</td>
            <td class="text-start font-bold text-slate-900">${p.nama || '-'}</td>
            <td><span class="rounded-full px-3 py-1 text-xs font-medium ${p.kategori === 'Panitia' ? 'bg-slate-100 text-slate-700' : 'bg-sky-50 text-sky-700'}">${p.kategori || '-'}</span></td>
            <td>${(p.rt && p.rt !== '-' && p.rt !== '') ? formatRtLabel(p.rt) : '-'}</td>
            <td class="text-center">${statusBadge}</td>
            ${aksiCellContent}
        </tr>`;
    });

    if (tabelPdfPenerimaBody) {
        dataTerfilterSaatIni.forEach((p, idx) => {
            tabelPdfPenerimaBody.innerHTML += `<tr>
                <td>${idx + 1}</td>
                <td>${STANDARD_YEAR}</td>
                <td class="text-start fw-bold">${p.nama || '-'}</td>
                <td>${p.kategori || '-'}</td>
                <td>${(p.rt && p.rt !== '-' && p.rt !== '') ? formatRtLabel(p.rt) : '-'}</td>
                <td>${p.status === 'Sudah Diambil' ? 'Sudah Diambil' : 'Belum Diambil'}</td>
            </tr>`;
        });
    }
}

/**
 * Render pagination controls for penerima table
 * @param {number} totalPages - Total number of pages
 */
function renderPenerimaPagination(totalPages) {
    const pagination = document.getElementById('paginationPenerima');
    if (!pagination) return;

    const prevDisabled = currentPagePenerima === 1 ? 'disabled' : '';
    const nextDisabled = currentPagePenerima === totalPages ? 'disabled' : '';

    pagination.innerHTML = `
        <nav aria-label="Navigasi halaman daftar penerima" class="no-print">
            <ul class="pagination justify-end gap-2 mb-0">
                <li class="page-item ${prevDisabled}">
                    <button class="page-link rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50" type="button" onclick="goToPenerimaPage(${currentPagePenerima - 1})" ${prevDisabled}>Sebelumnya</button>
                </li>
                <li class="page-item disabled">
                    <span class="page-link rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-400">Halaman ${currentPagePenerima} dari ${totalPages}</span>
                </li>
                <li class="page-item ${nextDisabled}">
                    <button class="page-link rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50" type="button" onclick="goToPenerimaPage(${currentPagePenerima + 1})" ${nextDisabled}>Berikutnya</button>
                </li>
            </ul>
        </nav>
    `;
}

/**
 * Navigate to penerima table page
 * @param {number} page - Page number
 */
function goToPenerimaPage(page) {
    const totalItems = dataTerfilterSaatIni.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPagePenerima));
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentPagePenerima = page;
    tampilkanData();
}

// ============================================
// EDIT & DELETE FUNCTIONS
// ============================================

/**
 * Edit existing penerima record
 * @param {number} id - Penerima ID
 */
function editPenerima(id) {
    const item = dataPenerima.find(p => String(p.id) === String(id));
    if (!item) return;
    
    const idEl = document.getElementById('idPenerima');
    if (idEl) idEl.value = item.id;
    
    const tahunEl = document.getElementById('tahunPenerima');
    if (tahunEl) tahunEl.value = item.tahun || '';
    
    const namaEl = document.getElementById('nama');
    if (namaEl) namaEl.value = item.nama || '';
    
    const kategoriEl = document.getElementById('kategori');
    if (kategoriEl) kategoriEl.value = item.kategori || 'Warga';
    
    toggleRTField();
    
    if (item.kategori === 'Warga') {
        const rtEl = document.getElementById('rt');
        if (rtEl) rtEl.value = item.rt && item.rt !== '-' ? item.rt : '';
    } else {
        const rtEl = document.getElementById('rt');
        if (rtEl) rtEl.value = '';
    }
    
    const submitBtn = document.getElementById('submitPenerimaBtn');
    if (submitBtn) submitBtn.innerText = 'Simpan Perubahan';
    
    const cancelBtn = document.getElementById('cancelEditPenerima');
    if (cancelBtn) cancelBtn.style.display = 'block';
}

/**
 * Reset penerima form to initial state
 */
function resetFormPenerima() {
    const formEl = document.getElementById('formPenerima');
    if (formEl) formEl.reset();
    
    const idEl = document.getElementById('idPenerima');
    if (idEl) idEl.value = '';
    
    const tahunEl = document.getElementById('tahunPenerima');
    if (tahunEl) tahunEl.value = getCurrentYearFormatted();
    
    const rtEl = document.getElementById('rt');
    if (rtEl) rtEl.value = '';
    
    toggleRTField();
    
    const submitBtn = document.getElementById('submitPenerimaBtn');
    if (submitBtn) submitBtn.innerText = 'Tambah Penerima';
    
    const cancelBtn = document.getElementById('cancelEditPenerima');
    if (cancelBtn) cancelBtn.style.display = 'none';
}

/**
 * Toggle status penerima (Sudah Diambil / Belum Diambil)
 * @param {number} id - Penerima ID
 */
async function toggleStatus(id) {
    const currentItem = dataPenerima.find(p => String(p.id) === String(id));
    
    if (!currentItem) {
        console.error("Data tidak ditemukan untuk ID:", id);
        return;
    }

    const newStatus = (currentItem.status === 'Sudah Diambil') ? 'Belum Diambil' : 'Sudah Diambil';
    showLoading();
    
    try {
        const url = `${apiUrl}?action=updateStatusPenerima&id=${encodeURIComponent(id)}&status=${encodeURIComponent(newStatus)}&t=${Date.now()}`;
        
        const response = await fetch(url);
        const result = await parseJsonResponse(response);
        if (!result || !result.success) {
            showToast(result?.message || 'Gagal update status di database.', 'error');
            return;
        }
        
        if (window.logSystemActivity) {
            const activityMessage = newStatus === 'Sudah Diambil'
                ? `Mencatat pengambilan daging untuk ${currentItem.nama || 'penerima'}`
                : `Mengubah data distribusi daging ${currentItem.nama || 'penerima'}`;
            window.logSystemActivity(activityMessage);
        }
        await initDataPenerima();
        await loadDashboardMetrics();
        updateDashboard();
        tampilkanData();
        
    } catch (error) {
        console.error("Fetch Error:", error);
        showToast('Terjadi kesalahan koneksi saat update status.', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Delete penerima record
 * @param {number} id - Penerima ID
 */
async function hapusPenerima(id) {
    if(!confirm("Apakah Anda yakin ingin menghapus data penerima ini?")) return;
    showLoading();
    try {
        const response = await fetch(`${apiUrl}?action=deletePenerima&id=${encodeURIComponent(id)}`, {
            method: 'POST'
        });
        const result = await parseJsonResponse(response);
        if (!result || !result.success) {
            showToast(result?.message || 'Gagal menghapus data penerima.', 'error');
            return;
        }
        if (window.logSystemActivity) {
            window.logSystemActivity('Data penerima dihapus.');
        }
        await initDataPenerima();
        await loadDashboardMetrics();
        updateDashboard();
    } catch (error) {
        console.error(error);
        showToast('Terjadi kesalahan saat menghapus data penerima.', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// IMPORT / EXPORT FUNCTIONS
// ============================================

/**
 * Download Excel template for penerima import
 */
function unduhTemplateExcel() {
    const wb = XLSX.utils.book_new();
    const wsData = [
        ["Panduan Pengisian"],
        ["Tahun: isi sesuai tahun aktif, contoh: 1447 H / 2026 M"],
        ["Kategori: Warga atau Panitia"],
        ["RT: isi angka RT, contoh: 3"],
        ["Status: Belum Diambil atau Sudah Diambil"],
        [],
        ["Tahun (opsional)", "Nama Penerima", "Kategori", "RT", "Status", "Permintaan"],
        ["1447 H / 2026 M", "Hasan", "Warga", "3", "Belum Diambil", "-"],
        ["1447 H / 2026 M", "Panitia Utama A", "Panitia", "", "Belum Diambil", "-"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
        { wch: 22 },
        { wch: 24 },
        { wch: 16 },
        { wch: 10 },
        { wch: 18 },
        { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Penerima_Qurban.xlsx");
}

function downloadTemplateExcel() {
    return unduhTemplateExcel();
}

function setExcelImportStatus(message, type = 'info') {
    const statusEl = document.getElementById('excelImportStatus');
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove('d-none', 'text-muted', 'text-success', 'text-danger', 'text-warning');
    statusEl.classList.add('d-block');
    if (type === 'success') {
        statusEl.classList.add('text-success');
    } else if (type === 'error') {
        statusEl.classList.add('text-danger');
    } else if (type === 'warning') {
        statusEl.classList.add('text-warning');
    } else {
        statusEl.classList.add('text-muted');
    }
}

function updateExcelImportProgress(current, total) {
    const wrap = document.getElementById('excelImportProgressWrap');
    const bar = document.getElementById('excelImportProgressBar');
    const text = document.getElementById('excelImportProgressText');
    if (!wrap || !bar || !text) return;
    wrap.classList.remove('d-none');
    wrap.classList.add('d-block');
    if (total > 0) {
        const percent = Math.round((current / total) * 100);
        bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        text.textContent = `${Math.min(100, Math.max(0, percent))}%`;
    } else {
        bar.style.width = '0%';
        text.textContent = '0%';
    }
}

function resetExcelImportProgress() {
    const wrap = document.getElementById('excelImportProgressWrap');
    const bar = document.getElementById('excelImportProgressBar');
    const text = document.getElementById('excelImportProgressText');
    if (wrap) {
        wrap.classList.add('d-none');
        wrap.classList.remove('d-block');
    }
    if (bar) bar.style.width = '0%';
    if (text) text.textContent = '0%';
}

/**
 * Upload and import penerima data from Excel file
 */
async function unggahExcel() {
    const fileInput = document.getElementById('inputExcel');
    const importButton = document.querySelector('button[onclick*="unggahExcel"]');
    const file = fileInput?.files?.[0];

    if (!file) { showToast("Pilih file Excel terlebih dahulu!", 'warning'); return; }
    if (window.isExcelImportInProgress) {
        showToast('Proses upload Excel sedang berjalan. Tunggu sampai selesai.', 'warning');
        return;
    }

    window.isExcelImportInProgress = true;
    if (fileInput) fileInput.disabled = true;
    if (importButton) importButton.disabled = true;
    setExcelImportStatus('Sedang memproses file Excel... mohon tunggu.', 'info');
    updateExcelImportProgress(0, 1);

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            
            const thDefault = document.getElementById('tahunPenerima').value;
            let successCount = 0;
            const totalRows = Array.isArray(json) ? json.length : 0;

            for (const [index, row] of (json || []).entries()) {
                setExcelImportStatus(`Memproses data ${index + 1} dari ${totalRows}...`, 'info');
                updateExcelImportProgress(index + 1, totalRows || 1);
                const rowNama = row['Nama Penerima'] ?? row['Nama'] ?? row['nama'] ?? '';
                if (rowNama) {
                    const rawTahun = row['Tahun'] ?? row['tahun'] ?? '';
                    const rowTahun = String(rawTahun || '').trim() || thDefault;
                    const rowKategori = row['Kategori'] ?? row['kategori'] ?? 'Warga';
                    const rowRt = row['RT'] ?? row['rt'] ?? '';
                    const rowStatus = row['Status'] ?? row['status'] ?? 'Belum Diambil';
                    const rowPermintaan = row['Permintaan'] ?? row['permintaan'] ?? '-';

                    const payload = {
                        tahun: rowTahun,
                        nama: rowNama,
                        kategori: rowKategori || 'Warga',
                        rt: rowRt ? String(rowRt) : '-',
                        status: rowStatus || 'Belum Diambil',
                        permintaan: rowPermintaan || '-'
                    };
                    
                    try {
                        const response = await fetch(`${apiUrl}?action=addPenerima`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        const result = await response.json();
                        if (result.success) successCount++;
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
            
            await initDataPenerima();
            await loadDashboardMetrics();
            updateDashboard();
            // Reset filters to show newly imported data
            const filterTahunPenerima = document.getElementById('filterTahunPenerima');
            const filterKategori = document.getElementById('filterKategori');
            if (filterTahunPenerima) filterTahunPenerima.value = 'SemuaTahun';
            if (filterKategori) filterKategori.value = 'Semua';
            const wrapperRT = document.getElementById('wrapperFilterRT');
            if (wrapperRT) wrapperRT.classList.add('hidden');
            currentPagePenerima = 1;
            tampilkanData();
            setExcelImportStatus(`Selesai! Berhasil mengupload ${successCount} data dari ${totalRows} baris.`, 'success');
            updateExcelImportProgress(totalRows || 1, totalRows || 1);
            showToast(`Berhasil import ${successCount} data dari Excel!`, 'success', 5000);
        } catch (error) {
            console.error(error);
            setExcelImportStatus('Gagal memproses file Excel. Silakan coba lagi.', 'error');
            updateExcelImportProgress(0, 1);
            showToast('Gagal memproses file Excel. Silakan coba lagi.', 'error', 5000);
        } finally {
            if (fileInput) fileInput.disabled = false;
            if (importButton) importButton.disabled = false;
            resetExcelImportProgress();
            window.isExcelImportInProgress = false;
        }
    };

    reader.onerror = function() {
        setExcelImportStatus('Gagal membaca file Excel. Pastikan format file benar.', 'error');
        updateExcelImportProgress(0, 1);
        showToast('Gagal membaca file Excel. Pastikan format file benar.', 'error', 5000);
        if (fileInput) fileInput.disabled = false;
        if (importButton) importButton.disabled = false;
        window.isExcelImportInProgress = false;
    };

    reader.readAsArrayBuffer(file);
}

/**
 * Export penerima data to Excel file
 */
function unduhExcel() {
    const dataExport = dataTerfilterSaatIni.map((p, i) => ({
        "No": i + 1,
        "Tahun": STANDARD_YEAR,
        "Nama Penerima": p.nama,
        "Kategori": p.kategori,
        "RT": p.rt,
        "Status Pengambilan": p.status
    }));
    const ws = XLSX.utils.json_to_sheet(dataExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Penerima Qurban");
    XLSX.writeFile(wb, `Data_Penerima_Qurban_${new Date().toISOString().slice(0,10)}.xlsx`);
}

/**
 * Export operational report data to master PDF
 */
async function cetakPDFLengkap() {
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        console.error('jsPDF tidak tersedia untuk membuat laporan.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const getSelectedYear = () => {
        const candidates = ['filterTahunDashboard', 'filterTahunPenerima', 'filter-tahun'];
        for (const id of candidates) {
            const el = document.getElementById(id);
            if (el && el.value) return el.value;
        }
        return 'SemuaTahun';
    };

    const getApiBase = () => {
        if (typeof apiUrl !== 'undefined' && apiUrl) return apiUrl;
        return 'api/index.php';
    };

    const selectedYear = getSelectedYear();
    const tahunLabel = selectedYear === 'SemuaTahun' ? 'Semua Tahun' : selectedYear;
    const safeName = String(selectedYear).replace(/[^a-zA-Z0-9]/g, '_');
    const apiBase = getApiBase();
    const isAllYears = !selectedYear || selectedYear === 'SemuaTahun' || selectedYear === 'Semua Tahun';
    const yearQuery = isAllYears ? '' : `&tahun=${encodeURIComponent(selectedYear)}`;

    const filterRowsByYear = (rows) => {
        if (!Array.isArray(rows)) return [];
        if (!selectedYear || selectedYear === 'SemuaTahun' || selectedYear === 'Semua Tahun') {
            return rows;
        }
        return rows.filter(row => String(row?.tahun ?? '').trim() === String(selectedYear).trim());
    };

    const fetchJson = async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    };

    try {
        const [perhitunganResponse, keuanganResponse, hewanResponse, panitiaResponse, penerimaResponse] = await Promise.all([
            fetchJson(`${apiBase}?action=getPerhitungan${yearQuery}`),
            fetchJson(`${apiBase}?action=getKeuangan${yearQuery}&page=1&limit=100`),
            fetchJson(`${apiBase}?action=getHewan${yearQuery}&page=1&limit=100`),
            fetchJson(`${apiBase}?action=getPanitia${yearQuery}&page=1&limit=100`),
            fetchJson(`${apiBase}?action=getPenerima${yearQuery}&page=1&limit=100`)
        ]);

        const perhitunganData = perhitunganResponse?.data || {};
        const keuanganData = filterRowsByYear(Array.isArray(keuanganResponse?.data) ? keuanganResponse.data : []);
        const hewanData = filterRowsByYear(Array.isArray(hewanResponse?.data) ? hewanResponse.data : []);
        const panitiaData = filterRowsByYear(Array.isArray(panitiaResponse?.data) ? panitiaResponse.data : []);
        const penerimaData = filterRowsByYear(Array.isArray(penerimaResponse?.data) ? penerimaResponse.data : []);

        const title = 'Laporan Tahunan Qurban Lengkap';
        const subtitle = `Ringkasan operasional untuk ${tahunLabel}`;

        const { addPageHeader, addFooter, tableOptions } = createPdfHelpers(doc, pageWidth, pageHeight);

        const runFinancialTable = (header, rows, tableHead, yStart) => {
            if (!rows || rows.length === 0) {
                doc.setFontSize(10);
                doc.setTextColor(100, 116, 139);
                doc.text('Tidak ada data untuk kategori ini.', 14, yStart);
                return yStart + 10;
            }
            doc.autoTable({
                ...tableOptions(yStart),
                head: [tableHead],
                body: rows,
                headStyles: { fillColor: [42, 143, 93], textColor: [255, 255, 255] },
                styles: { fontSize: 9 }
            });
            return doc.lastAutoTable?.finalY || yStart + 20;
        };

        const formatMoney = (value) => {
            const number = parseFloat(String(value || 0).replace(/[^0-9.-]/g, '')) || 0;
            return `Rp ${number.toLocaleString('id-ID')}`;
        };

        addPageHeader(title, subtitle);

        const totalBungkus = Array.isArray(perhitunganData?.distribusi)
            ? perhitunganData.distribusi.reduce((sum, row) => sum + (parseInt(row?.total_bks ?? 0, 10) || 0), 0)
            : 0;
        const totalPenerima = penerimaData.length;
        const totalPanitia = panitiaData.length;
        const totalHewan = hewanData.length;

        let contentY = 40;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Total Penerima: ${totalPenerima}`, 14, contentY);
        doc.text(`Total Panitia: ${totalPanitia}`, 80, contentY);
        doc.text(`Total Hewan: ${totalHewan}`, 150, contentY);

        contentY += 6;
        doc.text(`Total Bungkus: ${totalBungkus}`, 14, contentY);

        contentY += 10;
        if (Array.isArray(perhitunganData.distribusi) && perhitunganData.distribusi.length > 0) {
            doc.autoTable({
                ...tableOptions(contentY),
                head: [['RT', 'Jumlah Bungkus']],
                body: perhitunganData.distribusi.map(row => [row.rt ? formatRtLabel(row.rt) : '-', row.total_bks || 0]),
                headStyles: { fillColor: [42, 143, 93], textColor: [255, 255, 255] },
                styles: { fontSize: 9 }
            });
            contentY = doc.lastAutoTable?.finalY + 10;
        } else {
            doc.text('Tidak ada data perhitungan distribusi.', 14, contentY);
            contentY += 10;
        }

        addFooter();

        // Inventaris Hewan
        doc.addPage();
        addPageHeader('Daftar Inventaris Hewan Qurban', subtitle);
        const hewanRows = hewanData.map((row, index) => [
            index + 1,
            row.tahun || '-',
            row.jenis || '-',
            row.pemilik || '-',
            row.rt ? formatRtLabel(row.rt) : '-',
            row.kotor || '-',
            row.daging || '-',
            row.permintaan || '-'
        ]);
        doc.autoTable({
            ...tableOptions(40),
            head: [['No', 'Tahun', 'Jenis', 'Pemilik', 'RT', 'Kotor', 'Daging', 'Permintaan']],
            body: hewanRows,
            headStyles: { fillColor: [42, 143, 93], textColor: [255, 255, 255] },
            styles: { fontSize: 9 }
        });
        addFooter();

        // Keuangan
        doc.addPage();
        addPageHeader('Laporan Keuangan Qurban', subtitle);
        const pemasukanRows = keuanganData.filter(row => String(row?.jenis || '').toLowerCase().includes('masuk'))
            .map((row, index) => [
                index + 1,
                row.tanggal || '-',
                row.jenis || '-',
                formatMoney(row.nominal),
                row.keterangan || '-'
            ]);
        const totalMasuk = pemasukanRows.reduce((sum, r) => sum + parseFloat(String(r[3].replace(/[^0-9.-]/g, '')) || 0), 0);
        pemasukanRows.push(['', '', 'TOTAL', formatMoney(totalMasuk), '']);

        const pengeluaranRows = keuanganData.filter(row => String(row?.jenis || '').toLowerCase().includes('keluar'))
            .map((row, index) => [
                index + 1,
                row.tanggal || '-',
                row.jenis || '-',
                formatMoney(row.nominal),
                row.keterangan || '-'
            ]);
        const totalKeluar = pengeluaranRows.reduce((sum, r) => sum + parseFloat(String(r[3].replace(/[^0-9.-]/g, '')) || 0), 0);
        pengeluaranRows.push(['', '', 'TOTAL', formatMoney(totalKeluar), '']);

        contentY = runFinancialTable('Pemasukan', pemasukanRows, ['No', 'Tanggal', 'Jenis', 'Nominal', 'Keterangan'], 40) + 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 95);
        doc.text(`Saldo: ${formatMoney(totalMasuk - totalKeluar)}`, 14, contentY + 10);
        addFooter();

        // Panitia
        doc.addPage();
        addPageHeader('Laporan Data Panitia Qurban', subtitle);
        const panitiaRows = panitiaData.map((row, index) => [
            index + 1,
            row.tahun || '-',
            row.nama || '-',
            row.peran || '-',
            row.kontak || '-'
        ]);
        doc.autoTable({
            ...tableOptions(40),
            head: [['No', 'Tahun', 'Nama', 'Peran', 'Kontak']],
            body: panitiaRows,
            headStyles: { fillColor: [42, 143, 93], textColor: [255, 255, 255] },
            styles: { fontSize: 9 }
        });
        addFooter();

        // Penerima
        doc.addPage();
        addPageHeader('Laporan Data Penerima Qurban', subtitle);
        const penerimaRows = penerimaData.map((row, index) => [
            index + 1,
            row.tahun || '-',
            row.nama || '-',
            row.kategori || '-',
            row.rt ? formatRtLabel(row.rt) : '-',
            row.status || '-'
        ]);
        doc.autoTable({
            ...tableOptions(40),
            head: [['No', 'Tahun', 'Nama', 'Kategori', 'RT', 'Status Pengambilan']],
            body: penerimaRows,
            headStyles: { fillColor: [42, 143, 93], textColor: [255, 255, 255] },
            styles: { fontSize: 9 }
        });
        addFooter();

        doc.save(`Laporan_Tahunan_Qurban_${safeName}.pdf`);
    } catch (err) {
        console.error('Gagal menarik data master laporan:', err);
        window.alert('Gagal membuat laporan master. Silakan periksa koneksi atau data yang tersedia.');
    }
}

function cetakLaporanPDF_Lengkap() {
    if (typeof window.cetakLaporanPDF_LengkapDashboard === 'function') {
        return window.cetakLaporanPDF_LengkapDashboard();
    }
    return cetakPDFLengkap();
}

window.cetakLaporanPDF_Lengkap = cetakLaporanPDF_Lengkap;
globalThis.cetakLaporanPDF_Lengkap = cetakLaporanPDF_Lengkap;
window.downloadTemplateExcel = downloadTemplateExcel;
globalThis.downloadTemplateExcel = downloadTemplateExcel;

if(typeof module !== 'undefined') module.exports = {
    initDataPenerima,
    toggleRTField,
    handleFilterKategoriChange,
    handleEnter,
    resetPencarian,
    tampilkanData,
    renderPenerimaPagination,
    goToPenerimaPage,
    editPenerima,
    resetFormPenerima,
    toggleStatus,
    hapusPenerima,
    unduhTemplateExcel,
    downloadTemplateExcel,
    unggahExcel,
    unduhExcel,
    cetakPDFLengkap
};
