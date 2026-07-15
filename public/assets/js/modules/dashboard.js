/**
 * DASHBOARD MODULE - Qurban Management System
 * Handles overview, monitoring, and dashboard visualization
 * 
 * Dependencies: Chart.js, jsPDF, formatters, helpers
 * API Endpoint: api.php
 */

// ============================================
// DASHBOARD METRICS & INITIALIZATION
// ============================================

/**
 * Load dashboard metrics from server
 * @param {string} year - Optional year filter (defaults to selected dashboard year)
 * @returns {Promise} Dashboard data object
 */
async function loadDashboardMetrics(year) {
    const selectedYear = typeof year === 'string' ? year : getSelectedDashboardYear();
    const queryYear = selectedYear === 'SemuaTahun' ? '' : selectedYear;
    const url = queryYear ? `${apiUrl}?action=getDashboard&tahun=${encodeURIComponent(queryYear)}` : `${apiUrl}?action=getDashboard`;

    try {
        const response = await fetch(url);
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Gagal memuat data dashboard.');
        }
        dashboardMetrics = result.data || null;
    } catch (error) {
        console.error('Gagal memuat data dashboard:', error);
        dashboardMetrics = null;
    }

    renderDashboardSummary();
    return dashboardMetrics;
}

/**
 * Render dashboard summary statistics
 * Updates stat cards with hewan and penerima totals
 */
function renderDashboardSummary() {
    const hewan = dashboardMetrics?.hewan || {};
    const penerima = dashboardMetrics?.penerima || {};

    const statTotalHewan = document.getElementById('statTotalHewan');
    const statTotalPenerima = document.getElementById('statTotalPenerima');
    const statSudahDiambil = document.getElementById('statSudahDiambil');
    const statBelumDiambil = document.getElementById('statBelumDiambil');

    if (statTotalHewan) statTotalHewan.innerText = Number.isFinite(hewan.total) ? hewan.total : (Array.isArray(dataHewan) ? dataHewan.length : 0);
    if (statTotalPenerima) statTotalPenerima.innerText = Number.isFinite(penerima.total) ? penerima.total : (Array.isArray(dataPenerima) ? dataPenerima.length : 0);
    if (statSudahDiambil) statSudahDiambil.innerText = Number.isFinite(penerima.sudah_diambil) ? penerima.sudah_diambil : (Array.isArray(dataPenerima) ? dataPenerima.filter(p => p.status === 'Sudah Diambil').length : 0);
    if (statBelumDiambil) statBelumDiambil.innerText = Number.isFinite(penerima.belum_diambil) ? penerima.belum_diambil : (Array.isArray(dataPenerima) ? dataPenerima.filter(p => p.status !== 'Sudah Diambil').length : 0);

    const dashTotalSapi = document.getElementById('dashTotalSapi');
    const dashTotalKambing = document.getElementById('dashTotalKambing');
    const dashTotalHewan = document.getElementById('dashTotalHewan');
    const dashBeratBersih = document.getElementById('dashBeratBersih');

    const sapiCount = dashboardMetrics?.hewan?.sapi?.total_ekor;
    const kambingCount = dashboardMetrics?.hewan?.kambing?.total_ekor;
    const totalDaging = dashboardMetrics?.hewan?.total_berat_daging;

    if (dashTotalSapi) dashTotalSapi.innerText = Number.isFinite(sapiCount) ? sapiCount : (Array.isArray(dataHewan) ? dataHewan.filter(h => (h.jenis || '').toString().toLowerCase() === 'sapi').length : 0);
    if (dashTotalKambing) dashTotalKambing.innerText = Number.isFinite(kambingCount) ? kambingCount : (Array.isArray(dataHewan) ? dataHewan.filter(h => (h.jenis || '').toString().toLowerCase() === 'kambing').length : 0);
    if (dashTotalHewan) dashTotalHewan.innerText = Number.isFinite(hewan.total) ? hewan.total : (Array.isArray(dataHewan) ? dataHewan.length : 0);
    if (dashBeratBersih) dashBeratBersih.innerText = Number.isFinite(totalDaging) ? formatWeight(totalDaging) : formatWeight((Array.isArray(dataHewan) ? dataHewan.reduce((sum, h) => sum + (parseFloat(h.daging ?? h.berat_daging ?? 0) || 0), 0) : 0));
}

/**
 * Update dashboard with latest data
 * Syncs statistics and renders updated dashboard
 */
function updateDashboard() {
    const daftarHewan = Array.isArray(dataHewan) ? dataHewan : [];
    const daftarPenerima = Array.isArray(dataPenerima) ? dataPenerima : [];

    const elTotalHewan = document.getElementById('statTotalHewan');
    if (elTotalHewan) elTotalHewan.innerText = daftarHewan.length;

    const totalPenerima = daftarPenerima.length;
    const sudah = daftarPenerima.filter(p => p.status === 'Sudah Diambil').length;
    const belum = totalPenerima - sudah;

    const totalSapi = daftarHewan.filter(h => (h.jenis || '').toString().toLowerCase() === 'sapi').length;
    const totalKambing = daftarHewan.filter(h => (h.jenis || '').toString().toLowerCase() === 'kambing').length;

    const elTotalPenerima = document.getElementById('statTotalPenerima');
    const elSudah = document.getElementById('statSudahDiambil');
    const elBelum = document.getElementById('statBelumDiambil');
    const elJumlahSapi = document.getElementById('statJumlahSapi');
    const elJumlahKambing = document.getElementById('statJumlahKambing');

    if (elTotalPenerima) elTotalPenerima.innerText = totalPenerima;
    if (elSudah) elSudah.innerText = sudah;
    if (elBelum) elBelum.innerText = belum;
    if (elJumlahSapi) elJumlahSapi.innerText = totalSapi;
    if (elJumlahKambing) elJumlahKambing.innerText = totalKambing;

    renderDashboard();
}

