/**
 * DISTRIBUSI MODULE - Qurban Management System
 * Functions for distribution/calculation management (Pendistribusian Daging)
 * 
 * Dependencies: formatters, helpers, utilities, Chart.js, jsPDF
 * API Endpoint: api.php?action=saveDistribusi|deleteDistribusi|getDistribusi
 */

// ============================================
// DISTRIBUTION LOADING & FILTERING
// ============================================

/**
 * Load distribution data from server
 * Fetches all distribution records and populates year options
 */
async function loadDistribusiData() {
    try {
        const response = await fetch(`${apiUrl}?action=getDistribusi`);
        const result = await parseJsonResponse(response);
        console.debug('loadDistribusiData result:', result && result.data ? result.data.length : 'no-data', result);
        if (result && result.success && Array.isArray(result.data)) {
            distribusiRows = result.data
                .map(row => normalizeDistribusiRow(row))
                .sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
            currentPageDistribusi = 1;
            populateDistribusiYearOptions();
            const select = document.getElementById('filterTahunDistribusi');
            const selectedYear = select ? select.value : 'all';
            if (selectedYear && selectedYear !== 'all') {
                filterDistribusiByYear(selectedYear);
            } else if (selectedYear === 'all') {
                filterDistribusiByYear('all');
            }
            if (typeof loadPerhitungan === 'function') {
                await loadPerhitungan();
            }
            try { renderDashboard(); } catch (e) { console.warn('renderDashboard error after loadDistribusiData:', e); }
        }
    } catch (error) {
        console.error('Gagal memuat data distribusi:', error);
    }
}

/**
 * Populate distribution year filter options
 */
function populateDistribusiYearOptions() {
    const select = document.getElementById('filterTahunDistribusi');
    if (!select) return;
    const years = [...new Set(distribusiRows.map(r => String(r.tahun || '')).filter(y => y && y !== ''))].sort().reverse();
    select.innerHTML = '<option value="all">Semua Tahun</option>';
    if (years.length === 0) {
        select.innerHTML += '<option value="" disabled>Tidak ada tahun tersedia</option>';
        select.value = 'all';
    } else {
        years.forEach(y => {
            select.innerHTML += `<option value="${y}">${y}</option>`;
        });
        select.value = years[0];
    }
    select.removeEventListener('change', onDistribusiYearChange);
    select.addEventListener('change', onDistribusiYearChange);
}

/**
 * Handle distribution year filter change
 * @param {Event} e - Change event
 */
function onDistribusiYearChange(e) {
    currentPageDistribusi = 1;
    filterDistribusiByYear(e.target.value);
}

/**
 * Filter distribution data by year
 * @param {string} year - Year filter (or 'all' for all years)
 */
function filterDistribusiByYear(year) {
    if (!year || year === 'all') {
        renderDistribusiResults(distribusiRows);
    } else {
        const filtered = distribusiRows.filter(r => String(r.tahun || '') === String(year));
        renderDistribusiResults(filtered);
    }
}

/**
 * Fetch perhitungan data for distribution report
 * @returns {Promise} Perhitungan data object
 */
