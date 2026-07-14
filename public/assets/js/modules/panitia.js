/**
 * PANITIA MODULE - Qurban Management System
 * Functions for committee management (Panitia Qurban)
 * 
 * Dependencies: formatters, helpers, utilities, jsPDF
 * API Endpoint: api.php?action=addPanitia|updatePanitia|deletePanitia|getPanitia
 */

// ============================================
// DATA INITIALIZATION & LOADING
// ============================================

/**
 * Load panitia data from server
 * Loads all committee records with pagination
 */
async function loadPanitiaData() {
    try {
        const response = await fetch(`${apiUrl}?action=getPanitia&page=${paginationPanitia.page}&limit=${paginationPanitia.limit}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.success) {
            dataPanitia = Array.isArray(result.data)
                ? result.data.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0))
                : [];
            paginationPanitia = result.pagination || paginationPanitia;
        } else {
            throw new Error(result.message || 'Gagal memuat data');
        }
    } catch (error) {
        console.error('Gagal memuat data panitia:', error);
        dataPanitia = [];
    }
    currentPagePanitia = 1;
    perbaruiDropdownTahunPanitia();
    renderDataPanitia();
}

/**
 * Update panitia tahun dropdown filter
 */
function perbaruiDropdownTahunPanitia() {
    const filter = document.getElementById('filterTahunPanitia');
    if (!filter) return;
    const current = filter.value;
    const tahunUnique = [...new Set(dataPanitia.map(item => item.tahun || '').filter(t => t))].sort();
    filter.innerHTML = '<option value="SemuaTahun">Semua Tahun</option>' + tahunUnique.map(t => `<option value="${t}">${t}</option>`).join('');
    if (tahunUnique.includes(current)) {
        filter.value = current;
    }
}

// ============================================
// FORM HANDLING & SUBMISSION
// ============================================

/**
 * Add or update panitia record
 * @param {Event} event - Form submission event
 */
async function tambahPanitia(event) {
    event.preventDefault();
    showLoading();
    
    const idPanitiaEl = document.getElementById('idPanitia');
    const idPanitia = idPanitiaEl ? idPanitiaEl.value : '';
    
    const namaEl = document.getElementById('namaPanitia');
    const nama = namaEl ? namaEl.value.trim() : '';
    
    const peranEl = document.getElementById('peranPanitia');
    const peran = peranEl ? peranEl.value : '';
    
    const kontakEl = document.getElementById('kontakPanitia');
    const kontak = kontakEl ? kontakEl.value.trim() : '';
    
    const tahunEl = document.getElementById('tahunPanitia');
    const tahun = tahunEl ? tahunEl.value.trim() : '';

    if (!nama || !peran || !tahun) {
        showToast('Tahun, nama, dan jabatan panitia harus diisi.', 'warning');
        hideLoading();
        return;
    }

    const payload = { tahun, nama, peran, kontak };
    const action = idPanitia ? 'updatePanitia' : 'addPanitia';
    if (idPanitia) payload.id = idPanitia;

    try {
        const response = await fetch(`${apiUrl}?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Gagal menyimpan data panitia.');

        showToast('Data panitia berhasil disimpan!', 'success');
        if (window.logSystemActivity) {
            window.logSystemActivity(idPanitia ? 'Data panitia diperbarui.' : 'Data panitia ditambahkan.');
        }
        const formEl = document.getElementById('formPanitia');
        if (formEl) formEl.reset();
        await loadPanitiaData();
        await initDataPenerima();
        if (idPanitia) resetFormPanitia();
    } catch (error) {
        console.error(error);
        showToast('Gagal menyimpan data panitia: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// TABLE DISPLAY & PAGINATION
// ============================================

/**
 * Render panitia data table with pagination
 */
function renderDataPanitia() {
    const body = document.getElementById('tabelPanitiaBody');
    const pagination = document.getElementById('paginationPanitia');
    const filterTahun = document.getElementById('filterTahunPanitia');
    if (!body || !filterTahun) return;

    const tahunFilter = filterTahun.value || 'SemuaTahun';
    body.innerHTML = '';
    const visibleData = dataPanitia.filter(item => tahunFilter === 'SemuaTahun' || (item.tahun || '') === tahunFilter);
    // Sort by id descending (newest first)
    visibleData.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));

    const totalItems = visibleData.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPagePanitia));
    if (currentPagePanitia > totalPages) currentPagePanitia = totalPages;
    if (currentPagePanitia < 1) currentPagePanitia = 1;
    const startIndex = (currentPagePanitia - 1) * itemsPerPagePanitia;
    const pageItems = visibleData.slice(startIndex, startIndex + itemsPerPagePanitia);

    if (pageItems.length === 0) {
        body.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-sm text-slate-400">Tidak ada data panitia untuk filter ini.</td></tr>`;
    } else {
        pageItems.forEach((item, idx) => {
            body.innerHTML += `
                <tr class="transition hover:bg-slate-50">
                    <td>${startIndex + idx + 1}</td>
                    <td class="font-bold text-slate-900">${item.tahun || '-'}</td>
                    <td class="text-start font-medium text-slate-900">${item.nama || '-'}</td>
                    <td><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">${item.peran || '-'}</span></td>
                    <td>${item.kontak || '-'}</td>
                    <td class="no-print text-center"><div class="flex justify-center gap-2"><button class="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50" onclick="editPanitia(${item.id})">Ubah</button><button class="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50" onclick="hapusPanitia(${item.id})">Hapus</button></div></td>
                </tr>
            `;
        });
    }

    renderPaginationControls('paginationPanitia', currentPagePanitia, totalPages, 'goToPanitiaPage');
}