function setDashboardRefreshButtonsLoading(isLoading) {
    const buttons = document.querySelectorAll('button[onclick*="refreshDashboard"]');

    buttons.forEach((button) => {
        if (!button) return;

        if (!button.dataset.refreshOriginalMarkup) {
            button.dataset.refreshOriginalMarkup = button.innerHTML;
        }

        button.disabled = isLoading;
        button.classList.toggle('is-loading', isLoading);

        if (isLoading) {
            button.innerHTML = `
                <span class="inline-flex items-center gap-2">
                    <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent"></span>
                    <span>Memuat...</span>
                </span>
            `;
        } else {
            button.innerHTML = button.dataset.refreshOriginalMarkup;
        }
    });
}

function setDashboardContentLoading(isLoading) {
    const topGrid = document.getElementById('dashboardMonitoring');
    const lowerGrid = document.querySelector('.dashboard-summary-cards');
    const chartWrapper = document.getElementById('dashboardChartWrapper');
    const tableBody = document.getElementById('dashboardHewanTableBody');
    const tablePagination = document.getElementById('dashboardHewanPagination');
    function saveOriginal(el) {
        if (!el) return;
        if (!el.dataset.originalHtml) el.dataset.originalHtml = el.innerHTML;
    }

    function restoreOriginalIfSkeleton(el) {
        if (!el || !el.dataset.originalHtml) return;
        const hasSkeleton = el.querySelector && (el.querySelector('.dashboard-loading-shimmer') || el.querySelector('.dashboard-loading-card'));
        if (hasSkeleton) {
            el.innerHTML = el.dataset.originalHtml;
        }
        delete el.dataset.originalHtml;
    }

    if (isLoading) {
        if (topGrid) {
            saveOriginal(topGrid);
            topGrid.classList.add('dashboard-loading-state');
            topGrid.innerHTML = Array.from({ length: 6 }, (_, index) => `
                <div class="dashboard-loading-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="dashboard-loading-shimmer h-10 w-10 rounded-xl"></div>
                    <div class="mt-4 space-y-2">
                        <div class="dashboard-loading-shimmer h-3 w-24 rounded"></div>
                        <div class="dashboard-loading-shimmer h-7 w-16 rounded"></div>
                    </div>
                </div>
            `).join('');
        }

        if (lowerGrid) {
            saveOriginal(lowerGrid);
            lowerGrid.classList.add('dashboard-loading-state');
            lowerGrid.innerHTML = Array.from({ length: 4 }, () => `
                <div class="dashboard-loading-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="dashboard-loading-shimmer h-10 w-10 rounded-xl"></div>
                    <div class="mt-4 space-y-2">
                        <div class="dashboard-loading-shimmer h-3 w-28 rounded"></div>
                        <div class="dashboard-loading-shimmer h-7 w-20 rounded"></div>
                    </div>
                </div>
            `).join('');
        }

        if (chartWrapper) {
            saveOriginal(chartWrapper);
            chartWrapper.classList.add('dashboard-loading-state');
            chartWrapper.innerHTML = `
                <div class="dashboard-loading-card h-full min-h-[280px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="dashboard-loading-shimmer h-5 w-40 rounded"></div>
                    <div class="mt-5 space-y-3">
                        <div class="dashboard-loading-shimmer h-4 w-full rounded"></div>
                        <div class="dashboard-loading-shimmer h-4 w-11/12 rounded"></div>
                        <div class="dashboard-loading-shimmer h-4 w-10/12 rounded"></div>
                        <div class="dashboard-loading-shimmer h-4 w-9/12 rounded"></div>
                        <div class="dashboard-loading-shimmer h-4 w-8/12 rounded"></div>
                    </div>
                </div>
            `;
        }

        if (tableBody) {
            saveOriginal(tableBody);
            tableBody.innerHTML = Array.from({ length: 5 }, () => `
                <tr>
                    <td class="px-4 py-3"><div class="dashboard-loading-shimmer h-4 w-20 rounded"></div></td>
                    <td class="px-4 py-3"><div class="dashboard-loading-shimmer h-4 w-24 rounded"></div></td>
                    <td class="px-4 py-3"><div class="dashboard-loading-shimmer h-4 w-14 rounded"></div></td>
                    <td class="px-4 py-3"><div class="dashboard-loading-shimmer h-4 w-16 rounded"></div></td>
                    <td class="px-4 py-3"><div class="dashboard-loading-shimmer h-4 w-16 rounded"></div></td>
                </tr>
            `).join('');
        }

        if (tablePagination) tablePagination.style.opacity = '0.6';
    } else {
        if (topGrid) {
            topGrid.classList.remove('dashboard-loading-state');
            restoreOriginalIfSkeleton(topGrid);
        }

        if (lowerGrid) {
            lowerGrid.classList.remove('dashboard-loading-state');
            restoreOriginalIfSkeleton(lowerGrid);
        }

        if (chartWrapper) {
            chartWrapper.classList.remove('dashboard-loading-state');
            restoreOriginalIfSkeleton(chartWrapper);
        }

        if (tableBody) {
            restoreOriginalIfSkeleton(tableBody);
        }

        if (tablePagination) tablePagination.style.opacity = '1';
    }
}

async function refreshDashboard(year) {
    const selectedYear = typeof year === 'string' ? year : getSelectedDashboardYear();

    setDashboardRefreshButtonsLoading(true);
    setDashboardContentLoading(true);
    showLoading();

    try {
        await loadDashboardMetrics(selectedYear);
        // restore DOM skeletons first so renderDashboard can find elements
        setDashboardContentLoading(false);
        renderDashboard();
    } catch (error) {
        console.error('refreshDashboard error:', error);
        // show error overlay with retry
        showLoading(error.message || 'Gagal memuat data dashboard.', true);
    } finally {
        setDashboardRefreshButtonsLoading(false);
        // only hide overlay when not in error state
        const overlay = document.getElementById('loadingOverlay');
        if (!overlay || !overlay.classList.contains('loading-error')) {
            hideLoading();
        }
    }
}