async function fetchPerhitunganData() {
    try {
        const response = await fetch(`${apiUrl}?action=getPerhitungan`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (result.success && result.data) return result.data;
    } catch (error) {
        console.warn('Gagal memload data perhitungan untuk cetak distribusi:', error);
    }
    return null;
}

// ============================================
// DISTRIBUTION FORM & SUBMISSION
// ============================================

/**
 * Update kategori penerima form fields
 * Shows/hides relevant fields based on selected category
 */
function updateKategoriPenerimaFields() {
    const category = document.getElementById('kategoriPenerima').value;
    const groupRT = document.getElementById('groupRTDistribusi');
    const groupShahibul = document.getElementById('groupShahibul');
    const groupLainnyaKeterangan = document.getElementById('groupLainnyaKeterangan');
    const groupJumlah = document.getElementById('groupJumlah');
    const groupBeratPerBungkus = document.getElementById('groupBeratPerBungkus');
    const rtDistribusi = document.getElementById('rtDistribusi');
    const keteranganLainnya = document.getElementById('keteranganLainnya');
    const jumlahBungkus = document.getElementById('jumlahBungkus');
    const beratPerBungkus = document.getElementById('beratPerBungkus');
    const beratPerPemilikSahibul = document.getElementById('beratPerPemilikSahibul');
    const hewanShahibul = document.getElementById('hewanShahibul');
    const customHewanSearch = document.getElementById('custom-hewan-search');
    const customHewanOptions = document.getElementById('custom-hewan-options');

    const isShahibul = category === 'Shahibul Qurban' || category === 'Sahibul Qurban';
    const showRT = category === 'Per RT';
    const showLainnya = category === 'Lainnya';

    if (groupRT) {
        groupRT.classList.toggle('d-none', !showRT);
        groupRT.style.display = showRT ? 'block' : 'none';
    }
    if (groupShahibul) {
        groupShahibul.classList.toggle('d-none', !isShahibul);
        groupShahibul.style.display = isShahibul ? 'block' : 'none';
    }
    if (groupLainnyaKeterangan) {
        groupLainnyaKeterangan.classList.toggle('d-none', !showLainnya);
        groupLainnyaKeterangan.style.display = showLainnya ? 'block' : 'none';
    }
    if (groupJumlah) {
        groupJumlah.classList.toggle('d-none', !showLainnya);
        groupJumlah.style.display = showLainnya ? 'block' : 'none';
    }

    // Handle beratPerBungkus untuk form umum
    if (beratPerBungkus) {
        if (isShahibul) {
            beratPerBungkus.disabled = true;
            beratPerBungkus.value = '';
            beratPerBungkus.placeholder = 'Otomatis dihitung dari berat per pemilik';
            beratPerBungkus.required = false;
            beratPerBungkus.removeAttribute('required');
        } else {
            beratPerBungkus.disabled = false;
            beratPerBungkus.placeholder = 'Masukkan berat per bungkus';
            beratPerBungkus.required = true;
            beratPerBungkus.setAttribute('required', 'required');
        }
    }

    // Handle hewanShahibul - set required only when visible
    if (hewanShahibul) {
        if (isShahibul) {
            hewanShahibul.required = true;
            hewanShahibul.disabled = false;
            hewanShahibul.setAttribute('required', 'required');
        } else {
            hewanShahibul.required = false;
            hewanShahibul.disabled = true;
            hewanShahibul.value = '';
            hewanShahibul.removeAttribute('required');
        }
    }

    if (customHewanSearch) {
        customHewanSearch.disabled = !isShahibul;
        if (!isShahibul) {
            customHewanSearch.value = '';
        }
    }

    if (customHewanOptions && !isShahibul) {
        customHewanOptions.classList.add('hidden');
    }

    // Handle beratPerPemilikSahibul (baru untuk Sahibul)
    if (beratPerPemilikSahibul) {
        if (isShahibul) {
            beratPerPemilikSahibul.required = true;
            beratPerPemilikSahibul.disabled = false;
            beratPerPemilikSahibul.setAttribute('required', 'required');
        } else {
            beratPerPemilikSahibul.required = false;
            beratPerPemilikSahibul.disabled = true;
            beratPerPemilikSahibul.value = '';
            beratPerPemilikSahibul.removeAttribute('required');
        }
    }

    if (rtDistribusi) {
        if (showRT) {
            const currentRtValue = rtDistribusi.value || '';
            rtDistribusi.required = true;
            rtDistribusi.disabled = false;
            rtDistribusi.setAttribute('required', 'required');
            if (!currentRtValue && rtDistribusi.options.length > 0) {
                rtDistribusi.value = rtDistribusi.options[0].value;
            }
        } else {
            rtDistribusi.value = '';
            rtDistribusi.required = false;
            rtDistribusi.disabled = true;
            rtDistribusi.removeAttribute('required');
        }
    }

    if (keteranganLainnya) {
        if (showLainnya) {
            keteranganLainnya.required = true;
            keteranganLainnya.disabled = false;
            keteranganLainnya.setAttribute('required', 'required');
        } else {
            keteranganLainnya.required = false;
            keteranganLainnya.disabled = true;
            keteranganLainnya.value = '';
            keteranganLainnya.removeAttribute('required');
        }
    }

    if (jumlahBungkus) {
        if (showLainnya) {
            jumlahBungkus.required = true;
            jumlahBungkus.disabled = false;
            jumlahBungkus.setAttribute('required', 'required');
        } else {
            jumlahBungkus.required = false;
            jumlahBungkus.disabled = true;
            jumlahBungkus.value = '';
            jumlahBungkus.removeAttribute('required');
        }
    }

    if (isShahibul) {
        populateShahibulHewanOptions();
    }

    renderShahibulOwnerList();
    updateOwnerFieldControls();
}

/**
 * Populate distribution RT options from database
 */
function populateDistribusiRTOptions() {
    const select = document.getElementById('rtDistribusi');
    if (!select) return;
    
    fetch(`${apiUrl}?action=getRTList`)
        .then(response => response.json())
        .then(result => {
            if (result.success && Array.isArray(result.data)) {
                select.innerHTML = '<option value="">Pilih RT</option>';
                result.data.forEach(rt => {
                    if (rt) {
                        const opt = document.createElement('option');
                        opt.value = rt;
                        opt.textContent = formatRtLabel(rt);
                        select.appendChild(opt);
                    }
                });
            } else {
                select.innerHTML = '<option value="">Pilih RT</option>';
            }
        })
        .catch(error => {
            console.error('Gagal load RT list:', error);
            select.innerHTML = '<option value="">Pilih RT</option>';
        });
}

/**
 * Populate hewan options for Shahibul distribution
 */
function populateShahibulHewanOptions() {
    const tahun = document.getElementById('tahunDistribusi')?.value || '';
    const sumber = document.getElementById('sumberDaging')?.value || '';
    const select = document.getElementById('hewanShahibul');
    
    if (!select || !tahun || !sumber) {
        if (select) select.innerHTML = '<option value="">-- Pilih Hewan --</option>';
        return;
    }
    
    const sourceFilter = sumber === 'Campuran' ? '' : sumber;
    
    fetch(`${apiUrl}?action=getHewan&tahun=${encodeURIComponent(tahun)}`)
        .then(response => response.json())
        .then(result => {
            select._allOptions = [];
            select.innerHTML = '<option value="">-- Pilih Hewan --</option>';
            
                if (result.success && Array.isArray(result.data)) {
                // Build options for hewan. If sumber is Kambing and Shahibul mode,
                // create an aggregated option representing all kambing to allow
                // quick distribution without selecting one-by-one.
                const filteredHewan = result.data.filter(h => sourceFilter === '' || h.jenis === sourceFilter);
                if (sourceFilter === 'Kambing') {
                    const totalBerat = filteredHewan.reduce((s, h) => s + (parseFloat(h.daging || h.kotor || 0) || 0), 0);
                    const count = filteredHewan.length;
                    if (count > 0) {
                        select._allOptions.push({
                            id: 'ALL_KAMBING',
                            berat: totalBerat,
                            pemilik: '',
                            jenis: 'Kambing',
                            count: count,
                            label: `Semua Kambing - ${count} ekor (Total: ${formatWeight(totalBerat)})`
                        });
                    }
                }

                // Also keep individual items available (optional)
                filteredHewan.forEach(hewan => {
                    select._allOptions.push({
                        id: hewan.id,
                        berat: hewan.daging || hewan.kotor || 0,
                        pemilik: hewan.pemilik || '',
                        jenis: hewan.jenis || '',
                        label: `${hewan.jenis} - Pemilik: ${hewan.pemilik} (Berat: ${formatWeight(hewan.daging || hewan.kotor || 0)})`
                    });
                });
            }

            renderShahibulHewanOptions();
            initializeShahibulHewanCombobox();
        })
        .catch(error => {
            console.error('Gagal load hewan:', error);
            select._allOptions = [];
            select.innerHTML = '<option value="">-- Pilih Hewan --</option>';
        });
}

/**
 * Render the hewan select options from cached data and optional search filter
 */
function renderShahibulHewanOptions(filterText = '') {
    const select = document.getElementById('hewanShahibul');
    const customSearch = document.getElementById('custom-hewan-search');
    const customOptions = document.getElementById('custom-hewan-options');
    if (!select || !customOptions) return;

    const previousValue = select.value;
    const options = Array.isArray(select._allOptions) ? select._allOptions : [];
    const query = String(filterText || '').trim().toLowerCase();
    const filtered = query
        ? options.filter(item =>
            item.label.toLowerCase().includes(query) ||
            item.jenis.toLowerCase().includes(query) ||
            item.pemilik.toLowerCase().includes(query) ||
            String(item.berat).toLowerCase().includes(query)
        )
        : options;

    select.innerHTML = '<option value="">-- Pilih Hewan --</option>';
    options.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.dataset.berat = item.berat;
        if (item.pemilik) opt.dataset.pemilik = item.pemilik;
        if (item.jenis) opt.dataset.jenis = item.jenis;
        if (item.count) opt.dataset.count = item.count;
        opt.textContent = item.label;
        select.appendChild(opt);
    });

    if (previousValue && options.some(item => String(item.id) === String(previousValue))) {
        select.value = previousValue;
    }

    customOptions.innerHTML = '';
    if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'rounded-lg px-3 py-2 text-sm text-slate-500';
        empty.textContent = 'Tidak menemukan hewan dengan pencarian ini.';
        customOptions.appendChild(empty);
        return;
    }

    filtered.forEach(item => {
        const optionItem = document.createElement('div');
        optionItem.dataset.value = item.id;
        optionItem.className = 'custom-option cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition';
        // special styling and tooltip for aggregated kambing option
        if (String(item.id) === 'ALL_KAMBING') {
            optionItem.classList.add('highlight-all-kambing');
            optionItem.innerHTML = `${item.label} <span class="agg-badge">Agregat</span>`;
            optionItem.title = 'Pilih ini untuk mendistribusikan semua kambing sekaligus (jumlah kambing × berat per pemilik)';
        } else {
            optionItem.textContent = item.label;
        }

        optionItem.addEventListener('click', () => {
            if (customSearch) {
                customSearch.value = item.label;
            }
            select.value = item.id;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            customOptions.classList.add('hidden');
        });
        customOptions.appendChild(optionItem);
    });
}

