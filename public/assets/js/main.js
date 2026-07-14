/**
 * Main Application Entry Point
 * Qurban Management System
 */

function resolveApiUrl() {
    const origin = window.location.origin || '';
    const pathname = window.location.pathname || '/';
    const normalizedPath = pathname.replace(/\/index\.html$/i, '').replace(/\/public\/?$/, '');
    const basePath = normalizedPath && normalizedPath !== '/' ? normalizedPath : '';
    return `${origin}${basePath}/api/index.php`;
}

var apiUrl = resolveApiUrl();
var COEFFICIENT_SAPI = 0.8;
var COEFFICIENT_KAMBING = 0.66;
var STANDARD_YEAR = getCurrentYearFormatted();

var dataHewan = [];
var dataPenerima = [];
var dataKeuangan = [];
var dataPanitia = [];
var distribusiRows = [];
var currentDistribusiFilteredRows = [];
var dashboardMetrics = null;
var dataTerfilterSaatIni = [];
var dashboardRtChart = null;

var currentPageHewan = 1;
var currentPagePenerima = 1;
var currentPageKeuangan = 1;
var currentPagePanitia = 1;
var currentPageDistribusi = 1;
var dashboardHewanCurrentPage = 1;

var itemsPerPageHewan = 10;
var itemsPerPagePenerima = 10;
var itemsPerPageKeuangan = 10;
var itemsPerPagePanitia = 10;
var itemsPerPageDistribusi = 10;
var dashboardHewanPerPage = 10;

var paginationHewan = { page: 1, limit: 100, total: 0 };
var paginationPenerima = { page: 1, limit: 100, total: 0 };
var paginationKeuangan = { page: 1, limit: 100, total: 0 };
var paginationPanitia = { page: 1, limit: 100, total: 0 };

function getCurrentYearFormatted() {
    const gregorian = new Date().getFullYear();
    const hijri = typeof getCurrentHijriYear === 'function'
        ? getCurrentHijriYear(gregorian)
        : gregorian - 579;
    return `${hijri} H / ${gregorian} M`;
}

function renderPaginationControls(containerId, currentPage, totalPages, callbackName) {
    const pagination = document.getElementById(containerId);
    if (!pagination) return;

    const prevPage = Math.max(1, currentPage - 1);
    const nextPage = Math.min(totalPages, currentPage + 1);

    pagination.innerHTML = `
        <nav aria-label="Navigasi halaman" class="no-print">
            <ul class="pagination justify-end gap-2 mb-0">
                <li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
                    <button class="page-link rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50" type="button" onclick="${callbackName}(${prevPage})">Sebelumnya</button>
                </li>
                <li class="page-item disabled">
                    <span class="page-link rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-400">Halaman ${currentPage} dari ${totalPages}</span>
                </li>
                <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
                    <button class="page-link rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50" type="button" onclick="${callbackName}(${nextPage})">Berikutnya</button>
                </li>
            </ul>
        </nav>
    `;
}

function setDefaultYearValues() {
    [
        'tahunHewan',
        'tahunPenerima',
        'tahunPanitia',
        'tahunKeuangan'
    ].forEach((id) => {
        const input = document.getElementById(id);
        if (input && !input.value) input.value = STANDARD_YEAR;
    });
}

function setupFloatingLabels() {
    document.querySelectorAll('.mb-3').forEach((wrapper) => {
        const input = wrapper.querySelector('input, select, textarea');
        const label = wrapper.querySelector('label');
        if (!input || !label) return;
        wrapper.classList.add('form-floating-custom');

        const refreshLabel = () => {
            if (input.value && String(input.value).trim() !== '') {
                wrapper.classList.add('filled');
            } else {
                wrapper.classList.remove('filled');
            }
        };

        input.addEventListener('focus', refreshLabel);
        input.addEventListener('blur', refreshLabel);
        input.addEventListener('input', refreshLabel);
        input.addEventListener('change', refreshLabel);
        refreshLabel();
    });
}

function calculateBeratBersih(kotor, jenis) {
    const beratKotor = parseFloat(kotor) || 0;
    const jenisLower = String(jenis || '').toLowerCase();
    const multiplier = jenisLower === 'sapi' ? COEFFICIENT_SAPI : COEFFICIENT_KAMBING;
    return beratKotor * multiplier;
}