function ensureDashboardLayout() {
    try {
        const topGrid = document.getElementById('dashboardMonitoring');
        if (topGrid && !topGrid.dataset.layoutInjected) {
            topGrid.className = 'mt-6 grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8';
            topGrid.innerHTML = `
                    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all">
                        <div class="flex items-center justify-between">
                            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 7.5L12 3l9 4.5v10.5L12 21 3 18V7.5z" />
                                    <path d="M3 7.5l9 4.5 9-4.5" />
                                    <path d="M12 3v18" />
                                </svg>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Total Hewan</span>
                            <h3 id="statTotalHewan" class="text-2xl font-bold text-slate-800 mt-0.5">0</h3>
                        </div>
                    </div>
                    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all">
                        <div class="flex items-center justify-between">
                            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Total Penerima</span>
                            <h3 id="statTotalPenerima" class="text-2xl font-bold text-slate-800 mt-0.5">0</h3>
                        </div>
                    </div>
                    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all">
                        <div class="flex items-center justify-between">
                            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 12a4 4 0 1 0-4-4" />
                                    <path d="M8 18v-2a4 4 0 0 1 4-4h1" />
                                    <path d="M16 19l2 2 4-4" />
                                </svg>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Sudah Diambil</span>
                            <h3 id="statSudahDiambil" class="text-2xl font-bold text-emerald-600 mt-0.5">0</h3>
                        </div>
                    </div>
                    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all">
                        <div class="flex items-center justify-between">
                            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 7v5l3 3" />
                                </svg>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Belum Diambil</span>
                            <h3 id="statBelumDiambil" class="text-2xl font-bold text-amber-600 mt-0.5">0</h3>
                        </div>
                    </div>
                    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all">
                        <div class="flex items-center justify-between">
                            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="5" width="18" height="6" rx="2" />
                                    <rect x="3" y="13" width="18" height="6" rx="2" />
                                </svg>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Jumlah Sapi</span>
                            <h3 id="statJumlahSapi" class="text-2xl font-bold text-slate-800 mt-0.5">0</h3>
                        </div>
                    </div>
                    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all">
                        <div class="flex items-center justify-between">
                            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17 20c0-3-3-5-5-5s-5 2-5 5" />
                                    <path d="M12 15V5" />
                                    <path d="M8 9l4-4 4 4" />
                                </svg>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Jumlah Kambing</span>
                            <h3 id="statJumlahKambing" class="text-2xl font-bold text-slate-800 mt-0.5">0</h3>
                        </div>
                    </div>
            `;
            topGrid.dataset.layoutInjected = 'true';
        }

        const pageBar = document.querySelector('.page-title-bar');
        if (pageBar && !pageBar.dataset.layoutInjected) {
            const selectEl = document.getElementById('filterTahunDashboard');
            let selectHtml;
            if (selectEl) {
                selectEl.className = 'form-select h-10 w-40 rounded-xl border border-slate-200 bg-slate-50/40 px-3 text-sm text-slate-600 outline-none';
                selectEl.setAttribute('onchange', 'dashboardHewanCurrentPage = 1; refreshDashboard(this.value);');
                selectHtml = selectEl.outerHTML;
            } else {
                selectHtml = '<select id="filterTahunDashboard" class="form-select h-10 w-40 rounded-xl border border-slate-200 bg-slate-50/40 px-3 text-sm text-slate-600 outline-none" onchange="dashboardHewanCurrentPage = 1; refreshDashboard(this.value);"></select>';
            }

            const refreshBtn = document.querySelector('button[onclick="renderDashboard()"]');
            let refreshHtml;
            if (refreshBtn) {
                refreshBtn.className = 'h-10 bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-4 text-sm font-semibold transition whitespace-nowrap';
                refreshBtn.setAttribute('onclick', 'refreshDashboard()');
                refreshHtml = refreshBtn.outerHTML;
            } else {
                refreshHtml = '<button class="h-10 bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-4 text-sm font-semibold transition whitespace-nowrap" onclick="refreshDashboard()">Segarkan</button>';
            }

            const printBtn = document.getElementById('printLaporanTahunanBtn');
            let printHtml;
            if (printBtn) {
                printBtn.className = 'h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 text-sm font-semibold transition whitespace-nowrap flex items-center justify-center';
                printHtml = printBtn.outerHTML;
            } else {
                printHtml = '<button id="printLaporanTahunanBtn" class="h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 text-sm font-semibold transition whitespace-nowrap flex items-center justify-center" onclick="window.cetakLaporanPDF_Lengkap()">Cetak Laporan Tahunan</button>';
            }

            pageBar.innerHTML = `
                <div class="w-full bg-white p-5 rounded-xl border border-slate-100/60 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div class="flex-1">
                        <h4 class="fw-bold mb-0">Dashboard Ringkas Qurban</h4>
                        <p class="text-muted mb-0 text-sm">Ringkasan real-time untuk hewan, berat daging, dan distribusi per RT.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        ${selectHtml}
                        ${refreshHtml}
                        ${printHtml}
                    </div>
                </div>
            `;
            pageBar.dataset.layoutInjected = 'true';
        }

        const lowerGrid = document.querySelector('.dashboard-summary-cards');
        if (lowerGrid && !lowerGrid.dataset.layoutInjected) {
            lowerGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6 dashboard-summary-cards';
            lowerGrid.innerHTML = `
                    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all">
                        <div class="flex items-center justify-between">
                            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 7.5L12 3l9 4.5v10.5L12 21 3 18V7.5z" />
                                    <path d="M3 7.5l9 4.5 9-4.5" />
                                    <path d="M12 3v18" />
                                </svg>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Total Hewan Tahun Ini</span>
                            <h3 id="dashTotalHewan" class="text-2xl font-bold text-slate-800 mt-0.5">0</h3>
                        </div>
                    </div>
                    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all">
                        <div class="flex items-center justify-between">
                            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M6 17l3-3 2 2 3-3 4 4" />
                                    <path d="M5 12h14" />
                                    <path d="M6 7h12" />
                                </svg>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Total Berat Bersih</span>
                            <h3 id="dashBeratBersih" class="text-2xl font-bold text-slate-800 mt-0.5">0</h3>
                        </div>
                    </div>
                    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all">
                        <div class="flex items-center justify-between">
                            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M6 3v5" />
                                    <path d="M18 3v5" />
                                    <path d="M4 8h16" />
                                    <path d="M5 21h14" />
                                    <path d="M8 13a4 4 0 1 1 8 0" />
                                </svg>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Total Sapi</span>
                            <h3 id="dashTotalSapi" class="text-2xl font-bold text-slate-800 mt-0.5">0</h3>
                        </div>
                    </div>
                    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all">
                        <div class="flex items-center justify-between">
                            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M4 18h16" />
                                    <path d="M4 12h16" />
                                    <path d="M4 6h16" />
                                </svg>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Total Kambing</span>
                            <h3 id="dashTotalKambing" class="text-2xl font-bold text-slate-800 mt-0.5">0</h3>
                        </div>
                    </div>
            `;
            lowerGrid.dataset.layoutInjected = 'true';
        }

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    } catch (error) {
        console.error('Error injecting dashboard layout:', error);
    }
}