function filterShahibulHewanOptions() {
    const query = document.getElementById('custom-hewan-search')?.value || '';
    renderShahibulHewanOptions(query);
    updateBeratShahibulField();
    renderShahibulOwnerList();
}

function initializeShahibulHewanCombobox() {
    if (initializeShahibulHewanCombobox._initialized) return;
    const customSearch = document.getElementById('custom-hewan-search');
    const customOptions = document.getElementById('custom-hewan-options');
    const dropdownWrapper = document.getElementById('custom-hewan-dropdown');
    if (!customSearch || !customOptions || !dropdownWrapper) return;

    customSearch.addEventListener('input', () => {
        renderShahibulHewanOptions(customSearch.value);
        customOptions.classList.remove('hidden');
    });

    customSearch.addEventListener('focus', () => {
        renderShahibulHewanOptions(customSearch.value);
        customOptions.classList.remove('hidden');
    });

    customSearch.addEventListener('click', event => {
        event.stopPropagation();
        renderShahibulHewanOptions(customSearch.value);
        customOptions.classList.remove('hidden');
    });

    window.addEventListener('click', event => {
        if (!dropdownWrapper.contains(event.target)) {
            customOptions.classList.add('hidden');
        }
    });

    // Reflect selection changes to show/hide aggregated badge when user selects from real select
    const selectEl = document.getElementById('hewanShahibul');
    if (selectEl) {
        selectEl.addEventListener('change', () => {
            const aggBadge = document.getElementById('aggKambingBadge');
            if (!aggBadge) return;
            if (selectEl.value === 'ALL_KAMBING') {
                aggBadge.classList.remove('d-none');
            } else {
                aggBadge.classList.add('d-none');
            }
        });
    }

    initializeShahibulHewanCombobox._initialized = true;
}

