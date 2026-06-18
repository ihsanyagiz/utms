// ── Toast notification (reuses flash CSS classes) ──
function showToast(msg, type) {
    type = type || 'error';
    let wrap = document.querySelector('.flash-wrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'flash-wrap';
        document.body.prepend(wrap);
    }
    const el = document.createElement('div');
    el.className = `flash-msg flash-${type}`;
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 5000);
}

// Auto-dismiss server-rendered flash messages after 4 s
document.querySelectorAll('.flash-msg').forEach(el => {
    setTimeout(() => el.remove(), 4000);
});

document.addEventListener('DOMContentLoaded', () => {

    const tabButtons = document.querySelectorAll('.tab-button');
    const panels = document.querySelectorAll('.workspace-panel');
    const loaded = {};  // panelId → true once content has been fetched
    let modalPendingForm = null; // shared across all panels so the single OK listener always reads the latest value

    // ── Core: activate a panel, lazy-fetch if needed ──
    function activatePanel(targetId, slug, page) {
        page = Math.max(1, parseInt(page || 1, 10));

        panels.forEach(p => p.classList.toggle('active', p.id === targetId));
        tabButtons.forEach(b => {
            const active = b.dataset.target === targetId;
            b.classList.toggle('active', active);
            b.setAttribute('aria-pressed', String(active));
        });

        if (targetId === 'panel-main') {
            pushUrl('', 1);
            return;
        }

        if (!slug) return;
        const panel = document.getElementById(targetId);
        if (!panel) return;

        if (!loaded[targetId]) {
            fetchTabContent(panel, slug, page);
        } else {
            pushUrl(slug, page);
        }
    }

    function fetchTabContent(panel, slug, page, filterState, extraParams) {
        const state = filterState || {};
        const filter = state.filter || 'all';
        const sortCol = (state.sortCol !== undefined && state.sortCol !== null) ? state.sortCol : null;
        const sortDir = state.sortDir || 'asc';

        let url = `/dashboard/tab/${slug}?page=${page}`;
        if (filter !== 'all') url += `&filter=${encodeURIComponent(filter)}`;
        if (sortCol !== null) url += `&sort_col=${sortCol}&sort_dir=${sortDir}`;
        if (extraParams) {
            for (const [k, v] of Object.entries(extraParams)) {
                if (v !== null && v !== undefined) url += `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
            }
        }

        // Re-fetch (filter/sort/page): dim existing content, don't wipe it
        const isRefetch = !!panel.querySelector('.tab-content-wrap');
        if (isRefetch) {
            panel.classList.add('panel-fetching');
        } else {
            panel.innerHTML = '<div class="tab-loading-placeholder">Loading…</div>';
        }

        fetch(url)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.text();
            })
            .then(html => {
                panel.classList.remove('panel-fetching');
                panel.innerHTML = `<div class="tab-content-wrap">${html}</div>`;
                loaded[panel.id] = true;
                // Re-execute any <script> blocks in fetched HTML — innerHTML doesn't run them
                panel.querySelectorAll('script').forEach(old => {
                    const s = document.createElement('script');
                    Array.from(old.attributes).forEach(a => s.setAttribute(a.name, a.value));
                    s.textContent = old.textContent;
                    old.parentNode.replaceChild(s, old);
                });
                pushUrl(slug, page);
                initPanelInteractions(panel, slug);
            })
            .catch(() => {
                panel.classList.remove('panel-fetching');
                panel.innerHTML = '';
                showToast('Failed to load tab content. Please try again.', 'error');
            });
    }

    // ── Animated expand / collapse ──
    // We animate a thin wrapper div (no padding/border) around .expand-content so that
    // max-height:0 gives true 0 height — no residual from inner padding or cell font metrics.
    function getExpandWrap(content) {
        if (content.parentElement && content.parentElement.classList.contains('expand-anim-wrap')) {
            return content.parentElement;
        }
        const wrap = document.createElement('div');
        wrap.className = 'expand-anim-wrap';
        wrap.style.overflow = 'hidden';
        content.parentNode.insertBefore(wrap, content);
        wrap.appendChild(content);
        return wrap;
    }

    function expandRow(row) {
        const content = row.querySelector('.expand-content');
        if (!content) { row.hidden = false; return; }
        const td = row.querySelector('td');
        if (td) td.style.borderBottom = '';
        row.hidden = false;
        const wrap = getExpandWrap(content);
        if (wrap._anim) { wrap.removeEventListener('transitionend', wrap._anim); delete wrap._anim; }
        wrap.style.transition = 'none';
        wrap.style.maxHeight = 'none';
        const h = wrap.scrollHeight;
        wrap.style.maxHeight = '0px';
        wrap.style.opacity = '0';
        void wrap.offsetHeight; // force reflow — commits 0-height before transition starts
        wrap.style.transition = 'max-height 0.25s ease, opacity 0.2s ease';
        wrap.style.maxHeight = h + 'px';
        wrap.style.opacity = '1';
        function done(e) {
            if (e.propertyName !== 'max-height') return;
            wrap.style.maxHeight = wrap.style.transition = wrap.style.opacity = '';
            wrap.removeEventListener('transitionend', done);
            delete wrap._anim;
        }
        wrap._anim = done;
        wrap.addEventListener('transitionend', done);
    }

    function collapseRow(row) {
        const content = row.querySelector('.expand-content');
        if (!content) { row.hidden = true; return; }
        const wrap = content.parentElement && content.parentElement.classList.contains('expand-anim-wrap')
            ? content.parentElement : getExpandWrap(content);
        if (wrap._anim) { wrap.removeEventListener('transitionend', wrap._anim); delete wrap._anim; }
        const td = row.querySelector('td');
        const h = wrap.offsetHeight; // current rendered height — safe even mid-animation
        if (h === 0) {
            row.hidden = true;
            wrap.style.maxHeight = wrap.style.opacity = wrap.style.transition = '';
            if (td) td.style.borderBottom = '';
            return;
        }
        if (td) td.style.borderBottom = 'none';
        wrap.style.transition = 'none';
        wrap.style.maxHeight = h + 'px';
        void wrap.offsetHeight; // force reflow
        wrap.style.transition = 'max-height 0.2s ease, opacity 0.15s ease';
        wrap.style.maxHeight = '0px';
        wrap.style.opacity = '0';
        function done(e) {
            if (e.propertyName !== 'max-height') return;
            row.hidden = true;
            wrap.style.maxHeight = wrap.style.opacity = wrap.style.transition = '';
            if (td) td.style.borderBottom = '';
            wrap.removeEventListener('transitionend', done);
            delete wrap._anim;
        }
        wrap._anim = done;
        wrap.addEventListener('transitionend', done);
    }

    function pushUrl(slug, page) {
        const url = new URL(window.location);
        if (slug) {
            url.searchParams.set('tab', slug);
            if (page > 1) {
                url.searchParams.set('page', String(page));
            } else {
                url.searchParams.delete('page');
            }
        } else {
            url.searchParams.delete('tab');
            url.searchParams.delete('page');
        }
        history.replaceState({}, '', url);
    }

    // ── Wire up everything inside a freshly loaded panel ──
    function initPanelInteractions(panel, slug) {
        // Read server-rendered filter/sort state (present on paginated staff panels)
        const stateEl = panel.querySelector('.panel-tab-state');
        const filterState = stateEl ? {
            filter: stateEl.dataset.filter || 'all',
            sortCol: stateEl.dataset.sortCol !== '' ? parseInt(stateEl.dataset.sortCol) : null,
            sortDir: stateEl.dataset.sortDir || 'asc',
        } : { filter: 'all', sortCol: null, sortDir: 'asc' };

        // Re-apply sort indicator from server state
        if (stateEl && filterState.sortCol !== null) {
            const th = panel.querySelector(`table[id] thead th[data-sort="${filterState.sortCol}"]`);
            if (th) {
                const ind = document.createElement('span');
                ind.className = 'sort-ind';
                ind.textContent = filterState.sortDir === 'asc' ? ' ▲' : ' ▼';
                ind.style.fontSize = '10px';
                th.appendChild(ind);
            }
        }

        // Pagination buttons
        panel.querySelectorAll('.page-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page, 10);
                loaded[panel.id] = false;
                fetchTabContent(panel, slug, page, filterState);
            });
        });

        // Expand/collapse rows
        panel.querySelectorAll('.expand-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const id = btn.dataset.appId;
                const row = panel.querySelector('#expand-' + id);
                if (!row) return;
                const wasHidden = row.hidden;
                panel.querySelectorAll('.app-row-expand').forEach(r => { if (!r.hidden) collapseRow(r); });
                panel.querySelectorAll('.app-row-header').forEach(r => r.classList.remove('expanded'));
                panel.querySelectorAll('.expand-btn').forEach(b => { b.textContent = 'Expand'; });
                if (wasHidden) {
                    expandRow(row);
                    btn.closest('tr').classList.add('expanded');
                    btn.textContent = 'Collapse';
                }
            });
        });

        // Chip filters: server-side re-fetch on paginated panels, client-side otherwise
        panel.querySelectorAll('.stats-row[data-filter-table]').forEach(group => {
            const table = panel.querySelector('#' + group.dataset.filterTable);
            const chips = group.querySelectorAll('[data-filter]');
            chips.forEach(chip => {
                chip.addEventListener('click', function () {
                    if (stateEl) {
                        const alreadyActive = this.classList.contains('chip-active');
                        const newFilter = alreadyActive ? 'all' : this.dataset.filter;
                        loaded[panel.id] = false;
                        fetchTabContent(panel, slug, 1, { ...filterState, filter: newFilter });
                    } else {
                        const alreadyActive = this.classList.contains('chip-active');
                        chips.forEach(c => c.classList.remove('chip-active'));
                        const filter = alreadyActive ? 'all' : this.dataset.filter;
                        if (!alreadyActive) this.classList.add('chip-active');
                        if (table) filterTableRows(table, filter);
                    }
                });
            });
        });

        // Sortable columns: server-side re-fetch on paginated panels, client-side otherwise
        panel.querySelectorAll('table[id]').forEach(table => {
            if (stateEl) {
                table.querySelectorAll('thead th[data-sort]').forEach(th => {
                    th.style.cursor = 'pointer';
                    th.title = 'Click to sort';
                    th.addEventListener('click', function () {
                        const col = parseInt(this.dataset.sort);
                        const isSameCol = filterState.sortCol === col;
                        const dir = (isSameCol && filterState.sortDir === 'asc') ? 'desc' : 'asc';
                        loaded[panel.id] = false;
                        fetchTabContent(panel, slug, 1, { ...filterState, sortCol: col, sortDir: dir });
                    });
                });
            } else {
                initSortableTable(table);
            }
        });

        // Tab-jump buttons inside lazy-loaded content (e.g. applicant track → submit)
        // Supports optional data-extra-params='{"key": value}' for parameterised tabs
        panel.querySelectorAll('.tab-jump').forEach(b => {
            b.addEventListener('click', () => {
                const targetId = b.dataset.target;
                const slug = b.dataset.tabSlug ||
                    document.getElementById(targetId)?.dataset.tabSlug || '';
                let extra = {};
                if (b.dataset.extraParams) {
                    try { extra = JSON.parse(b.dataset.extraParams); } catch(e) {}
                }
                if (Object.keys(extra).length > 0) {
                    // Force fresh fetch with extra params even if the tab was already loaded
                    panels.forEach(p => p.classList.toggle('active', p.id === targetId));
                    tabButtons.forEach(tb => {
                        const isActive = tb.dataset.target === targetId;
                        tb.classList.toggle('active', isActive);
                        tb.setAttribute('aria-pressed', String(isActive));
                    });
                    const targetPanel = document.getElementById(targetId);
                    if (targetPanel) {
                        loaded[targetId] = false;
                        fetchTabContent(targetPanel, slug, 1, null, extra);
                    }
                } else {
                    activatePanel(targetId, slug);
                }
            });
        });

        // Enrolled checkbox inside fetched content
        const cb = panel.querySelector('#enrolled-dash');
        const univField = panel.querySelector('#univ-dash');
        if (cb && univField) {
            cb.addEventListener('change', () => {
                univField.style.display = cb.checked ? 'block' : 'none';
            });
        }

        // Multi-step application form
        initAppForm(panel);

        // Confirm modal — lives in dashboard.html outside .workspace-area so position:fixed
        // covers the full viewport (transform on .workspace-panel.active would break it otherwise)
        // modalPendingForm is hoisted to the DOMContentLoaded scope so every panel's trigger buttons
        // and the single set of OK/Cancel listeners all share the same variable.
        const modal = document.getElementById('dashboard-confirm-modal');
        if (modal) {
            panel.querySelectorAll('[data-modal-trigger]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const formId = btn.dataset.form;
                    modalPendingForm = formId ? panel.querySelector('#' + formId) : btn.closest('form');
                    modal.querySelector('.confirm-modal-msg').textContent = btn.dataset.modalMsg || 'Are you sure?';
                    modal.hidden = false;
                });
            });
            // Wire close buttons only once — the modal is outside the panel and survives re-fetches
            if (!modal._wired) {
                modal._wired = true;
                modal.querySelector('.confirm-modal-cancel').addEventListener('click', () => {
                    modal.hidden = true;
                    modalPendingForm = null;
                });
                modal.querySelector('.confirm-modal-ok').addEventListener('click', () => {
                    modal.hidden = true;
                    if (modalPendingForm) modalPendingForm.submit();
                    modalPendingForm = null;
                });
                modal.querySelector('.confirm-modal-overlay').addEventListener('click', () => {
                    modal.hidden = true;
                    modalPendingForm = null;
                });
            }
        }
    }

    // ── Multi-step form ──
    function initAppForm(container) {
        const appForm = container.querySelector('#app-form');
        if (!appForm) return;

        const steps = Array.from(appForm.querySelectorAll('.form-step'));
        const indicators = Array.from(container.querySelectorAll('.step-ind'));
        let currentStep = 0;

        function showStep(n) {
            steps.forEach((s, i) => s.classList.toggle('active', i === n));
            indicators.forEach((ind, i) => {
                ind.classList.toggle('active', i === n);
                ind.classList.toggle('done', i < n);
            });
            currentStep = n;
            if (n === steps.length - 1) populateReview();
        }

        function validateTurkishId(tc) {
            if (!tc || tc.length !== 11 || !/^\d+$/.test(tc)) return false;
            if (tc[0] === '0') return false;
            const d = tc.split('').map(Number);
            if (((d[0]+d[2]+d[4]+d[6]+d[8]) * 7 - (d[1]+d[3]+d[5]+d[7])) % 10 !== d[9]) return false;
            if ((d[0]+d[1]+d[2]+d[3]+d[4]+d[5]+d[6]+d[7]+d[8]+d[9]) % 10 !== d[10]) return false;
            return true;
        }

        function validateStep(n) {
            const step = steps[n];
            const inputs = step.querySelectorAll('input[required], select[required], textarea[required]');
            let ok = true;
            let firstError = null;

            inputs.forEach(el => {
                el.style.borderColor = '';
                if (el.type === 'file') {
                    const wrap = el.closest('.doc-upload-label');
                    if (wrap) wrap.style.outline = '';
                    if (!el.files || el.files.length === 0) {
                        if (wrap) wrap.style.outline = '2px solid #ef4444';
                        ok = false;
                        if (!firstError) firstError = el;
                    } else {
                        const file = el.files[0];
                        if (!file.name.toLowerCase().endsWith('.pdf')) {
                            if (wrap) wrap.style.outline = '2px solid #ef4444';
                            ok = false;
                            if (!firstError) firstError = el;
                            alert(`"${el.dataset.docLabel || el.name}" must be a PDF file.`);
                        } else if (file.size > 5 * 1024 * 1024) {
                            if (wrap) wrap.style.outline = '2px solid #ef4444';
                            ok = false;
                            if (!firstError) firstError = el;
                            alert(`"${el.dataset.docLabel || el.name}" exceeds the 5 MB size limit.`);
                        }
                    }
                } else if (!el.value.trim()) {
                    el.style.borderColor = '#ef4444';
                    ok = false;
                    if (!firstError) firstError = el;
                }
            });

            const idInput = step.querySelector('input[name="id_number"]');
            if (idInput && idInput.value.trim()) {
                if (!validateTurkishId(idInput.value.trim())) {
                    idInput.style.borderColor = '#ef4444';
                    ok = false;
                }
            }

            const gpaInput = step.querySelector('input[name="current_gpa"]');
            if (gpaInput && gpaInput.value) {
                const v = parseFloat(gpaInput.value);
                if (isNaN(v) || v < 0 || v > 4.0) { gpaInput.style.borderColor = '#ef4444'; ok = false; }
            }

            const osymInput = step.querySelector('input[name="osym_points"]');
            if (osymInput && osymInput.value) {
                const v = parseFloat(osymInput.value);
                if (isNaN(v) || v < 0 || v > 560) { osymInput.style.borderColor = '#ef4444'; ok = false; }
            }

            return ok;
        }

        appForm.querySelectorAll('.next-step').forEach(btn => {
            btn.addEventListener('click', () => { if (validateStep(currentStep)) showStep(currentStep + 1); });
        });
        appForm.querySelectorAll('.prev-step').forEach(btn => {
            btn.addEventListener('click', () => { if (currentStep > 0) showStep(currentStep - 1); });
        });

        function populateReview() {
            function val(name) {
                const el = appForm.querySelector(`[name="${name}"]`);
                if (!el) return '—';
                if (el.tagName === 'SELECT') return el.options[el.selectedIndex]?.text || '—';
                return el.value.trim() || '—';
            }
            const get = id => container.querySelector('#' + id);
            if (get('rv-program')) get('rv-program').textContent = val('target_program');
            if (get('rv-semester')) get('rv-semester').textContent = val('target_semester');
            if (get('rv-name')) get('rv-name').textContent = val('full_name');
            if (get('rv-id')) get('rv-id').textContent = val('id_number');
            if (get('rv-univ')) get('rv-univ').textContent = val('source_university') || '—';
            if (get('rv-gpa')) get('rv-gpa').textContent = val('current_gpa');
            if (get('rv-osym')) get('rv-osym').textContent = val('osym_points');
            const rvDocs = get('rv-docs');
            if (rvDocs) {
                rvDocs.innerHTML = '';
                appForm.querySelectorAll('input[type="file"]').forEach(fi => {
                    const row = document.createElement('div');
                    row.className = 'review-row';
                    const label = fi.closest('label')?.querySelector('.doc-upload-name')?.textContent || fi.name;
                    const file = fi.files && fi.files[0] ? fi.files[0].name : '(no file selected)';
                    row.innerHTML = `<span>${label}</span><span>${file}</span>`;
                    rvDocs.appendChild(row);
                });
            }
        }
    }

    // ── Shared helpers ──
    function filterTableRows(table, filter) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        for (let i = 0; i < rows.length; i += 2) {
            const header = rows[i];
            const expand = rows[i + 1];
            const show = filter === 'all' || header.dataset.status === filter;
            header.style.display = show ? '' : 'none';
            if (expand) expand.style.display = show ? '' : 'none';
        }
    }

    function initSortableTable(table) {
        if (!table) return;
        const headers = table.querySelectorAll('thead th[data-sort]');
        let currentCol = null, ascending = true;
        headers.forEach(th => {
            th.style.cursor = 'pointer';
            th.title = 'Click to sort';
            th.addEventListener('click', function () {
                const col = parseInt(this.dataset.sort);
                ascending = (currentCol === col) ? !ascending : true;
                currentCol = col;
                headers.forEach(h => { const ind = h.querySelector('.sort-ind'); if (ind) h.removeChild(ind); });
                const ind = document.createElement('span');
                ind.className = 'sort-ind';
                ind.textContent = ascending ? ' ▲' : ' ▼';
                ind.style.fontSize = '10px';
                this.appendChild(ind);
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                const pairs = [];
                for (let i = 0; i < rows.length; i += 2) pairs.push([rows[i], rows[i + 1]]);
                pairs.sort((a, b) => {
                    const aT = (a[0].cells[col] ? a[0].cells[col].textContent : '').trim();
                    const bT = (b[0].cells[col] ? b[0].cells[col].textContent : '').trim();
                    const aN = parseFloat(aT), bN = parseFloat(bT);
                    if (!isNaN(aN) && !isNaN(bN)) return ascending ? aN - bN : bN - aN;
                    return ascending ? aT.localeCompare(bT) : bT.localeCompare(aT);
                });
                pairs.forEach(pair => { tbody.appendChild(pair[0]); tbody.appendChild(pair[1]); });
            });
        });
    }

    // ── Static tab buttons (main nav) ──
    tabButtons.forEach(b => {
        b.addEventListener('click', () => activatePanel(b.dataset.target, b.dataset.tabSlug));
    });

    // Tab-jump in the main cards panel (these are in the static DOM)
    document.querySelectorAll('#panel-main .tab-jump').forEach(b => {
        b.addEventListener('click', () => activatePanel(b.dataset.target, b.dataset.tabSlug));
    });

    // Expose force-refresh so inline panel scripts can invalidate a tab after a state change
    window.dashboardForceRefresh = function(targetId, slug) {
        loaded[targetId] = false;
        activatePanel(targetId, slug);
    };

    // H1 title → back to main
    const dashTitle = document.getElementById('dash-title');
    if (dashTitle) dashTitle.addEventListener('click', () => activatePanel('panel-main', ''));

    // ── Activate tab from URL on load ──
    const urlParams = new URLSearchParams(window.location.search);
    const initSlug = urlParams.get('tab');
    const initPage = Math.max(1, parseInt(urlParams.get('page') || '1', 10));

    if (initSlug) {
        const btn = Array.from(tabButtons).find(b => b.dataset.tabSlug === initSlug);
        if (btn) activatePanel(btn.dataset.target, initSlug, initPage);
    }

});