/**
 * Main dashboard render function
 * Renders summary metrics, charts, and tables
 */
function renderDashboard() {
    ensureDashboardLayout();
    renderDashboardSummary();
    const hewan = Array.isArray(dataHewan) ? dataHewan : [];
    const rows = Array.isArray(distribusiRows) ? distribusiRows : [];
    const selectedYear = getSelectedDashboardYear();
    const filteredHewan = selectedYear === 'SemuaTahun' ? hewan : hewan.filter(h => String(h.tahun || '').trim() === String(selectedYear).trim());
    const filteredRows = selectedYear === 'SemuaTahun' ? rows : rows.filter(r => String(r.tahun || '').trim() === String(selectedYear).trim());

    const totalHewan = Number.isFinite(dashboardMetrics?.hewan?.total) ? dashboardMetrics.hewan.total : filteredHewan.length;
    const totalSapi = Number.isFinite(dashboardMetrics?.hewan?.sapi?.total_ekor) ? dashboardMetrics.hewan.sapi.total_ekor : filteredHewan.filter(h => (h.jenis || '').toString().toLowerCase() === 'sapi').length;
    const totalKambing = Number.isFinite(dashboardMetrics?.hewan?.kambing?.total_ekor) ? dashboardMetrics.hewan.kambing.total_ekor : filteredHewan.filter(h => (h.jenis || '').toString().toLowerCase() === 'kambing').length;
    
    const totalBeratBersih = (() => {
        if (Number.isFinite(dashboardMetrics?.hewan?.total_berat_daging)) {
            return dashboardMetrics.hewan.total_berat_daging;
        }
        
        const bersihPerJenis = {};
        ['sapi', 'kambing'].forEach(jenis => {
            const hewanJenis = filteredHewan.filter(h => (h.jenis || '').toString().toLowerCase() === jenis);
            if (hewanJenis.length > 0) {
                const totalKotor = hewanJenis.reduce((sum, h) => sum + (parseFloat(h.kotor || h.berat_kotor || 0) || 0), 0);
                const coefficient = jenis === 'sapi' ? COEFFICIENT_SAPI : COEFFICIENT_KAMBING;
                const beratPerEkor = totalKotor / hewanJenis.length;
                bersihPerJenis[jenis] = beratPerEkor * coefficient * hewanJenis.length;
            } else {
                bersihPerJenis[jenis] = 0;
            }
        });
        return (bersihPerJenis.sapi || 0) + (bersihPerJenis.kambing || 0);
    })();

    const dashTotalHewan = document.getElementById('dashTotalHewan');
    const dashTotalSapi = document.getElementById('dashTotalSapi');
    const dashTotalKambing = document.getElementById('dashTotalKambing');
    const dashBeratBersih = document.getElementById('dashBeratBersih');

    if (dashTotalHewan) dashTotalHewan.innerText = totalHewan;
    if (dashTotalSapi) dashTotalSapi.innerText = totalSapi;
    if (dashTotalKambing) dashTotalKambing.innerText = totalKambing;
    if (dashBeratBersih) dashBeratBersih.innerText = formatWeight(totalBeratBersih);

    const chartElement = document.getElementById('dashboardRtChart');
    if (!chartElement) return;

    const counts = filteredRows.reduce((acc, row) => {
        const rawCategory = String(row?.kategori || row?.Kategori || '').trim();
        const normalizedCategory = rawCategory.toLowerCase();
        const rtValue = normalizeRtValue(row?.rt || row?.RT || row?.rt_distribusi || '');
        const category = /sahibul|shahibul/i.test(rawCategory)
            ? 'Sahibul Qurban'
            : normalizedCategory === 'panitia'
                ? 'Panitia'
                : normalizedCategory === 'per rt' || normalizedCategory === 'per-rt'
                    ? (rtValue ? `RT ${rtValue}` : 'RT -')
                    : (rawCategory || 'Lainnya');

        acc[category] = (acc[category] || 0) + (parseFloat(row.jumlahBungkus ?? row.jumlah_bungkus ?? row.jumlah_penerima ?? 0) || 0);
        return acc;
    }, {});

    const labels = Object.keys(counts).sort((a, b) => {
        if (a === 'Sahibul Qurban') return -1;
        if (b === 'Sahibul Qurban') return 1;

        const aIsPanitia = a === 'Panitia';
        const bIsPanitia = b === 'Panitia';
        if (aIsPanitia && bIsPanitia) return 0;
        if (aIsPanitia) return -1;
        if (bIsPanitia) return 1;

        const aIsLainnya = a === 'Lainnya';
        const bIsLainnya = b === 'Lainnya';
        if (aIsLainnya && bIsLainnya) return 0;
        if (aIsLainnya) return 1;
        if (bIsLainnya) return -1;

        const aIsRt = /^RT\s+\d+$/i.test(a);
        const bIsRt = /^RT\s+\d+$/i.test(b);
        if (aIsRt && bIsRt) {
            const aNumber = parseInt(a.match(/\d+/)[0], 10);
            const bNumber = parseInt(b.match(/\d+/)[0], 10);
            return aNumber - bNumber;
        }
        if (aIsRt) return -1;
        if (bIsRt) return 1;

        return a.localeCompare(b);
    });
    const data = labels.map(label => counts[label]);

    if (dashboardRtChart && dashboardRtChart.data && Array.isArray(dashboardRtChart.data.datasets)) {
        const chartCanvas = dashboardRtChart.canvas || (dashboardRtChart.ctx && dashboardRtChart.ctx.canvas);
        if (chartCanvas !== chartElement) {
            dashboardRtChart.destroy();
            dashboardRtChart = null;
        }
    }

    if (dashboardRtChart && dashboardRtChart.data && Array.isArray(dashboardRtChart.data.datasets)) {
        dashboardRtChart.data.labels = labels;
        dashboardRtChart.data.datasets[0].data = data;
        dashboardRtChart.update();
        renderDashboardHewanTable();
        return;
    }

    if (dashboardRtChart && typeof dashboardRtChart.destroy === 'function') {
        dashboardRtChart.destroy();
    }
    dashboardRtChart = null;

    const ctx = chartElement.getContext('2d');
    const chartGradient = ctx.createLinearGradient(0, 0, 0, 260);
    chartGradient.addColorStop(0, '#059669');
    chartGradient.addColorStop(1, 'rgba(16, 185, 129, 0.45)');

    dashboardRtChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Jumlah Bungkus per Kategori',
                data,
                backgroundColor: chartGradient,
                borderColor: '#10b981',
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
            },
            scales: {
                x: {
                    grid: {
                        display: true,
                        color: '#f1f5f9',
                        borderColor: '#f1f5f9'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: {
                        color: '#f1f5f9',
                        borderColor: '#f1f5f9'
                    }
                }
            }
        }
    });
    renderDashboardHewanTable();
}