function perbaruiDropdownTahun() {
    const years = new Set([STANDARD_YEAR]);
    [
        dataHewan,
        dataPenerima,
        dataKeuangan,
        dataPanitia,
        distribusiRows
    ].forEach((rows) => {
        if (!Array.isArray(rows)) return;
        rows.forEach((row) => {
            if (row && row.tahun) years.add(String(row.tahun));
        });
    });

    const sortedYears = Array.from(years).filter(Boolean).sort().reverse();
    const filterSelectIds = [
        'filterTahunDashboard',
        'filterTahunHewan',
        'filterTahunPenerima',
        'filterTahunPanitia',
        'filterTahunKeuangan',
        'filterTahunDistribusi',
        'tahunLaporanDistribusi'
    ];

    filterSelectIds.forEach((id) => {
        const select = document.getElementById(id);
        if (!select) return;

        const currentValue = select.value || null;
        const allValue = id === 'filterTahunDistribusi' ? 'all' : 'SemuaTahun';
        select.innerHTML = `<option value="${allValue}">Semua Tahun</option>`;
        sortedYears.forEach((year) => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        });

        // Prefer STANDARD_YEAR (sysdate) when available, otherwise use previously selected value,
        // otherwise fall back to the most recent year, else the generic "Semua Tahun"/"all" value.
        if (sortedYears.includes(STANDARD_YEAR)) {
            select.value = STANDARD_YEAR;
        } else if (currentValue && Array.from(select.options).some((o) => o.value === currentValue)) {
            select.value = currentValue;
        } else if (sortedYears[0]) {
            select.value = sortedYears[0];
        } else {
            select.value = allValue;
        }
    });

    const tahunDistribusi = document.getElementById('tahunDistribusi');
    if (tahunDistribusi) {
        const currentValue = tahunDistribusi.value || STANDARD_YEAR;
        tahunDistribusi.innerHTML = '<option value="">Pilih Tahun</option>';
        sortedYears.forEach((year) => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            tahunDistribusi.appendChild(option);
        });
        // Default the distribusi form year to STANDARD_YEAR when present, else the newest available
        tahunDistribusi.value = sortedYears.includes(STANDARD_YEAR)
            ? STANDARD_YEAR
            : (sortedYears[0] || '');
    }

    // Fill form input year fields (tahunHewan, tahunPenerima, tahunPanitia, tahun for keuangan)
    const formYearIds = ['tahunHewan', 'tahunPenerima', 'tahunPanitia', 'tahun'];
    formYearIds.forEach((id) => {
        const select = document.getElementById(id);
        if (!select) return;
        
        const currentValue = select.value || STANDARD_YEAR;
        select.innerHTML = '<option value="">Pilih Tahun</option>';
        sortedYears.forEach((year) => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        });
        // Default form year selects to STANDARD_YEAR (sysdate) when available
        select.value = sortedYears.includes(STANDARD_YEAR)
            ? STANDARD_YEAR
            : (sortedYears[0] || STANDARD_YEAR);
    });

    if (typeof perbaruiDropdownTahunPanitia === 'function') {
        perbaruiDropdownTahunPanitia();
    }
}

function updateOwnerFieldControls() {
    const category = document.getElementById('kategoriPenerima')?.value || '';
    const groupBerat = document.getElementById('groupBeratPerBungkus');
    const beratInput = document.getElementById('beratPerBungkus');
    const isShahibul = category === 'Shahibul Qurban' || category === 'Sahibul Qurban';

    if (groupBerat) groupBerat.style.display = isShahibul ? 'none' : 'block';
    if (beratInput) {
        beratInput.required = !isShahibul;
        beratInput.disabled = isShahibul;
        if (isShahibul) beratInput.value = '';
    }
}