/**
 * Update display of total berat for selected hewan
 */
function updateBeratShahibulField() {
    const select = document.getElementById('hewanShahibul');
    const display = document.getElementById('beratTotalHewan');
    
    if (!select || !display) return;
    
    const selectedOption = select.options[select.selectedIndex];
    if (selectedOption && selectedOption.value) {
        const berat = parseFloat(selectedOption.dataset.berat) || 0;
        display.textContent = formatWeight(berat);
    } else {
        display.textContent = formatWeight(0);
    }
}

function hasExistingDistribusiForRt(tahun, rt) {
    const targetYear = String(tahun || '').trim();
    const targetRt = normalizeRtValue(rt);
    if (!targetYear || !targetRt) return false;

    return distribusiRows.some(row => {
        const rowYear = String(row?.tahun || '').trim();
        const rowRt = normalizeRtValue(row?.rt || '');
        const rowCategory = String(row?.kategori || '').trim().toLowerCase();
        return rowYear === targetYear && rowCategory === 'per rt' && rowRt === targetRt;
    });
}

function hasExistingDistribusiForSahibul(tahun, hewanId) {
    const targetYear = String(tahun || '').trim();
    const targetHewanId = String(hewanId || '').trim();
    if (!targetYear || !targetHewanId) return false;

    return distribusiRows.some(row => {
        const rowYear = String(row?.tahun || '').trim();
        const rowCategory = String(row?.kategori || '').trim().toLowerCase();
        const rowHewanId = String(row?.hewanId || row?.hewan_id || '').trim();
        return rowYear === targetYear && (rowCategory === 'sahibul qurban' || rowCategory === 'shahibul qurban') && rowHewanId === targetHewanId;
    });
}

/**
 * Handle distribusi form submission
 * @param {Event} event - Form submission event
 */