/**
 * Render dashboard hewan table with pagination
 * @param {number} page - Page number to display
 */
function renderDashboardHewanTable(page = 1) {
    const body = document.getElementById('dashboardHewanTableBody');
    const pagination = document.getElementById('dashboardHewanPagination');
    if (!body || !pagination) return;

    const filterTahun = getSelectedDashboardYear();
    const daftarHewan = Array.isArray(dataHewan) ? dataHewan : [];
    const hewanTerfilter = filterTahun === 'SemuaTahun' ? daftarHewan : daftarHewan.filter(h => String(h.tahun || '').trim() === String(filterTahun).trim());
    // Sort by id descending (newest first)
    hewanTerfilter.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
    const totalItems = hewanTerfilter.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / dashboardHewanPerPage));
    dashboardHewanCurrentPage = Math.min(Math.max(1, page), totalPages);

    const startIndex = (dashboardHewanCurrentPage - 1) * dashboardHewanPerPage;
    const pageRows = hewanTerfilter.slice(startIndex, startIndex + dashboardHewanPerPage);

    if (pageRows.length === 0) {
        body.innerHTML = `<tr><td colspan="8" class="px-4 py-6 text-center text-sm text-slate-400">Tidak ada data hewan untuk tahun yang dipilih.</td></tr>`;
    } else {
        body.innerHTML = pageRows.map((h, index) => {
            const rtValue = h.rt && h.rt !== '-' ? formatRtLabel(h.rt) : '-';
            const beratKotor = parseFloat(h.kotor || 0) || 0;
            const beratNetto = h.daging && parseFloat(h.daging) > 0 ? parseFloat(h.daging) : calculateBeratBersih(beratKotor, h.jenis);
            const jenisValue = String(h.jenis || '-').trim();
            const jenisBadge = jenisValue.toLowerCase() === 'sapi'
                ? '<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100/50">Sapi</span>'
                : jenisValue.toLowerCase() === 'kambing'
                    ? '<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100/50">Kambing</span>'
                    : `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-100/50">${jenisValue || '-'}</span>`;
            return `<tr class="transition hover:bg-slate-50/80">
                <td class="px-4 py-3 text-sm text-slate-600">${startIndex + index + 1}</td>
                <td class="px-4 py-3 text-sm font-semibold text-slate-700">${STANDARD_YEAR}</td>
                <td class="px-4 py-3 text-sm text-slate-600">${rtValue}</td>
                <td class="px-4 py-3 text-sm text-slate-600">${jenisBadge}</td>
                <td class="px-4 py-3 text-sm font-medium text-slate-700">${formatOwnersForExport(h.pemilik)}</td>
                <td class="px-4 py-3 text-sm text-slate-600">${formatWeight(beratKotor)}</td>
                <td class="px-4 py-3 text-sm text-slate-600">${formatWeight(beratNetto)}</td>
                <td class="px-4 py-3 text-sm text-slate-600">${h.keterangan || '-'}</td>
            </tr>`;
        }).join('');
    }

    renderDashboardHewanPagination(totalPages);
}

/**
 * Render pagination controls for dashboard hewan table
 * @param {number} totalPages - Total number of pages
 */
function renderDashboardHewanPagination(totalPages) {
    const pagination = document.getElementById('dashboardHewanPagination');
    if (!pagination) return;

    const buttons = [];
    buttons.push(`<li class="page-item ${dashboardHewanCurrentPage === 1 ? 'disabled' : ''}"><button class="page-link rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50" type="button" onclick="renderDashboardHewanTable(${dashboardHewanCurrentPage - 1})">Sebelumnya</button></li>`);
    for (let i = 1; i <= totalPages; i++) {
        const isActive = dashboardHewanCurrentPage === i;
        const activeClass = 'h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-sm transition-all';
        const inactiveClass = 'h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 font-medium text-sm shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600';
        buttons.push(`<li class="page-item ${isActive ? 'active' : ''}"><button class="page-link ${isActive ? activeClass : inactiveClass}" type="button" onclick="renderDashboardHewanTable(${i})">${i}</button></li>`);
    }
    buttons.push(`<li class="page-item ${dashboardHewanCurrentPage === totalPages ? 'disabled' : ''}"><button class="page-link rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50" type="button" onclick="renderDashboardHewanTable(${dashboardHewanCurrentPage + 1})">Berikutnya</button></li>`);

    pagination.innerHTML = `<nav aria-label="Navigasi halaman" class="no-print"><ul class="pagination justify-end gap-2 mb-0">${buttons.join('')}</ul></nav>`;
}

/**
 * Calculate and display penerima statistics per RT
 * @param {array} dataTerfilter - Filtered penerima data
 */