function renderShahibulOwnerList() {
    const list = document.getElementById('shahibulAutoList');
    if (!list) return;

    const tahun = document.getElementById('tahunDistribusi')?.value || STANDARD_YEAR;
    const source = document.getElementById('sumberDaging')?.value || 'Sapi';
    const sourceLower = source.toLowerCase();
    const rows = Array.isArray(dataHewan) ? dataHewan : [];
    const ownerRows = rows
        .filter((h) => String(h.tahun || '').trim() === String(tahun).trim())
        .filter((h) => typeof matchesSource === 'function' ? matchesSource(h.jenis, sourceLower) : String(h.jenis || '').toLowerCase() === sourceLower)
        .flatMap((h) => {
            const owners = parseOwnerNames(h.pemilik);
            const totalDaging = parseFloat(h.daging || h.kotor || 0) || 0;
            const beratPerOwner = owners.length > 0 ? totalDaging / owners.length : 0;
            return owners.map((name) => ({
                name,
                jenis: h.jenis || '-',
                beratPerOwner
            }));
        });

    const totalsByOwner = ownerRows.reduce((acc, row) => {
        if (!row.name) return acc;
        if (!acc[row.name]) acc[row.name] = { total: 0, jenis: new Set() };
        acc[row.name].total += row.beratPerOwner;
        acc[row.name].jenis.add(row.jenis);
        return acc;
    }, {});
    const ownerNames = Object.keys(totalsByOwner);

    list.innerHTML = ownerNames.length
        ? ownerNames.map((name) => {
            const detail = totalsByOwner[name];
            const jenis = Array.from(detail.jenis).join(', ');
            return `<div class="flex justify-between gap-2 border-b border-slate-100 py-2 text-sm">
                <span>${name}</span>
                <span class="font-semibold text-slate-900">${detail.total.toFixed(2)} KG <span class="text-slate-400">(${jenis})</span></span>
            </div>`;
        }).join('')
        : '<span class="text-muted">Belum ada pemilik untuk tahun dan sumber daging ini.</span>';
}

function createPdfHelpers(doc, pageWidth, pageHeight) {
    let totalPages = 0;

    function addProfessionalHeader(mainTitle = '', subtitle = '', metadata = {}) {
        // Reset to top of page
        const headerStartY = 12;
        
        // Main institutional title - Dark Slate Blue (#1e3a5f)
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 58, 95);
        doc.text('SISTEM INTEGRASI MANAJEMEN QURBAN AL JIHAD', pageWidth / 2, headerStartY + 5, { align: 'center' });
        
        // Institutional subtitle
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80, 100, 110);
        doc.text('Masjid Al Jihad - Operation & Logistics Center', pageWidth / 2, headerStartY + 11, { align: 'center' });
        
        // Separator line
        doc.setDrawColor(4, 106, 56); // Emerald Green
        doc.setLineWidth(0.5);
        doc.line(14, headerStartY + 14, pageWidth - 14, headerStartY + 14);
        
        // Metadata section: Printed date and report info
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80, 100, 110);
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        doc.text(`Dicetak: ${dateStr}`, 14, headerStartY + 19);
        
        if (metadata.year) {
            doc.text(`Tahun Anggaran: ${metadata.year}`, pageWidth - 50, headerStartY + 19);
        }
        
        if (metadata.summary) {
            doc.text(`Total Item: ${metadata.summary}`, pageWidth - 50, headerStartY + 24);
        }
        
        // Report title
        if (mainTitle) {
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(37, 64, 41);
            doc.text(mainTitle, 14, headerStartY + 30);
        }
        
        // Report subtitle
        if (subtitle) {
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(90, 120, 110);
            doc.text(subtitle, 14, headerStartY + 36);
        }
        
        return headerStartY + 40;
    }

    function addPageHeader(title, subtitle = '') {
        // Fallback to old simple header for backward compatibility
        doc.setFontSize(15);
        doc.setTextColor(37, 64, 41);
        doc.text(title, 14, 18);
        if (subtitle) {
            doc.setFontSize(10);
            doc.setTextColor(90);
            doc.text(subtitle, 14, 26);
        }
    }

    function addFooter() {
        const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8);
        doc.setTextColor(120);
        
        // Show "Halaman X dari Y" if totalPages is set, otherwise just show page number
        if (totalPages > 0) {
            doc.text(`Halaman ${pageNumber} dari ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
        } else {
            doc.text(`Halaman ${pageNumber}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
        }
    }

    function setTotalPages(total) {
        totalPages = total;
    }

    function tableOptions(startY) {
        return {
            startY,
            margin: { left: 14, right: 14 },
            theme: 'grid',
            headStyles: {
                fillColor: [4, 106, 56], // Emerald Green (#046A38)
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [51, 65, 85], // Slate-700
                valign: 'middle'
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
                overflow: 'linebreak',
                font: 'helvetica'
            },
            didDrawPage: () => addFooter()
        };
    }

    return { addPageHeader, addProfessionalHeader, addFooter, tableOptions, setTotalPages };
}