async function handleDistribusiSubmit(event) {
    event.preventDefault();
    const category = document.getElementById('kategoriPenerima').value;
    const source = document.getElementById('sumberDaging').value;
    const tahun = document.getElementById('tahunDistribusi') ? document.getElementById('tahunDistribusi').value.trim() : '';
    const beratPerBungkus = parseFloat(document.getElementById('beratPerBungkus').value) || 0;
    const isShahibul = category === 'Shahibul Qurban' || category === 'Sahibul Qurban';
    const rows = [];

    if (!tahun) {
        showToast('Masukkan Tahun Distribusi terlebih dahulu.', 'warning');
        return;
    }

    if (!isShahibul && beratPerBungkus <= 0) {
        showToast('Masukkan berat per bungkus yang valid.', 'warning');
        return;
    }

    if (category === 'Per RT') {
        const rt = document.getElementById('rtDistribusi').value;
        if (!rt) {
            showToast('Silakan pilih RT penerima.', 'warning');
            return;
        }
        
        if (hasExistingDistribusiForRt(tahun, rt)) {
            showToast(`Distribusi untuk ${formatRtLabel(rt)} pada tahun ${tahun} sudah pernah dibuat. Tidak dapat diinput ulang.`, 'error', 5000);
            return;
        }

        try {
            const response = await fetch(`${apiUrl}?action=getWargaCountPerRT&tahun=${encodeURIComponent(tahun)}&rt=${encodeURIComponent(rt)}`);
            const result = await response.json();
            const jumlahWarga = result.success ? parseInt(result.data, 10) || 0 : 0;
            
            if (jumlahWarga === 0) {
                showToast('Tidak ditemukan penerima Warga untuk RT ini.', 'warning');
                return;
            }
            
            rows.push({
                tahun: String(tahun || ''),
                kategori: category,
                sumber: source,
                label: formatRtLabel(rt),
                rt,
                beratPerBungkus,
                jumlahBungkus: jumlahWarga,
                totalBerat: beratPerBungkus * jumlahWarga
            });
        } catch (error) {
            console.error('Error fetching warga count:', error);
            showToast('Gagal mengambil data jumlah warga. Silakan coba lagi.', 'error');
            return;
        }
    } else if (isShahibul) {
        // Ambil hewan yang dipilih dari dropdown
        const hewanSelect = document.getElementById('hewanShahibul');
        const beratPerPemilikInput = parseFloat(document.getElementById('beratPerPemilikSahibul').value) || 0;
        
        if (!hewanSelect || !hewanSelect.value) {
            showToast('Silakan pilih Hewan untuk distribusi Sahibul Qurban.', 'warning');
            return;
        }
        
        if (beratPerPemilikInput <= 0) {
            showToast('Masukkan berat per pemilik yang valid (harus > 0).', 'warning');
            return;
        }
        
        const selectedRaw = hewanSelect.value;
        const selectedOption = hewanSelect.options[hewanSelect.selectedIndex];

        // If user chose the aggregated ALL_KAMBING option, create a single
        // distribusi record for all kambing (jumlah dikalikan dengan input berat per pemilik).
        if (selectedRaw === 'ALL_KAMBING') {
            const jumlahKambing = parseInt(selectedOption?.dataset?.count || 0, 10) || 0;
            if (jumlahKambing <= 0) {
                showToast('Tidak ditemukan data kambing untuk tahun ini.', 'warning');
                return;
            }

            // Prevent duplicate aggregated distribusi for the same year
            const existsAgg = distribusiRows.some(r => String(r.tahun || '').trim() === String(tahun).trim() && (String(r.kategori || '').trim().toLowerCase() === 'sahibul qurban' || String(r.kategori || '').trim().toLowerCase() === 'shahibul qurban') && String(r.label || '').toLowerCase().includes('semua kambing'));
            if (existsAgg) {
                showToast(`Distribusi untuk Semua Kambing pada tahun ${tahun} sudah pernah dibuat.`, 'error');
                return;
            }

            const totalBerat = beratPerPemilikInput * jumlahKambing;
            rows.push({
                tahun: String(tahun || ''),
                kategori: 'Sahibul Qurban',
                sumber: source,
                label: 'Semua Kambing',
                rt: '',
                beratPerBungkus: beratPerPemilikInput,
                jumlahBungkus: jumlahKambing,
                totalBerat: totalBerat,
                hewanId: null,
                jumlahSohibul: jumlahKambing,
                beratPerSohibul: beratPerPemilikInput
            });
            // show UI badge to indicate aggregated kambing selection
            const aggBadge = document.getElementById('aggKambingBadge');
            if (aggBadge) {
                aggBadge.classList.remove('d-none');
            }
        } else {
            // Ambil data pemilik dari option dataset (sudah ter-load saat populateShahibulHewanOptions)
            const pemilikStr = selectedOption?.dataset?.pemilik || '';
            const selectedJenis = String(selectedOption?.dataset?.jenis || '').trim();

            const owners = parseOwnerNames(pemilikStr);
            if (owners.length === 0) {
                showToast('Hewan yang dipilih tidak memiliki pemilik yang valid.', 'warning');
                return;
            }

            const selectedHewanId = parseInt(selectedRaw, 10);
            if (hasExistingDistribusiForSahibul(tahun, selectedHewanId)) {
                showToast(`Distribusi untuk hewan ini pada tahun ${tahun} sudah pernah dibuat. Tidak dapat diinput ulang.`, 'error', 5000);
                return;
            }

            // Untuk sapi, satu ekor dibagi ke 7 bagian, sehingga total distribusi memakai faktor 7.
            const jumlahSohibul = getSahibulShareCount(owners.length, source, selectedJenis);
            const totalBeratPerOwner = owners.length > 0 ? (beratPerPemilikInput * jumlahSohibul) / owners.length : 0;

            owners.forEach(owner => {
                rows.push({
                    tahun: String(tahun || ''),
                    kategori: 'Sahibul Qurban',
                    sumber: source,
                    label: owner,
                    rt: '',
                    beratPerBungkus: totalBeratPerOwner,
                    jumlahBungkus: 1,
                    totalBerat: totalBeratPerOwner,
                    hewanId: selectedHewanId,
                    jumlahSohibul: jumlahSohibul,
                    beratPerSohibul: beratPerPemilikInput
                });
            });
            // hide aggregated badge for individual selections
            const aggBadge = document.getElementById('aggKambingBadge');
            if (aggBadge) {
                aggBadge.classList.add('d-none');
            }
        }
    } else if (String(category || '').trim().toLowerCase() === 'panitia') {
        const jumlahPanitia = Array.isArray(dataPenerima)
            ? dataPenerima.filter(p => String(p.kategori || '').trim().toLowerCase() === 'panitia' && String(p.tahun || '').trim() === String(tahun).trim()).length
            : 0;
        if (jumlahPanitia === 0) {
            showToast('Tidak ditemukan penerima dengan kategori Panitia. Pastikan data Panitia sudah terdaftar.', 'warning');
            return;
        }
        rows.push({
            tahun: String(tahun || ''),
            kategori: 'Panitia',
            sumber: source,
            label: 'Panitia',
            rt: '',
            beratPerBungkus,
            jumlahBungkus: jumlahPanitia,
            totalBerat: beratPerBungkus * jumlahPanitia
        });
    } else if (category === 'Lainnya') {
        const keteranganInput = document.getElementById('keteranganLainnya');
        const jumlahInput = document.getElementById('jumlahBungkus');
        if (keteranganInput) keteranganInput.disabled = false;
        if (jumlahInput) jumlahInput.disabled = false;
        const keterangan = keteranganInput ? keteranganInput.value.trim() : '';
        const jumlahBungkus = jumlahInput ? parseInt(jumlahInput.value, 10) || 0 : 0;
        if (!keterangan) {
            showToast('Masukkan keterangan untuk kategori Lainnya.', 'warning');
            return;
        }
        if (jumlahBungkus <= 0) {
            showToast('Masukkan jumlah bungkus yang valid.', 'warning');
            return;
        }
        rows.push({
            tahun: String(tahun || ''),
            kategori: category,
            sumber: source,
            label: keterangan,
            rt: '',
            beratPerBungkus,
            jumlahBungkus,
            totalBerat: beratPerBungkus * jumlahBungkus
        });
    } else {
        showToast('Pilih kategori penerima yang valid.', 'warning');
        return;
    }

    const success = await saveDistribusiRows(rows);
    if (success) {
        await loadDistribusiData();
        if (typeof loadPerhitungan === 'function') {
            await loadPerhitungan();
        }
    } else {
        showToast('Gagal menyimpan data distribusi. Silakan coba lagi.', 'error');
    }
}