/**
 * Navigate to panitia table page
 * @param {number} page - Page number
 */
function goToPanitiaPage(page) {
    currentPagePanitia = page;
    renderDataPanitia();
}

// ============================================
// EDIT & DELETE FUNCTIONS
// ============================================

/**
 * Edit existing panitia record
 * @param {number} id - Panitia ID
 */
function editPanitia(id) {
    const item = dataPanitia.find(p => String(p.id) === String(id));
    if (!item) return;
    
    const idEl = document.getElementById('idPanitia');
    if (idEl) idEl.value = item.id;
    
    const tahunEl = document.getElementById('tahunPanitia');
    if (tahunEl) tahunEl.value = item.tahun || '';
    
    const namaEl = document.getElementById('namaPanitia');
    if (namaEl) namaEl.value = item.nama || '';
    
    const peranEl = document.getElementById('peranPanitia');
    if (peranEl) peranEl.value = item.peran || 'Ketua';
    
    const kontakEl = document.getElementById('kontakPanitia');
    if (kontakEl) kontakEl.value = item.kontak || '';
    
    const submitBtn = document.getElementById('submitPanitiaBtn');
    if (submitBtn) submitBtn.innerText = 'Simpan Perubahan';
    
    const cancelBtn = document.getElementById('cancelEditPanitia');
    if (cancelBtn) cancelBtn.style.display = 'block';
}

/**
 * Reset panitia form to initial state
 */
function resetFormPanitia() {
    const formEl = document.getElementById('formPanitia');
    if (formEl) formEl.reset();
    
    const idEl = document.getElementById('idPanitia');
    if (idEl) idEl.value = '';
    
    const tahunEl = document.getElementById('tahunPanitia');
    if (tahunEl) tahunEl.value = getCurrentYearFormatted();
    
    const submitBtn = document.getElementById('submitPanitiaBtn');
    if (submitBtn) submitBtn.innerText = 'Tambahkan Panitia';
    
    const cancelBtn = document.getElementById('cancelEditPanitia');
    if (cancelBtn) cancelBtn.style.display = 'none';
}

/**
 * Delete panitia record
 * @param {number} id - Panitia ID
 */
async function hapusPanitia(id) {
    if (!confirm('Hapus data panitia ini?')) return;
    try {
        const response = await fetch(`${apiUrl}?action=deletePanitia&id=${encodeURIComponent(id)}`, {
            method: 'POST'
        });
        const result = await parseJsonResponse(response);
        if (!result || !result.success) throw new Error(result?.message || 'Gagal menghapus data panitia.');
        if (window.logSystemActivity) {
            window.logSystemActivity('Data panitia dihapus.');
        }
        await loadPanitiaData();
    } catch (error) {
        console.error(error);
        showToast('Gagal menghapus data panitia. Periksa koneksi atau konfigurasi database.', 'error');
    }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export panitia data to PDF
 */
function cetakPDFPanitiaSaja() {
    const th = document.getElementById('filterTahunPanitia') ? document.getElementById('filterTahunPanitia').value : 'SemuaTahun';
    const label = th === 'SemuaTahun' ? 'Semua Tahun Panitia' : `Tahun: ${th}`;
    const safeName = th.replace(/[^a-zA-Z0-9]/g, '_');
    const visibleData = dataPanitia.filter(item => th === 'SemuaTahun' || (item.tahun || '') === th);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(16);
    doc.setTextColor(27, 94, 32);
    doc.text('LAPORAN PANITIA QURBAN', 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(87, 107, 85);
    doc.text(label, 14, 26);
    doc.setDrawColor(42, 143, 93);
    doc.setLineWidth(0.8);
    doc.line(14, 30, pageWidth - 14, 30);

    if (visibleData.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('Tidak ada data panitia untuk filter yang dipilih.', 14, 45);
        doc.save(`Laporan_Panitia_Qurban_${safeName}.pdf`);
        return;
    }

    doc.autoTable({
        startY: 36,
        theme: 'grid',
        head: [['No', 'Tahun', 'Nama', 'Jabatan', 'Kontak']],
        body: visibleData.map((item, idx) => [
            idx + 1,
            STANDARD_YEAR,
            item.nama || '-',
            item.peran || '-',
            item.kontak || '-'
        ]),
        headStyles: { fillColor: [42, 143, 93], textColor: [255, 255, 255], halign: 'center' },
        bodyStyles: { fontSize: 9 },
        styles: { cellPadding: 3, font: 'helvetica', overflow: 'linebreak' },
        rowPageBreak: 'auto',
        margin: { left: 14, right: 14 }
    });

    doc.save(`Laporan_Panitia_Qurban_${safeName}.pdf`);
}

if(typeof module !== 'undefined') module.exports = {
    loadPanitiaData,
    perbaruiDropdownTahunPanitia,
    tambahPanitia,
    renderDataPanitia,
    goToPanitiaPage,
    editPanitia,
    resetFormPanitia,
    hapusPanitia,
    cetakPDFPanitiaSaja
};