function hitungPenerimaPerRT(dataTerfilter) {
    const wrapper = document.getElementById('wrapperMonitoringRT');
    const container = document.getElementById('listStatistikRT');
    
    const fKat = document.getElementById('filterKategori') ? document.getElementById('filterKategori').value : 'Semua';
    
    if (fKat !== 'Warga' || !dataTerfilter || dataTerfilter.length === 0) {
        wrapper.style.display = 'none';
        return;
    }

    wrapper.style.display = 'block';
    container.innerHTML = '';

    const statistik = {};

    dataTerfilter.forEach(p => {
        if (p.kategori === 'Warga' && p.rt && p.rt !== '-') {
            statistik[p.rt] = (statistik[p.rt] || 0) + 1;
        }
    });

    Object.keys(statistik).sort((a,b) => parseInt(a) - parseInt(b)).forEach(rt => {
        container.innerHTML += `
            <span class="rounded-full bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
                ${formatRtLabel(rt)}: <strong>${statistik[rt]}</strong>
            </span>
        `;
    });
}

/**
 * Get selected dashboard year filter
 * @returns {string} Selected year or 'SemuaTahun'
 */
function getSelectedDashboardYear() {
    const select = document.getElementById('filterTahunDashboard');
    return select ? select.value || 'SemuaTahun' : 'SemuaTahun';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Show loading overlay
 */
/**
 * Show loading overlay
 * @param {string} message - status text to show on overlay
 * @param {boolean} isError - whether overlay should show an error state with retry
 */
function showLoading(message = 'Memuat...', isError = false) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;

    overlay.innerHTML = '';
    overlay.style.display = 'flex';
    overlay.classList.toggle('loading-error', !!isError);

    if (isError) {
        overlay.innerHTML = `
            <div class="loading-overlay-card" role="status" aria-live="polite">
                <div class="loading-overlay-spinner loading-error-spinner" aria-hidden="true"></div>
                <div>
                    <div class="loading-overlay-title">Gagal memuat</div>
                    <div class="loading-overlay-text">${message}</div>
                    <div class="mt-3">
                        <button class="btn btn-pill btn-primary" id="overlayRetryBtn">Coba lagi</button>
                        <button class="btn btn-pill btn-outline-secondary ml-2" id="overlayCloseBtn">Tutup</button>
                    </div>
                </div>
            </div>
        `;

        const retry = document.getElementById('overlayRetryBtn');
        if (retry) retry.addEventListener('click', () => {
            const year = getSelectedDashboardYear();
            hideLoading();
            refreshDashboard(year);
        });

        const closeBtn = document.getElementById('overlayCloseBtn');
        if (closeBtn) closeBtn.addEventListener('click', () => hideLoading());
    } else {
        overlay.innerHTML = `
            <div class="loading-overlay-card" role="status" aria-live="polite">
                <div class="loading-overlay-spinner" aria-hidden="true"></div>
                <div>
                    <div class="loading-overlay-title">${message}</div>
                    <div class="loading-overlay-text">Sedang mengambil data terbaru...</div>
                </div>
            </div>
        `;
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    overlay.style.display = 'none';
    overlay.classList.remove('loading-error');
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'info', 'success', or 'error'
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';
    toast.className = `alert ${bgClass} text-white alert-dismissible fade show toast-item`;
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.getElementById('toastContainer').appendChild(toast);
    
    if (duration > 0) {
        setTimeout(() => {
            toast.remove();
        }, duration);
    }
}

/**
 * Cetak laporan tahunan lengkap dalam format PDF terstruktur.
 * Menyusun: hasil pendistribusian, daftar panitia, daftar hewan,
 * laporan keuangan (pemasukan & pengeluaran), serta daftar penerima.
 */
const cetakLaporanTahunanDashboard = function() {
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        showToast('Library PDF tidak tersedia. Silakan refresh halaman.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const helper = typeof createPdfHelpers === 'function'
        ? createPdfHelpers(doc, pageWidth, pageHeight)
        : {
            addPageHeader: (title, subtitle) => {
                doc.setFontSize(15);
                doc.setTextColor(37, 64, 41);
                doc.text(title, 14, 18);
                if (subtitle) {
                    doc.setFontSize(10);
                    doc.setTextColor(90);
                    doc.text(subtitle, 14, 26);
                }
            },
            addFooter: () => {
                const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
                doc.setFontSize(8);
                doc.setTextColor(120);
                doc.text(`Halaman ${pageNumber}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
            },
            tableOptions: (startY) => ({
                startY,
                margin: { left: 14, right: 14 },
                theme: 'grid',
                headStyles: {
                    fillColor: [42, 143, 93],
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
                styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' }
            })
        };

    const { addPageHeader, addFooter, tableOptions } = helper;
    const tahun = getSelectedDashboardYear();
    const filterTahun = tahun === 'SemuaTahun' ? null : String(tahun).trim();

    const safeArray = arr => Array.isArray(arr) ? arr : [];
    const getYearValue = row => String(row?.tahun ?? row?.TAHUN ?? row?.tahun_panitia ?? '').trim();
    const filterByYear = rows => safeArray(rows).filter(row => !filterTahun || getYearValue(row) === filterTahun);

    const distribusi = filterByYear(distribusiRows);
    const panitia = filterByYear(dataPanitia);
    const hewan = filterByYear(dataHewan);
    const keuangan = filterByYear(dataKeuangan);
    const penerima = filterByYear(dataPenerima);

    const formatNumber = v => (Number.isFinite(Number(v)) ? Number(v).toLocaleString('id-ID') : '0');
    const formatCurrency = v => {
        const n = Number(v) || 0;
        return `Rp ${n.toLocaleString('id-ID')}`;
    };
    const formatOwnerValue = value => (typeof formatOwnersForExport === 'function' ? formatOwnersForExport(value) : (value || '-'));

    const pemasukanRows = [];
    const pengeluaranRows = [];
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    keuangan.forEach(entry => {
        const amount = parseFloat(entry.nominal ?? entry.jumlah ?? entry.amount ?? entry.value ?? 0) || 0;
        const tipe = String(entry.tipe || entry.kategori || entry.jenis || '').toLowerCase();
        const row = Object.assign({ amount }, entry);

        if (tipe.includes('masuk') || tipe.includes('pemasukan') || (amount > 0 && String(entry.kredit || '').length)) {
            pemasukanRows.push(row);
            totalPemasukan += Math.abs(amount);
        } else {
            pengeluaranRows.push(row);
            totalPengeluaran += Math.abs(amount);
        }
    });

    const title = 'Laporan Tahunan Qurban';
    const subtitle = `Periode: ${tahun === 'SemuaTahun' ? 'Semua Tahun' : tahun}`;
    const safeName = String(tahun).replace(/[^a-zA-Z0-9]/g, '_');

    const aggregateAnimalSummary = () => {
        const summary = {};

        hewan.forEach(entry => {
            const jenis = String(entry.jenis || 'Lainnya').trim() || 'Lainnya';
            if (!summary[jenis]) {
                summary[jenis] = { count: 0, totalKotor: 0, totalDaging: 0 };
            }

            const beratKotor = parseFloat(entry.kotor ?? entry.berat_kotor ?? entry.beratKotor ?? 0) || 0;
            let beratDaging = parseFloat(entry.daging ?? entry.berat_daging ?? entry.beratDaging ?? 0) || 0;
            if (beratDaging <= 0) {
                const jenisLower = jenis.toLowerCase();
                if (jenisLower.includes('sapi')) {
                    beratDaging = beratKotor * 0.8;
                } else if (jenisLower.includes('kambing')) {
                    beratDaging = beratKotor * 0.66;
                }
            }

            summary[jenis].count += 1;
            summary[jenis].totalKotor += beratKotor;
            summary[jenis].totalDaging += beratDaging;
        });

        const summaryRows = Object.entries(summary)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([jenis, values]) => [
                jenis,
                formatNumber(values.count),
                formatNumber(values.totalKotor.toFixed(2)),
                formatNumber(values.totalDaging.toFixed(2))
            ]);

        const totalCount = Object.values(summary).reduce((sum, item) => sum + item.count, 0);
        const totalKotor = Object.values(summary).reduce((sum, item) => sum + item.totalKotor, 0);
        const totalDaging = Object.values(summary).reduce((sum, item) => sum + item.totalDaging, 0);

        return { rows: [...summaryRows, ['Total', formatNumber(totalCount), formatNumber(totalKotor.toFixed(2)), formatNumber(totalDaging.toFixed(2))]] };
    };

    const normalizeDistributionRecord = row => {
        const beratPerBungkus = Number(row?.beratPerBungkus ?? row?.berat_per_bungkus ?? row?.berat ?? 0) || 0;
        const jumlahBungkus = Number(row?.jumlahBungkus ?? row?.jumlah_bungkus ?? row?.jumlah ?? 0) || 0;
        const totalBerat = Number(row?.totalBerat ?? row?.total_berat ?? (beratPerBungkus * jumlahBungkus)) || 0;

        return {
            ...row,
            tahun: row?.tahun || row?.Tahun || '-',
            kategori: row?.kategori || row?.Kategori || '-',
            sumber: row?.sumber || row?.sumber_daging || row?.sumberDaging || '-',
            label: row?.label || row?.keterangan || row?.ket || '-',
            rt: row?.rt || row?.RT || row?.rt_distribusi || '-',
            beratPerBungkus,
            jumlahBungkus,
            totalBerat
        };
    };

    const buildPenerimaGroups = rows => {
        const groups = [];

        rows.forEach(row => {
const rtValue = normalizeRtValue(row?.rt ?? row?.RT ?? '');
        const kategoriValue = String(row?.kategori ?? row?.Kategori ?? '').trim();
        const groupLabel = rtValue && kategoriValue
            ? `${formatRtLabel(rtValue)} / ${kategoriValue}`
            : rtValue
                ? formatRtLabel(rtValue)
                    : kategoriValue || 'Lainnya';

            let group = groups.find(item => item.label === groupLabel);
            if (!group) {
                group = { label: groupLabel, rows: [] };
                groups.push(group);
            }
            group.rows.push(row);
        });

        return groups.sort((a, b) => {
            const aNum = parseInt(String(a.label || '').replace(/[^0-9]/g, ''), 10);
            const bNum = parseInt(String(b.label || '').replace(/[^0-9]/g, ''), 10);
            if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
            return a.label.localeCompare(b.label);
        });
    };

    const animalSummary = aggregateAnimalSummary();

    addPageHeader(title, subtitle);

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(27, 94, 32);
    doc.text('1. Summary Hewan Qurban', 14, 40);

    doc.autoTable({
        ...tableOptions(46),
        head: [['Jenis Hewan', 'Total Ekor', 'Berat Kotor (KG)', 'Berat Bersih (Daging)']],
        body: animalSummary.rows,
        headStyles: { fillColor: [42, 143, 93], textColor: [255, 255, 255] },
        styles: { fontSize: 9 }
    });

    const summaryEndY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 60;
    let y = summaryEndY;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(27, 94, 32);
    doc.text('2. Laporan Pendistribusian Qurban', 14, y);
    y += 6;

    if (distribusi.length === 0) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Tidak ada data distribusi untuk periode ini.', 14, y);
    } else {
        const normalizedDistribusi = distribusi.map(normalizeDistributionRecord);

        const detailRows = normalizedDistribusi.map((row, index) => [
            index + 1,
            row.tahun || '-',
            row.kategori || '-',
            row.sumber || '-',
            row.label || '-',
            row.rt ? formatRtLabel(row.rt) : '-',
            row.beratPerBungkus.toFixed(2),
            row.jumlahBungkus,
            row.totalBerat.toFixed(2)
        ]);

        const totalBungkus = normalizedDistribusi.reduce((sum, row) => sum + (Number(row.jumlahBungkus) || 0), 0);
        const totalBerat = normalizedDistribusi.reduce((sum, row) => sum + (Number(row.totalBerat) || 0), 0);
        detailRows.push(['TOTAL', '', '', '', '', '', '', totalBungkus, totalBerat.toFixed(2)]);

        doc.autoTable({
            ...tableOptions(y),
            head: [[
                'No', 'Tahun', 'Kategori', 'Sumber Daging', 'Keterangan', 'RT', 'Berat / Bungkus (KG)', 'Jumlah Bungkus', 'Total Berat (KG)'
            ]],
            body: detailRows,
            headStyles: { fillColor: [42, 143, 93], textColor: [255, 255, 255] },
            styles: { fontSize: 9 }
        });
    }
    addFooter();

    doc.addPage();
    addPageHeader(title, subtitle);
    y = 40;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(27, 94, 32);
    doc.text('3. Daftar Panitia Qurban', 14, y);
    y += 6;

    if (panitia.length === 0) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Tidak ada data panitia untuk periode ini.', 14, y);
    } else {
        doc.autoTable({
            ...tableOptions(y),
            head: [['No', 'Nama', 'Peran / Jabatan', 'Kontak']],
            body: panitia.map((entry, index) => [
                index + 1,
                entry.nama || entry.name || entry.nama_panitia || '-',
                entry.jabatan || entry.peran || entry.role || '-',
                entry.kontak || entry.telepon || entry.hp || entry.phone || '-'
            ]),
            headStyles: { fillColor: [42, 143, 93], textColor: [255, 255, 255] },
            styles: { fontSize: 9 }
        });
    }
    addFooter();

    doc.addPage();
    addPageHeader(title, subtitle);
    y = 40;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(27, 94, 32);
    doc.text('4. Daftar Hewan Qurban', 14, y);
    y += 6;

    if (hewan.length === 0) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Tidak ada data hewan untuk periode ini.', 14, y);
    } else {
        doc.autoTable({
            ...tableOptions(y),
            head: [['No', 'Jenis', 'Pemilik', 'Berat Kotor (KG)', 'Berat Daging (KG)']],
            body: hewan.map((entry, index) => {
                const beratKotor = parseFloat(entry.kotor ?? entry.berat_kotor ?? entry.beratKotor ?? 0) || 0;
                const beratDaging = parseFloat(entry.daging ?? entry.berat_daging ?? entry.beratDaging ?? 0) || 0;
                return [
                    index + 1,
                    entry.jenis || '-',
                    formatOwnerValue(entry.pemilik),
                    `${beratKotor.toFixed(2)}`,
                    `${beratDaging.toFixed(2)}`
                ];
            }),
            headStyles: { fillColor: [42, 143, 93], textColor: [255, 255, 255] },
            styles: { fontSize: 9 }
        });
    }
    addFooter();

    doc.addPage();
    addPageHeader(title, subtitle);
    y = 40;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(27, 94, 32);
    doc.text('5. Laporan Keuangan', 14, y);
    y += 6;

    const pemasukanBody = pemasukanRows.map(entry => [
        entry.tanggal || entry.date || entry.created_at || '-',
        entry.keterangan || entry.deskripsi || entry.ket || '-',
        formatCurrency(entry.amount)
    ]);
    pemasukanBody.push(['TOTAL', '', formatCurrency(totalPemasukan)]);

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(27, 94, 32);
    doc.text('Pemasukan', 14, y);
    doc.autoTable({
        ...tableOptions(y + 4),
        head: [['Tanggal', 'Deskripsi', 'Nominal']],
        body: pemasukanBody,
        headStyles: { fillColor: [42, 143, 93], textColor: [255, 255, 255] },
        styles: { fontSize: 9 }
    });

    const yAfterMasuk = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : y + 20;
    const pengeluaranBody = pengeluaranRows.map(entry => [
        entry.tanggal || entry.date || entry.created_at || '-',
        entry.keterangan || entry.deskripsi || entry.ket || '-',
        formatCurrency(entry.amount)
    ]);
    pengeluaranBody.push(['TOTAL', '', formatCurrency(totalPengeluaran)]);

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(27, 94, 32);
    doc.text('Pengeluaran', 14, yAfterMasuk);
    doc.autoTable({
        ...tableOptions(yAfterMasuk + 4),
        head: [['Tanggal', 'Deskripsi', 'Nominal']],
        body: pengeluaranBody,
        headStyles: { fillColor: [231, 76, 60], textColor: [255, 255, 255] },
        styles: { fontSize: 9 }
    });

    const yAfterKeluar = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : yAfterMasuk + 20;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text(`Total Pemasukan: ${formatCurrency(totalPemasukan)}`, 14, yAfterKeluar);
    doc.text(`Total Pengeluaran: ${formatCurrency(totalPengeluaran)}`, 14, yAfterKeluar + 6);
    doc.text(`Saldo: ${formatCurrency(totalPemasukan - totalPengeluaran)}`, 14, yAfterKeluar + 12);
    addFooter();

    doc.addPage();
    addPageHeader(title, subtitle);
    let penerimaY = 40;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(27, 94, 32);
    doc.text('6. Laporan Data Penerima Qurban', 14, penerimaY);
    penerimaY += 6;

    if (penerima.length === 0) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Tidak ada data penerima untuk periode ini.', 14, penerimaY);
        addFooter();
    } else {
        const penerimaGroups = buildPenerimaGroups(penerima);
        penerimaGroups.forEach((group, index) => {
            if (index > 0) {
                doc.addPage();
                addPageHeader(title, subtitle);
                penerimaY = 40;
            }

            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(27, 94, 32);
            doc.text(`Kelompok: ${group.label}`, 14, penerimaY);
            penerimaY += 6;

            doc.autoTable({
                ...tableOptions(penerimaY),
                head: [['No', 'Nama', 'Kategori', 'RT', 'Status']],
                body: group.rows.map((entry, rowIndex) => [
                    rowIndex + 1,
                    entry.nama || entry.name || entry.nama_penerima || '-',
                    entry.kategori || '-',
                    entry.rt ? formatRtLabel(entry.rt) : '-',
                    entry.status || '-'
                ]),
                headStyles: { fillColor: [42, 143, 93], textColor: [255, 255, 255] },
                styles: { fontSize: 9 }
            });
            addFooter();
        });
    }

    doc.save(`Laporan_Lengkap_Qurban_${safeName}.pdf`);
};

window.cetakLaporanPDF_Lengkap = cetakLaporanTahunanDashboard;
window.cetakLaporanPDF_LengkapDashboard = cetakLaporanTahunanDashboard;
globalThis.cetakLaporanPDF_Lengkap = cetakLaporanTahunanDashboard;
globalThis.cetakLaporanPDF_LengkapDashboard = cetakLaporanTahunanDashboard;

if(typeof module !== 'undefined') module.exports = {
    loadDashboardMetrics,
    renderDashboardSummary,
    updateDashboard,
    renderDashboard,
    renderDashboardHewanTable,
    hitungPenerimaPerRT,
    getSelectedDashboardYear,
    showLoading,
    hideLoading,
    showToast,
    cetakLaporanPDF_Lengkap
};