// ============================================
// DISTRIBUTION DATA MANAGEMENT
// ============================================

/**
 * Save distribution rows to database
 * @param {array} rows - Distribution rows to save
 * @returns {Promise} Success status
 */
async function saveDistribusiRows(rows) {
    showLoading();
    try {
        if (!Array.isArray(rows) || rows.length === 0) {
            console.warn('Tidak ada baris distribusi untuk disimpan.');
            return false;
        }

        const payloadRows = rows.map(r => ({
            ...r,
            tahun: String(r.tahun || ''),
            kategori: String(r.kategori || ''),
            sumber: String(r.sumber || ''),
            label: String(r.label || ''),
            rt: String(r.rt || ''),
            beratPerBungkus: parseFloat(r.beratPerBungkus || r.berat_per_bungkus || 0) || 0,
            berat_per_bungkus: parseFloat(r.beratPerBungkus || r.berat_per_bungkus || 0) || 0,
            jumlahBungkus: parseInt(r.jumlahBungkus || r.jumlah_bungkus || 0, 10) || 0,
            jumlah_bungkus: parseInt(r.jumlahBungkus || r.jumlah_bungkus || 0, 10) || 0,
            totalBerat: parseFloat(r.totalBerat || r.total_berat || 0) || 0,
            total_berat: parseFloat(r.totalBerat || r.total_berat || 0) || 0
        }));

        const response = await fetch(`${apiUrl}?action=saveDistribusi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: payloadRows })
        });

        if (!response.ok) {
            const text = await response.text();
            const message = `HTTP ${response.status}: ${text}`;
            showToast('Gagal menyimpan distribusi: ' + message, 'error');
            throw new Error(message);
        }

        const result = await parseJsonResponse(response);
        if (!result) {
            showToast('Gagal menyimpan distribusi: respons API kosong atau tidak valid.', 'error');
            return false;
        }
        if (result && result.success) {
            const ids = Array.isArray(result.ids) ? result.ids : [];
            rows.forEach((row, index) => {
                row.id = ids[index] || row.id || null;
                row.tahun = String(row.tahun || '');
                row.beratPerBungkus = parseFloat(row.beratPerBungkus || row.berat_per_bungkus || 0) || 0;
                row.jumlahBungkus = parseInt(row.jumlahBungkus || row.jumlah_bungkus || 0, 10) || 0;
                row.totalBerat = parseFloat(row.totalBerat || row.total_berat || 0) || 0;
            });
            showToast('Data distribusi berhasil disimpan!', 'success');
            if (window.logSystemActivity) {
                window.logSystemActivity('Data distribusi ditambahkan.');
            }
            try { renderDashboard(); } catch (e) { console.warn('renderDashboard error after saveDistribusiRows:', e); }
            return true;
        }

        console.warn('saveDistribusiRows gagal, respons API tidak sukses:', result);
        const message = result?.message || 'respons API tidak sukses.';
        showToast('Gagal menyimpan distribusi: ' + message, 'error');
    } catch (error) {
        console.error('Gagal menyimpan distribusi:', error);
        showToast('Gagal menyimpan distribusi: ' + (error.message || 'Terjadi kesalahan pada koneksi.'), 'error');
    } finally {
        hideLoading();
    }
    return false;
}

/**
 * Normalize distribution row data
 * @param {object} row - Distribution row to normalize
 * @returns {object} Normalized row
 */
function normalizeDistribusiRow(row) {
    return {
        ...row,
        tahun: String(row.tahun ?? ''),
        kategori: row.kategori || '',
        sumber: row.sumber || '',
        label: row.label || '',
        rt: row.rt || '',
        beratPerBungkus: parseFloat(row.beratPerBungkus ?? row.berat_per_bungkus ?? 0) || 0,
        jumlahBungkus: parseInt(row.jumlahBungkus ?? row.jumlah_bungkus ?? 0, 10) || 0,
        totalBerat: parseFloat(row.totalBerat ?? row.total_berat ?? 0) || 0,
        jumlahSohibul: parseInt(row.jumlahSohibul ?? row.jumlah_sohibul ?? 1, 10) || 1,
        beratPerSohibul: parseFloat(row.beratPerSohibul ?? row.berat_per_sohibul ?? 0) || 0,
        hewanId: row.hewanId ?? row.hewan_id ?? null
    };
}

/**
 * Delete distribution row
 * @param {number} id - Distribution ID
 */
async function deleteDistribusiRow(id) {
    const index = distribusiRows.findIndex(r => String(r.id) === String(id));
    const row = index >= 0 ? distribusiRows[index] : null;
    if (row && row.id) {
        try {
            const response = await fetch(`${apiUrl}?action=deleteDistribusi&id=${encodeURIComponent(row.id)}`);
            const result = await parseJsonResponse(response);
            if (!response.ok || !result || !result.success) {
                const errText = result?.message || `HTTP ${response.status}`;
                console.error('Gagal menghapus distribusi:', errText);
                showToast('Terjadi kesalahan saat menghapus data distribusi.', 'error');
                return;
            }
        } catch (error) {
            console.error('Gagal menghapus distribusi:', error);
            showToast('Terjadi kesalahan saat menghapus data distribusi.', 'error');
            return;
        }
    }
    if (index >= 0) {
        distribusiRows.splice(index, 1);
    }
    if (window.logSystemActivity) {
        window.logSystemActivity('Data distribusi dihapus.');
    }
    currentPageDistribusi = 1;
    renderDistribusiResults(distribusiRows);
    try { renderDashboard(); } catch (e) { console.warn('renderDashboard error after delete:', e); }
}

// ============================================
// TABLE DISPLAY & PAGINATION
// ============================================

/**
 * Render distribution results table
 * @param {array} rows - Distribution rows to display
 */
function renderDistribusiResults(rows) {
    const body = document.getElementById('tabelDistribusiBody');
    const pagination = document.getElementById('paginationDistribusi');
    const totalBungkusEl = document.getElementById('totalBungkusDistribusi');
    const totalBeratEl = document.getElementById('totalBeratDistribusi');
    if (!body || !pagination || !totalBungkusEl || !totalBeratEl) return;
    body.innerHTML = '';

    const selectedYear = document.getElementById('filterTahunDistribusi') ? document.getElementById('filterTahunDistribusi').value : 'all';
    const allRows = Array.isArray(rows) ? rows : [];
    const filteredRows = (selectedYear && selectedYear !== 'all') ? allRows.filter(r => String(r.tahun || '') === String(selectedYear)) : allRows;
    // Sort by id descending (newest first)
    filteredRows.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
    currentDistribusiFilteredRows = filteredRows;

    let totalBungkus = 0;
    let totalBerat = 0;

    const totalItems = filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPageDistribusi));
    if (currentPageDistribusi > totalPages) currentPageDistribusi = totalPages;
    if (currentPageDistribusi < 1) currentPageDistribusi = 1;
    const startIndex = (currentPageDistribusi - 1) * itemsPerPageDistribusi;
    const pageRows = filteredRows.slice(startIndex, startIndex + itemsPerPageDistribusi);

    pageRows.forEach((row, index) => {
        const beratPerBungkus = parseFloat(row.beratPerBungkus || row.berat_per_bungkus || 0) || 0;
        const rowTotalBerat = parseFloat(row.totalBerat || row.total_berat || 0) || 0;
        const jumlahSohibul = parseInt(row.jumlahSohibul || row.jumlah_sohibul || 1);
        totalBungkus += row.jumlahBungkus || row.jumlah_bungkus || 0;
        totalBerat += rowTotalBerat;

        const safeId = String(row.id ?? '').replace(/'/g, "\\'");
        const categoryValue = String(row.kategori ?? '').trim() || 'Lainnya';
        const normalizedCategory = categoryValue.toLowerCase();
        let dynamicColorClass = 'bg-amber-50 text-amber-700 border-amber-100/60';

        if (normalizedCategory === 'per rt') {
            dynamicColorClass = 'bg-blue-50 text-blue-700 border-blue-100/60';
        } else if (normalizedCategory === 'sahibul qurban' || normalizedCategory === 'shahibul qurban') {
            dynamicColorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100/60';
        }

        body.innerHTML += `
            <tr class="transition hover:bg-slate-50">
                <td><span class="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border tracking-wide whitespace-nowrap ${dynamicColorClass}">${categoryValue}</span></td>
                <td>${row.sumber}</td>
                <td class="font-medium text-slate-900">${row.label}</td>
                <td>${jumlahSohibul > 1 ? jumlahSohibul : '-'}</td>
                <td>${beratPerBungkus.toFixed(2)}</td>
                <td>${row.jumlahBungkus || row.jumlah_bungkus || 0}</td>
                <td>${Math.round(rowTotalBerat)}</td>
                <td class="no-print"><button type="button" class="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700" onclick="deleteDistribusiRow('${safeId}')">Hapus</button></td>
            </tr>
        `;
    });

    if (pageRows.length === 0) {
        body.innerHTML = `<tr><td colspan="8" class="px-4 py-6 text-center text-sm text-slate-400">Tidak ada data distribusi untuk filter ini.</td></tr>`;
    }

    totalBungkusEl.innerText = totalBungkus;
    totalBeratEl.innerText = Math.round(totalBerat);

    renderPaginationControls('paginationDistribusi', currentPageDistribusi, totalPages, 'goToDistribusiPage');
}

/**
 * Navigate to distribution table page
 * @param {number} page - Page number
 */
function goToDistribusiPage(page) {
    currentPageDistribusi = page;
    renderDistribusiResults(currentDistribusiFilteredRows);
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Print distribution report to PDF
 */
async function printDistribusiReport() {
    const select = document.getElementById('filterTahunDistribusi');
    const year = select ? select.value : 'all';
    const rows = (year && year !== 'all') ? distribusiRows.filter(r => String(r.tahun || '') === String(year)) : distribusiRows;
    const normalizedRows = rows.map(normalizeDistribusiRow);
    const perhitunganData = await fetchPerhitunganData();

    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        showToast('Tidak dapat memuat library PDF. Coba refresh halaman atau gunakan fitur cetak browser.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const { addPageHeader, addFooter, tableOptions } = createPdfHelpers(doc, pageWidth, pageHeight);

    const title = `Laporan Distribusi ${year === 'all' ? '(Semua Tahun)' : year}`;
    const subtitle = `Filter: ${year === 'all' ? 'Semua Tahun' : year}`;
    const printedAt = new Date().toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    addPageHeader(title, subtitle);
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`Dicetak: ${printedAt}`, 14, 36);

    if (perhitunganData) {
        const sapi = perhitunganData.sapi || { total_ekor: 0, total_kotor: 0 };
        const kambing = perhitunganData.kambing || { total_ekor: 0, total_kotor: 0 };
        const totalDagingSapi = (parseFloat(sapi.total_kotor) || 0) * 0.8;
        const totalDagingKambing = (parseFloat(kambing.total_kotor) || 0) * 0.66;
        const totalEkor = (parseInt(sapi.total_ekor, 10) || 0) + (parseInt(kambing.total_ekor, 10) || 0);
        const totalKotor = (parseFloat(sapi.total_kotor) || 0) + (parseFloat(kambing.total_kotor) || 0);
        const totalDaging = totalDagingSapi + totalDagingKambing;

        doc.autoTable({
            ...tableOptions(44),
            head: [['Jenis', 'Total Ekor', 'Total Kotor (KG)', 'Estimasi Daging (KG)']],
            body: [
                ['Sapi', sapi.total_ekor || 0, (parseFloat(sapi.total_kotor) || 0).toFixed(2), totalDagingSapi.toFixed(2)],
                ['Kambing', kambing.total_ekor || 0, (parseFloat(kambing.total_kotor) || 0).toFixed(2), totalDagingKambing.toFixed(2)],
                ['Total', totalEkor, totalKotor.toFixed(2), totalDaging.toFixed(2)]
            ],
            headStyles: { fillColor: [42, 143, 93], textColor: [255, 255, 255] },
            styles: { fontSize: 9 },
            didDrawPage: () => addFooter()
        });
    } else {
        doc.setFontSize(11);
        doc.setTextColor(120);
        doc.text('Tidak dapat memuat data perhitungan distribusi.', 14, 50);
    }

    const detailsStartY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 62;
    doc.setFontSize(12);
    doc.setTextColor(37, 64, 41);
    doc.text('Hasil Pendistribusian', 14, detailsStartY);

    const tableData = normalizedRows.length > 0 ? normalizedRows.map(r => [
        STANDARD_YEAR,
        r.kategori || '-',
        r.sumber || '-',
        r.label || '-',
        r.jumlahSohibul || 1,
        r.rt ? formatRtLabel(r.rt) : '-',
        r.beratPerBungkus.toFixed(2),
        r.jumlahBungkus,
        Math.round(Number(r.totalBerat || r.total_berat || 0))
    ]) : [[{ content: 'Tidak ada data distribusi untuk filter ini.', colSpan: 9, styles: { halign: 'center' } }]];

    if (normalizedRows.length > 0) {
        const totalBungkus = normalizedRows.reduce((sum, r) => sum + (Number(r.jumlahBungkus) || 0), 0);
        const totalBerat = normalizedRows.reduce((sum, r) => sum + Math.round(Number(r.totalBerat || r.total_berat || 0) || 0), 0);
        tableData.push([
            'TOTAL',
            '',
            '',
            '',
            '',
            '',
            '',
            totalBungkus,
            totalBerat
        ]);
    }

    doc.autoTable({
        ...tableOptions(detailsStartY + 8),
        head: [[
            'Tahun', 'Kategori', 'Sumber Daging', 'Keterangan', 'Jumlah Sohibul', 'RT', 'Berat / Bungkus (KG)', 'Jumlah', 'Total Berat (KG)'
        ]],
        body: tableData,
        headStyles: { fillColor: [42, 143, 93], textColor: [255, 255, 255] },
        columnStyles: {
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right' },
            8: { halign: 'right' }
        },
        styles: { fontSize: 8, cellPadding: 2 },
        didParseCell: (data) => {
            if (data.section === 'body' && data.row.index === tableData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
            }
        },
        didDrawPage: () => addFooter()
    });

    doc.save(`Laporan_Distribusi_${year === 'all' ? 'Semua_Tahun' : year}.pdf`);
}

if(typeof module !== 'undefined') module.exports = {
    loadDistribusiData,
    populateDistribusiYearOptions,
    onDistribusiYearChange,
    filterDistribusiByYear,
    fetchPerhitunganData,
    updateKategoriPenerimaFields,
    populateDistribusiRTOptions,
    handleDistribusiSubmit,
    saveDistribusiRows,
    normalizeDistribusiRow,
    deleteDistribusiRow,
    renderDistribusiResults,
    goToDistribusiPage,
    printDistribusiReport
};