function bindPerhitunganActions() {
    const tab = document.getElementById('tab-perhitungan');
    if (tab && !tab.dataset.perhitunganBound) {
        tab.addEventListener('shown.bs.tab', async () => {
            if (typeof loadPerhitungan === 'function') await loadPerhitungan();
            if (typeof loadDistribusiData === 'function') await loadDistribusiData();
        });
        tab.dataset.perhitunganBound = '1';
    }

    const printButton = document.getElementById('printDistribusiBtn');
    if (printButton && !printButton.dataset.printBound) {
        printButton.addEventListener('click', () => {
            if (typeof printDistribusiReport === 'function') {
                printDistribusiReport();
            }
        });
        printButton.dataset.printBound = '1';
    }
}

function bindShellNavigationTitle() {
    const title = document.getElementById('appPageTitle');
    if (!title) return;

    const labels = {
        'tab-dashboard': 'Dashboard Ringkas Qurban',
        'tab-perhitungan': 'Distribusi & Perhitungan',
        'tab-hewan': 'Inventaris Hewan Qurban',
        'tab-penerima': 'Penerima Manfaat Qurban',
        'tab-panitia': 'Struktur Panitia Qurban',
        'tab-keuangan': 'Laporan Keuangan Qurban'
    };

    Object.entries(labels).forEach(([tabId, label]) => {
        const tab = document.getElementById(tabId);
        if (!tab || tab.dataset.titleBound) return;
        tab.addEventListener('shown.bs.tab', () => {
            title.textContent = label;
        });
        tab.dataset.titleBound = '1';
    });
}

function initializeDistribusiForm() {
    if (typeof populateDistribusiRTOptions === 'function') {
        populateDistribusiRTOptions();
    }
    if (typeof updateKategoriPenerimaFields === 'function') {
        updateKategoriPenerimaFields();
    } else {
        updateOwnerFieldControls();
        renderShahibulOwnerList();
    }
}

async function initializeAppData() {
    showLoading?.();
    try {
        await Promise.all([
            typeof initDataHewan === 'function' ? initDataHewan() : Promise.resolve(),
            typeof initDataPenerima === 'function' ? initDataPenerima() : Promise.resolve(),
            typeof loadPanitiaData === 'function' ? loadPanitiaData() : Promise.resolve(),
            typeof initDataKeuangan === 'function' ? initDataKeuangan() : Promise.resolve(),
            typeof loadDistribusiData === 'function' ? loadDistribusiData() : Promise.resolve()
        ]);

        if (typeof loadDashboardMetrics === 'function') {
            await loadDashboardMetrics();
        }
        if (typeof loadPerhitungan === 'function') {
            await loadPerhitungan();
        }
        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
        bindPerhitunganActions();
        initializeDistribusiForm();
    } catch (error) {
        console.error('Gagal memuat data awal:', error);
        showToast('Gagal memuat data dari database', 'error', 5000);
    } finally {
        hideLoading?.();
        if (window.lucide) lucide.createIcons();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setDefaultYearValues();
    if (typeof adjustOwnerFieldsForJenis === 'function') {
        adjustOwnerFieldsForJenis();
    }
    bindPerhitunganActions();
    bindShellNavigationTitle();
    initializeDistribusiForm();
    initializeAppData();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('❌ Application Error:', event.error);
    showToast('Terjadi kesalahan aplikasi', 'error', 5000);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled Promise:', event.reason);
    showToast('Terjadi kesalahan jaringan', 'error', 5000);
});

// Connection status monitoring
window.addEventListener('online', () => {
    showToast('Koneksi Internet: Online', 'success', 2000);
});

window.addEventListener('offline', () => {
    showToast('Koneksi Internet: Offline', 'warning', 3000);
});

console.log('🚀 App initialization complete');
