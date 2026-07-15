/* ============================================================
   FLEETLINE — APP SHELL, ROUTER & VIEWS
   ============================================================ */

const CURRENCY = () => Store.data.settings.currency;
const fmtMoney = (n) => `${CURRENCY()}${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

const ICONS = {
  dashboard: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  truck: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="1" y="6" width="14" height="10" rx="1.5"/><path d="M15 9h4l3 3v4h-7z"/><circle cx="6" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/></svg>',
  driver: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
  route: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="5" cy="19" r="2.3"/><circle cx="19" cy="5" r="2.3"/><path d="M5 16.7V13a4 4 0 0 1 4-4h6a4 4 0 0 0 4-4"/></svg>',
  wallet: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10h19"/><circle cx="17" cy="14.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
  wrench: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2z"/></svg>',
  spark: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
  report: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/><path d="M8 13h8M8 17h5"/></svg>',
  plus: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>',
  edit: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  trash: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M6 6l1 15h10l1-15"/></svg>',
  download: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v13"/><path d="M7 11l5 5 5-5"/><path d="M4 21h16"/></svg>',
  alert: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2 1 21h22z"/><path d="M12 9v5"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/></svg>',
};

const ROUTES = [
  { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard, group: 'Overview' },
  { id: 'vehicles', label: 'Vehicles', icon: ICONS.truck, group: 'Fleet' },
  { id: 'drivers', label: 'Drivers', icon: ICONS.driver, group: 'Fleet' },
  { id: 'trips', label: 'Trips', icon: ICONS.route, group: 'Fleet' },
  { id: 'costing', label: 'Costing', icon: ICONS.wallet, group: 'Finance' },
  { id: 'maintenance', label: 'Maintenance', icon: ICONS.wrench, group: 'Finance' },
  { id: 'ai', label: 'AI Insights', icon: ICONS.spark, group: 'Automation' },
  { id: 'reports', label: 'Reports', icon: ICONS.report, group: 'Automation' },
];

let charts = {}; // keep refs so we can destroy before re-render

/* ---------------------------------------------------------- router ---------------------------------------------------------- */
function currentRoute() {
  const hash = location.hash.replace('#/', '') || 'dashboard';
  return ROUTES.find((r) => r.id === hash) ? hash : 'dashboard';
}

function navigate() {
  const route = currentRoute();
  renderSidebar(route);
  renderTicker();
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  const renderers = {
    dashboard: pageDashboard, vehicles: pageVehicles, drivers: pageDrivers,
    trips: pageTrips, costing: pageCosting, maintenance: pageMaintenance,
    ai: pageAI, reports: pageReports,
  };
  (renderers[route] || pageDashboard)(main);
}

window.addEventListener('hashchange', navigate);

/* ---------------------------------------------------------- sidebar ---------------------------------------------------------- */
function renderSidebar(active) {
  const el = document.getElementById('sidebar');
  const groups = [...new Set(ROUTES.map((r) => r.group))];
  const criticalCount = AIEngine.run().filter((i) => i.severity === 'critical').length;

  el.innerHTML = `
    <div class="brand">
      <div class="brand-mark">FL</div>
      <div class="brand-text"><strong>Fleetline</strong><span>Ops Console</span></div>
    </div>
    ${groups.map((g) => `
      <div class="nav-group">
        <div class="nav-label">${g}</div>
        ${ROUTES.filter((r) => r.group === g).map((r) => `
          <button class="nav-item ${r.id === active ? 'is-active' : ''}" data-nav="${r.id}">
            ${r.icon}<span>${r.label}</span>
            ${r.id === 'ai' && criticalCount ? `<span class="nav-badge">${criticalCount}</span>` : ''}
          </button>
        `).join('')}
      </div>
    `).join('')}
    <div class="sidebar-footer">
      ${Store.data.vehicles.length} vehicles · ${Store.data.drivers.length} drivers<br>
      Local browser storage only
      <button id="btn-reset-data">Reset demo data</button>
    </div>
  `;
  el.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => { location.hash = `#/${btn.dataset.nav}`; });
  });
  document.getElementById('btn-reset-data').addEventListener('click', () => {
    if (confirm('Reset all data back to the sample fleet? This clears anything you\'ve added.')) {
      Store.reset();
      navigate();
    }
  });
}

/* ---------------------------------------------------------- ticker ---------------------------------------------------------- */
function renderTicker() {
  const el = document.getElementById('ticker');
  const trips = Store.activeAndUpcomingTrips();
  if (!trips.length) {
    el.innerHTML = `<div class="ticker-empty">No active or scheduled trips — the yard is quiet.</div>`;
    return;
  }
  const items = trips.map((t) => {
    const v = Store.vehicleById(t.vehicleId);
    const d = Store.driverById(t.driverId);
    const chip = t.status === 'in_progress' ? '<span class="ticker-chip en-route">En route</span>' : '<span class="ticker-chip scheduled">Scheduled</span>';
    return `<div class="ticker-item">${chip}<b>${v ? v.name : 'Unassigned'}</b> ${t.origin} → ${t.destination} <span class="text-faint">/ ${d ? d.name : 'no driver'} / ${t.status === 'in_progress' ? 'ETA ' + fmtDateTime(t.endAt) : fmtDateTime(t.startAt)}</span></div>`;
  }).join('');
  // duplicate the list so the CSS scroll-loop is seamless
  el.innerHTML = `<div class="ticker-track">${items}${items}</div>`;
}

/* ---------------------------------------------------------- shared UI helpers ---------------------------------------------------------- */
function pageHead(main, eyebrow, title, sub, actionsHtml = '') {
  const head = document.createElement('div');
  head.className = 'page-head';
  head.innerHTML = `
    <div>
      <div class="page-eyebrow">${eyebrow}</div>
      <h1>${title}</h1>
      ${sub ? `<div class="page-sub">${sub}</div>` : ''}
    </div>
    <div style="display:flex; gap:10px;">${actionsHtml}</div>
  `;
  main.appendChild(head);
  return head;
}

function statusPill(status) {
  return `<span class="pill ${status}">${status.replace('_', ' ')}</span>`;
}

function categoryPill(category) {
  const map = { fuel: 'active', maintenance: 'maintenance', insurance: 'idle', toll: 'idle', fine: 'out_of_service', other: 'idle' };
  return `<span class="pill ${map[category] || 'idle'}">${cap(category)}</span>`;
}

function openModal(title, bodyHtml, footHtml) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-head"><h3>${title}</h3><button class="modal-close" id="modal-close-btn">&times;</button></div>
      <div class="modal-body">${bodyHtml}</div>
      <div class="modal-foot">${footHtml}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.addEventListener('keydown', escCloseModal);
  return overlay;
}
function escCloseModal(e) { if (e.key === 'Escape') closeModal(); }
function closeModal() {
  const m = document.getElementById('modal-overlay');
  if (m) m.remove();
  document.removeEventListener('keydown', escCloseModal);
}

function confirmDelete(label, onYes) {
  openModal('Confirm delete', `<p class="text-dim" style="margin:0;">Delete <strong style="color:var(--text)">${label}</strong>? This can't be undone.</p>`,
    `<button class="btn btn-ghost" id="cancel-del">Cancel</button><button class="btn btn-danger" id="confirm-del">${ICONS.trash} Delete</button>`);
  document.getElementById('cancel-del').addEventListener('click', closeModal);
  document.getElementById('confirm-del').addEventListener('click', () => { onYes(); closeModal(); });
}

function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:var(--panel-raised);border:1px solid var(--line);color:var(--text);padding:10px 18px;border-radius:8px;font-size:13px;z-index:200;box-shadow:var(--shadow);transition:opacity .3s;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2200);
}

function destroyCharts(keys) { keys.forEach((k) => { if (charts[k]) { charts[k].destroy(); delete charts[k]; } }); }

const CHART_COLORS = { amber: '#f2a93b', teal: '#3fb8af', red: '#e3543b', green: '#5fbe7a', grid: '#2b3542', text: '#8b98a6' };
function chartBaseOptions(extra = {}) {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: CHART_COLORS.text, font: { family: 'Inter', size: 11 } } } },
    scales: {
      x: { ticks: { color: CHART_COLORS.text, font: { family: 'JetBrains Mono', size: 10.5 } }, grid: { color: CHART_COLORS.grid } },
      y: { ticks: { color: CHART_COLORS.text, font: { family: 'JetBrains Mono', size: 10.5 } }, grid: { color: CHART_COLORS.grid } },
    },
    ...extra,
  };
}

function csvDownload(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ============================================================  DASHBOARD  ============================================================ */
function pageDashboard(main) {
  pageHead(main, 'Overview', 'Dashboard', 'Fleet-wide status, live ops and cost trend at a glance.');

  const counts = Store.fleetStatusCounts();
  const totalCost = Store.fleetTotalCost();
  const cpk = Store.fleetAvgCostPerKm();
  const insights = AIEngine.run();
  const critical = insights.filter((i) => i.severity === 'critical').length;
  const warning = insights.filter((i) => i.severity === 'warning').length;

  const kpis = document.createElement('div');
  kpis.className = 'kpi-grid';
  kpis.innerHTML = `
    <div class="kpi-card"><div class="kpi-accent amber"></div><div class="kpi-label">Fleet size</div><div class="kpi-value mono">${Store.data.vehicles.length}</div><div class="kpi-delta">${counts.active || 0} active · ${counts.maintenance || 0} in shop</div></div>
    <div class="kpi-card"><div class="kpi-accent teal"></div><div class="kpi-label">Trips in motion</div><div class="kpi-value mono">${Store.activeAndUpcomingTrips().length}</div><div class="kpi-delta">${Store.data.trips.filter((t) => t.status === 'completed').length} completed to date</div></div>
    <div class="kpi-card"><div class="kpi-accent green"></div><div class="kpi-label">Total fleet spend</div><div class="kpi-value mono">${fmtMoney(totalCost)}</div><div class="kpi-delta">${fmtMoney(cpk)}/km average</div></div>
    <div class="kpi-card"><div class="kpi-accent red"></div><div class="kpi-label">Open AI alerts</div><div class="kpi-value mono">${critical + warning}</div><div class="kpi-delta ${critical ? 'up' : ''}">${critical} critical · ${warning} warning</div></div>
  `;
  main.appendChild(kpis);

  const grid = document.createElement('div');
  grid.className = 'grid-2';
  grid.innerHTML = `
    <div class="panel">
      <div class="panel-head"><h3>Cost trend — last 6 months</h3><span class="hint">expenses + trip costs</span></div>
      <div class="chart-box"><canvas id="chart-cost-trend"></canvas></div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Fleet status</h3><span class="hint">${Store.data.vehicles.length} units</span></div>
      <div class="chart-box"><canvas id="chart-status-donut"></canvas></div>
    </div>
  `;
  main.appendChild(grid);

  const bottom = document.createElement('div');
  bottom.className = 'grid-2';
  const topInsights = insights.slice(0, 3);
  bottom.innerHTML = `
    <div class="panel">
      <div class="panel-head"><h3>Top AI insights</h3><a class="link-btn" href="#/ai">View all →</a></div>
      ${topInsights.length ? topInsights.map(insightCardHtml).join('') : emptyStateHtml('All clear', 'No alerts right now — Fleetline is watching costs, maintenance and licences automatically.')}
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Upcoming &amp; active trips</h3><a class="link-btn" href="#/trips">Manage trips →</a></div>
      ${dashboardTripsListHtml()}
    </div>
  `;
  main.appendChild(bottom);

  destroyCharts(['cost-trend', 'status-donut']);
  const months = Store.costByMonth(6);
  charts['cost-trend'] = new Chart(document.getElementById('chart-cost-trend'), {
    type: 'line',
    data: {
      labels: months.map((m) => m.label),
      datasets: [{
        label: 'Spend', data: months.map((m) => Math.round(m.total)),
        borderColor: CHART_COLORS.amber, backgroundColor: 'rgba(242,169,59,0.12)',
        fill: true, tension: 0.35, pointRadius: 3, pointBackgroundColor: CHART_COLORS.amber,
      }],
    },
    options: chartBaseOptions({ plugins: { legend: { display: false } } }),
  });

  const statusLabels = Object.keys(counts).filter((k) => counts[k] > 0);
  charts['status-donut'] = new Chart(document.getElementById('chart-status-donut'), {
    type: 'doughnut',
    data: {
      labels: statusLabels.map((s) => cap(s.replace('_', ' '))),
      datasets: [{
        data: statusLabels.map((s) => counts[s]),
        backgroundColor: statusLabels.map((s) => ({ active: CHART_COLORS.green, idle: CHART_COLORS.amber, maintenance: CHART_COLORS.teal, out_of_service: CHART_COLORS.red }[s])),
        borderColor: '#1a222b', borderWidth: 3,
      }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: CHART_COLORS.text, font: { family: 'Inter', size: 11.5 }, padding: 14 } } } },
  });
}

function emptyStateHtml(title, msg) {
  return `<div class="empty-state"><h4>${title}</h4><p>${msg}</p></div>`;
}

function insightCardHtml(i) {
  const icon = { critical: ICONS.alert, warning: ICONS.alert, info: ICONS.spark }[i.severity];
  return `
    <div class="insight ${i.severity}">
      <div class="insight-icon">${icon}</div>
      <div class="insight-body">
        <div class="insight-meta">${i.category}</div>
        <h4>${i.title}</h4>
        <p>${i.message}</p>
      </div>
    </div>
  `;
}

function dashboardTripsListHtml() {
  const trips = Store.activeAndUpcomingTrips().slice(0, 5);
  if (!trips.length) return emptyStateHtml('Nothing scheduled', 'Log a trip to see it appear here and on the ops ticker.');
  return `<div class="table-wrap"><table><tbody>
    ${trips.map((t) => {
      const v = Store.vehicleById(t.vehicleId);
      const d = Store.driverById(t.driverId);
      return `<tr>
        <td><strong>${v ? v.name : '—'}</strong><br><span class="text-faint" style="font-size:11.5px">${d ? d.name : 'Unassigned driver'}</span></td>
        <td>${t.origin} → ${t.destination}</td>
        <td>${statusPill(t.status)}</td>
        <td class="mono text-dim">${fmtDateTime(t.startAt)}</td>
      </tr>`;
    }).join('')}
  </tbody></table></div>`;
}

/* ============================================================  VEHICLES  ============================================================ */
function pageVehicles(main) {
  pageHead(main, 'Fleet', 'Vehicles', 'Every asset in the fleet, its status and service position.',
    `<button class="btn btn-primary" id="btn-add-vehicle">${ICONS.plus} Add vehicle</button>`);

  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.innerHTML = `
    <input type="search" id="veh-search" placeholder="Search name, plate, model…">
    <select id="veh-status-filter">
      <option value="">All statuses</option>
      <option value="active">Active</option>
      <option value="idle">Idle</option>
      <option value="maintenance">Maintenance</option>
      <option value="out_of_service">Out of service</option>
    </select>
    <div class="spacer"></div>
    <span class="badge-count" id="veh-count"></span>
  `;
  main.appendChild(toolbar);

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `<div class="table-wrap" id="veh-table-wrap"></div>`;
  main.appendChild(panel);

  function renderTable() {
    const q = document.getElementById('veh-search').value.toLowerCase();
    const statusFilter = document.getElementById('veh-status-filter').value;
    let list = Store.data.vehicles.filter((v) =>
      (!statusFilter || v.status === statusFilter) &&
      (!q || `${v.name} ${v.plate} ${v.make} ${v.model}`.toLowerCase().includes(q)));
    document.getElementById('veh-count').textContent = `${list.length} of ${Store.data.vehicles.length}`;

    const wrap = document.getElementById('veh-table-wrap');
    if (!list.length) { wrap.innerHTML = emptyStateHtml('No vehicles match', 'Try a different search or filter.'); return; }

    wrap.innerHTML = `<table>
      <thead><tr><th>Unit</th><th>Type</th><th>Driver</th><th>Status</th><th class="num">Odometer</th><th class="num">Cost / km</th><th>Next service</th><th></th></tr></thead>
      <tbody>${list.map((v) => {
        const driver = v.assignedDriverId ? Store.driverById(v.assignedDriverId) : null;
        const cpk = Store.vehicleCostPerKm(v.id);
        const kmSince = Store.kmSinceService(v);
        const pct = v.serviceIntervalKm ? Math.min(100, Math.round((kmSince / v.serviceIntervalKm) * 100)) : 0;
        const barColor = pct >= 100 ? 'var(--red)' : pct >= 85 ? 'var(--amber)' : 'var(--teal)';
        return `<tr>
          <td><strong>${v.name}</strong><br><span class="text-faint" style="font-size:11.5px">${v.make} ${v.model} · ${v.plate}</span></td>
          <td>${v.type}</td>
          <td>${driver ? driver.name : '<span class="text-faint">Unassigned</span>'}</td>
          <td>${statusPill(v.status)}</td>
          <td class="num mono">${Number(v.odometer).toLocaleString()} km</td>
          <td class="num mono">${cpk ? fmtMoney(cpk) : '—'}</td>
          <td style="min-width:120px">
            <span class="text-faint" style="font-size:11px">${pct}% of interval</span>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${barColor}"></div></div>
          </td>
          <td><div class="row-actions">
            <button class="btn btn-sm btn-ghost" data-edit="${v.id}">${ICONS.edit}</button>
            <button class="btn btn-sm btn-ghost" data-del="${v.id}">${ICONS.trash}</button>
          </div></td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;

    wrap.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => vehicleForm(b.dataset.edit)));
    wrap.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
      const v = Store.vehicleById(b.dataset.del);
      confirmDelete(v.name, () => { Store.remove('vehicles', v.id); toast('Vehicle deleted'); renderTable(); renderSidebar('vehicles'); });
    }));
  }

  document.getElementById('veh-search').addEventListener('input', renderTable);
  document.getElementById('veh-status-filter').addEventListener('change', renderTable);
  document.getElementById('btn-add-vehicle').addEventListener('click', () => vehicleForm());
  renderTable();

  function vehicleForm(id) {
    const editing = id ? Store.vehicleById(id) : null;
    const drivers = Store.data.drivers;
    const body = `
      <div class="field-row">
        <div class="field"><label>Unit name</label><input id="f-name" value="${editing?.name || ''}" placeholder="Unit 06"></div>
        <div class="field"><label>Plate</label><input id="f-plate" value="${editing?.plate || ''}" placeholder="CA 000-000"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Make</label><input id="f-make" value="${editing?.make || ''}"></div>
        <div class="field"><label>Model</label><input id="f-model" value="${editing?.model || ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Year</label><input id="f-year" type="number" value="${editing?.year || new Date().getFullYear()}"></div>
        <div class="field"><label>Type</label><input id="f-type" value="${editing?.type || ''}" placeholder="Box Truck, Van, Pickup…"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Status</label>
          <select id="f-status">
            ${['active', 'idle', 'maintenance', 'out_of_service'].map((s) => `<option value="${s}" ${editing?.status === s ? 'selected' : ''}>${cap(s.replace('_', ' '))}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Fuel type</label><input id="f-fuel" value="${editing?.fuelType || 'Diesel'}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Odometer (km)</label><input id="f-odo" type="number" value="${editing?.odometer || 0}"></div>
        <div class="field"><label>Assigned driver</label>
          <select id="f-driver"><option value="">Unassigned</option>${drivers.map((d) => `<option value="${d.id}" ${editing?.assignedDriverId === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select>
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label>Service interval (km)</label><input id="f-int-km" type="number" value="${editing?.serviceIntervalKm || 10000}"></div>
        <div class="field"><label>Service interval (months)</label><input id="f-int-mo" type="number" value="${editing?.serviceIntervalMonths || 6}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Last service date</label><input id="f-last-date" type="date" value="${editing?.lastServiceDate || todayISO()}"></div>
        <div class="field"><label>Odometer at last service</label><input id="f-last-odo" type="number" value="${editing?.lastServiceOdometer || 0}"></div>
      </div>
    `;
    const overlay = openModal(editing ? `Edit ${editing.name}` : 'Add vehicle', body,
      `<button class="btn btn-ghost" id="cancel">Cancel</button><button class="btn btn-primary" id="save">${editing ? 'Save changes' : 'Add vehicle'}</button>`);
    document.getElementById('cancel').addEventListener('click', closeModal);
    document.getElementById('save').addEventListener('click', () => {
      const name = document.getElementById('f-name').value.trim();
      if (!name) { toast('Give the unit a name'); return; }
      const record = {
        name, plate: document.getElementById('f-plate').value.trim(),
        make: document.getElementById('f-make').value.trim(), model: document.getElementById('f-model').value.trim(),
        year: Number(document.getElementById('f-year').value), type: document.getElementById('f-type').value.trim() || 'General',
        status: document.getElementById('f-status').value, fuelType: document.getElementById('f-fuel').value.trim(),
        odometer: Number(document.getElementById('f-odo').value), assignedDriverId: document.getElementById('f-driver').value || null,
        serviceIntervalKm: Number(document.getElementById('f-int-km').value), serviceIntervalMonths: Number(document.getElementById('f-int-mo').value),
        lastServiceDate: document.getElementById('f-last-date').value, lastServiceOdometer: Number(document.getElementById('f-last-odo').value),
        purchaseDate: editing?.purchaseDate || todayISO(),
      };
      if (editing) Store.update('vehicles', editing.id, record); else Store.add('vehicles', record);
      toast(editing ? 'Vehicle updated' : 'Vehicle added');
      closeModal(); renderTable(); renderSidebar('vehicles');
    });
  }
}

/* ============================================================  DRIVERS  ============================================================ */
function pageDrivers(main) {
  pageHead(main, 'Fleet', 'Drivers', 'Licences, contact details and vehicle assignments.',
    `<button class="btn btn-primary" id="btn-add-driver">${ICONS.plus} Add driver</button>`);

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `<div class="table-wrap" id="drv-table-wrap"></div>`;
  main.appendChild(panel);

  function renderTable() {
    const list = Store.data.drivers;
    const wrap = document.getElementById('drv-table-wrap');
    if (!list.length) { wrap.innerHTML = emptyStateHtml('No drivers yet', 'Add your first driver to start assigning trips.'); return; }
    wrap.innerHTML = `<table>
      <thead><tr><th>Driver</th><th>Licence</th><th>Expiry</th><th>Vehicle</th><th>Status</th><th></th></tr></thead>
      <tbody>${list.map((d) => {
        const v = d.assignedVehicleId ? Store.vehicleById(d.assignedVehicleId) : null;
        const days = daysBetween(todayISO(), d.licenseExpiry);
        const expiryColor = days < 0 ? 'var(--red)' : days <= 30 ? 'var(--amber)' : 'var(--text-dim)';
        return `<tr>
          <td><strong>${d.name}</strong><br><span class="text-faint" style="font-size:11.5px">${d.phone}</span></td>
          <td class="mono">${d.licenseNo} <span class="text-faint">(${d.licenseClass})</span></td>
          <td class="mono" style="color:${expiryColor}">${fmtDate(d.licenseExpiry)}</td>
          <td>${v ? v.name : '<span class="text-faint">Unassigned</span>'}</td>
          <td>${statusPill(d.status)}</td>
          <td><div class="row-actions">
            <button class="btn btn-sm btn-ghost" data-edit="${d.id}">${ICONS.edit}</button>
            <button class="btn btn-sm btn-ghost" data-del="${d.id}">${ICONS.trash}</button>
          </div></td>
        </tr>`;
      }).join('')}</tbody></table>`;

    wrap.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => driverForm(b.dataset.edit)));
    wrap.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
      const d = Store.driverById(b.dataset.del);
      confirmDelete(d.name, () => { Store.remove('drivers', d.id); toast('Driver deleted'); renderTable(); renderSidebar('drivers'); });
    }));
  }

  document.getElementById('btn-add-driver').addEventListener('click', () => driverForm());
  renderTable();

  function driverForm(id) {
    const editing = id ? Store.driverById(id) : null;
    const vehicles = Store.data.vehicles;
    const body = `
      <div class="field"><label>Full name</label><input id="f-name" value="${editing?.name || ''}"></div>
      <div class="field-row">
        <div class="field"><label>Licence number</label><input id="f-lic" value="${editing?.licenseNo || ''}"></div>
        <div class="field"><label>Licence class</label><input id="f-class" value="${editing?.licenseClass || ''}" placeholder="C1, EB…"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Licence expiry</label><input id="f-exp" type="date" value="${editing?.licenseExpiry || todayISO()}"></div>
        <div class="field"><label>Phone</label><input id="f-phone" value="${editing?.phone || ''}"></div>
      </div>
      <div class="field"><label>Email</label><input id="f-email" value="${editing?.email || ''}"></div>
      <div class="field-row">
        <div class="field"><label>Status</label>
          <select id="f-status">${['active', 'inactive'].map((s) => `<option value="${s}" ${editing?.status === s ? 'selected' : ''}>${cap(s)}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Assigned vehicle</label>
          <select id="f-vehicle"><option value="">Unassigned</option>${vehicles.map((v) => `<option value="${v.id}" ${editing?.assignedVehicleId === v.id ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
        </div>
      </div>
    `;
    openModal(editing ? `Edit ${editing.name}` : 'Add driver', body,
      `<button class="btn btn-ghost" id="cancel">Cancel</button><button class="btn btn-primary" id="save">${editing ? 'Save changes' : 'Add driver'}</button>`);
    document.getElementById('cancel').addEventListener('click', closeModal);
    document.getElementById('save').addEventListener('click', () => {
      const name = document.getElementById('f-name').value.trim();
      if (!name) { toast('Enter a name'); return; }
      const record = {
        name, licenseNo: document.getElementById('f-lic').value.trim(), licenseClass: document.getElementById('f-class').value.trim(),
        licenseExpiry: document.getElementById('f-exp').value, phone: document.getElementById('f-phone').value.trim(),
        email: document.getElementById('f-email').value.trim(), status: document.getElementById('f-status').value,
        assignedVehicleId: document.getElementById('f-vehicle').value || null,
      };
      if (editing) Store.update('drivers', editing.id, record); else Store.add('drivers', record);
      toast(editing ? 'Driver updated' : 'Driver added');
      closeModal(); renderTable(); renderSidebar('drivers');
    });
  }
}

/* ============================================================  TRIPS  ============================================================ */
function pageTrips(main) {
  pageHead(main, 'Fleet', 'Trips', 'Schedule, dispatch and close out trips across the fleet.',
    `<button class="btn btn-primary" id="btn-add-trip">${ICONS.plus} Log trip</button>`);

  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.innerHTML = `
    <select id="trip-status-filter">
      <option value="">All statuses</option>
      <option value="scheduled">Scheduled</option>
      <option value="in_progress">In progress</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
    </select>
    <div class="spacer"></div>
    <span class="badge-count" id="trip-count"></span>
  `;
  main.appendChild(toolbar);

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `<div class="table-wrap" id="trip-table-wrap"></div>`;
  main.appendChild(panel);

  function renderTable() {
    const filter = document.getElementById('trip-status-filter').value;
    let list = [...Store.data.trips].sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
    if (filter) list = list.filter((t) => t.status === filter);
    document.getElementById('trip-count').textContent = `${list.length} of ${Store.data.trips.length}`;
    const wrap = document.getElementById('trip-table-wrap');
    if (!list.length) { wrap.innerHTML = emptyStateHtml('No trips found', 'Log a trip to start tracking distance and cost.'); return; }
    wrap.innerHTML = `<table>
      <thead><tr><th>Route</th><th>Vehicle / Driver</th><th class="num">Distance</th><th class="num">Cost</th><th>Status</th><th>Start</th><th></th></tr></thead>
      <tbody>${list.map((t) => {
        const v = Store.vehicleById(t.vehicleId); const d = Store.driverById(t.driverId);
        return `<tr>
          <td><strong>${t.origin}</strong> → <strong>${t.destination}</strong><br><span class="text-faint" style="font-size:11.5px">${t.purpose || ''}</span></td>
          <td>${v ? v.name : '—'}<br><span class="text-faint" style="font-size:11.5px">${d ? d.name : 'Unassigned'}</span></td>
          <td class="num mono">${t.distanceKm ? t.distanceKm + ' km' : '—'}</td>
          <td class="num mono">${fmtMoney(Store.totalTripCost(t))}</td>
          <td>${statusPill(t.status)}</td>
          <td class="mono text-dim">${fmtDateTime(t.startAt)}</td>
          <td><div class="row-actions">
            <button class="btn btn-sm btn-ghost" data-edit="${t.id}">${ICONS.edit}</button>
            <button class="btn btn-sm btn-ghost" data-del="${t.id}">${ICONS.trash}</button>
          </div></td>
        </tr>`;
      }).join('')}</tbody></table>`;
    wrap.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => tripForm(b.dataset.edit)));
    wrap.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
      const t = Store.get('trips', b.dataset.del);
      confirmDelete(`${t.origin} → ${t.destination}`, () => { Store.remove('trips', t.id); toast('Trip deleted'); renderTable(); renderTicker(); });
    }));
  }

  document.getElementById('trip-status-filter').addEventListener('change', renderTable);
  document.getElementById('btn-add-trip').addEventListener('click', () => tripForm());
  renderTable();

  function tripForm(id) {
    const editing = id ? Store.get('trips', id) : null;
    const vehicles = Store.data.vehicles, drivers = Store.data.drivers;
    const body = `
      <div id="trip-form-alert"></div>
      <div class="field-row">
        <div class="field"><label>Vehicle</label>
          <select id="f-vehicle"><option value="">Select vehicle</option>${vehicles.map((v) => `<option value="${v.id}" ${editing?.vehicleId === v.id ? 'selected' : ''}>${v.name} — ${v.plate}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Driver</label>
          <select id="f-driver"><option value="">Unassigned</option>${drivers.map((d) => `<option value="${d.id}" ${editing?.driverId === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select>
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label>Origin</label><input id="f-origin" value="${editing?.origin || ''}"></div>
        <div class="field"><label>Destination</label><input id="f-dest" value="${editing?.destination || ''}"></div>
      </div>
      <div class="field"><label>Purpose</label><input id="f-purpose" value="${editing?.purpose || ''}" placeholder="Delivery, inspection, freight…"></div>
      <div class="field-row">
        <div class="field"><label>Start</label><input id="f-start" type="datetime-local" value="${editing ? toLocalInput(editing.startAt) : toLocalInput(new Date().toISOString())}"></div>
        <div class="field"><label>End (est.)</label><input id="f-end" type="datetime-local" value="${editing ? toLocalInput(editing.endAt) : ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Distance (km)</label><input id="f-dist" type="number" value="${editing?.distanceKm || ''}"></div>
        <div class="field"><label>Status</label>
          <select id="f-status">${['scheduled', 'in_progress', 'completed', 'cancelled'].map((s) => `<option value="${s}" ${editing?.status === s ? 'selected' : ''}>${cap(s.replace('_', ' '))}</option>`).join('')}</select>
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label>Fuel used (L)</label><input id="f-fuel" type="number" value="${editing?.fuelUsedL ?? ''}"></div>
        <div class="field"><label>Fuel cost</label><input id="f-fuelcost" type="number" value="${editing?.fuelCost ?? ''}"></div>
      </div>
      <div class="field"><label>Other cost (tolls, fees)</label><input id="f-other" type="number" value="${editing?.otherCost ?? 0}"></div>
    `;
    openModal(editing ? 'Edit trip' : 'Log trip', body,
      `<button class="btn btn-ghost" id="cancel">Cancel</button><button class="btn btn-primary" id="save">${editing ? 'Save changes' : 'Log trip'}</button>`);

    function checkAdvisory() {
      const vehId = document.getElementById('f-vehicle').value;
      const drvId = document.getElementById('f-driver').value;
      const warnings = [];
      if (vehId) {
        const v = Store.vehicleById(vehId);
        if (v.status === 'maintenance') warnings.push(`${v.name} is currently marked as in maintenance.`);
        if (v.status === 'out_of_service') warnings.push(`${v.name} is marked out of service.`);
      }
      if (drvId) {
        const d = Store.driverById(drvId);
        const days = daysBetween(todayISO(), d.licenseExpiry);
        if (days < 0) warnings.push(`${d.name}'s licence has expired.`);
        else if (days <= 30) warnings.push(`${d.name}'s licence expires in ${days} day(s).`);
      }
      const alertBox = document.getElementById('trip-form-alert');
      alertBox.innerHTML = warnings.length ? `<div class="form-alert">${ICONS.alert}<div>${warnings.join('<br>')}</div></div>` : '';
    }
    document.getElementById('f-vehicle').addEventListener('change', checkAdvisory);
    document.getElementById('f-driver').addEventListener('change', checkAdvisory);
    checkAdvisory();

    document.getElementById('cancel').addEventListener('click', closeModal);
    document.getElementById('save').addEventListener('click', () => {
      const vehicleId = document.getElementById('f-vehicle').value;
      const origin = document.getElementById('f-origin').value.trim();
      const destination = document.getElementById('f-dest').value.trim();
      if (!vehicleId || !origin || !destination) { toast('Vehicle, origin and destination are required'); return; }
      const start = document.getElementById('f-start').value;
      const record = {
        vehicleId, driverId: document.getElementById('f-driver').value || null,
        origin, destination, purpose: document.getElementById('f-purpose').value.trim(),
        startAt: start ? new Date(start).toISOString() : new Date().toISOString(),
        endAt: document.getElementById('f-end').value ? new Date(document.getElementById('f-end').value).toISOString() : null,
        distanceKm: Number(document.getElementById('f-dist').value) || 0,
        status: document.getElementById('f-status').value,
        fuelUsedL: document.getElementById('f-fuel').value ? Number(document.getElementById('f-fuel').value) : null,
        fuelCost: document.getElementById('f-fuelcost').value ? Number(document.getElementById('f-fuelcost').value) : null,
        otherCost: Number(document.getElementById('f-other').value) || 0,
      };
      // if trip completed and distance given, roll odometer forward automatically
      if (editing) {
        Store.update('trips', editing.id, record);
      } else {
        Store.add('trips', record);
        if (record.status === 'completed' && record.distanceKm) {
          const v = Store.vehicleById(vehicleId);
          Store.update('vehicles', vehicleId, { odometer: Number(v.odometer) + Number(record.distanceKm) });
        }
      }
      toast(editing ? 'Trip updated' : 'Trip logged');
      closeModal(); renderTable(); renderTicker(); renderSidebar('trips');
    });
  }
}

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ============================================================  COSTING  ============================================================ */
function pageCosting(main) {
  pageHead(main, 'Finance', 'Costing', 'Every expense line, category breakdown and cost per vehicle.',
    `<button class="btn btn-primary" id="btn-add-expense">${ICONS.plus} Add expense</button>`);

  const kpis = document.createElement('div');
  kpis.className = 'kpi-grid';
  const cats = Store.costByCategory();
  const totalCost = Store.fleetTotalCost();
  kpis.innerHTML = `
    <div class="kpi-card"><div class="kpi-accent amber"></div><div class="kpi-label">Total spend</div><div class="kpi-value mono">${fmtMoney(totalCost)}</div></div>
    <div class="kpi-card"><div class="kpi-accent teal"></div><div class="kpi-label">Fuel</div><div class="kpi-value mono">${fmtMoney(cats.fuel)}</div></div>
    <div class="kpi-card"><div class="kpi-accent red"></div><div class="kpi-label">Maintenance</div><div class="kpi-value mono">${fmtMoney(cats.maintenance)}</div></div>
    <div class="kpi-card"><div class="kpi-accent green"></div><div class="kpi-label">Avg cost / km</div><div class="kpi-value mono">${fmtMoney(Store.fleetAvgCostPerKm())}</div></div>
  `;
  main.appendChild(kpis);

  const grid = document.createElement('div');
  grid.className = 'grid-2';
  grid.innerHTML = `
    <div class="panel">
      <div class="panel-head"><h3>Cost by vehicle</h3><span class="hint">total, incl. trip fuel</span></div>
      <div class="chart-box"><canvas id="chart-cost-by-vehicle"></canvas></div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Cost by category</h3></div>
      <div class="chart-box"><canvas id="chart-cost-by-cat"></canvas></div>
    </div>
  `;
  main.appendChild(grid);

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `<div class="panel-head"><h3>Expense log</h3><span class="hint">manual entries — trip fuel is logged from Trips</span></div><div class="table-wrap" id="exp-table-wrap"></div>`;
  main.appendChild(panel);

  function renderTable() {
    const list = [...Store.data.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    const wrap = document.getElementById('exp-table-wrap');
    if (!list.length) { wrap.innerHTML = emptyStateHtml('No expenses logged', 'Add fuel, insurance, tolls, fines or other costs here.'); return; }
    wrap.innerHTML = `<table>
      <thead><tr><th>Date</th><th>Vehicle</th><th>Category</th><th>Note</th><th class="num">Amount</th><th></th></tr></thead>
      <tbody>${list.map((e) => {
        const v = Store.vehicleById(e.vehicleId);
        return `<tr>
          <td class="mono text-dim">${fmtDate(e.date)}</td>
          <td>${v ? v.name : '—'}</td>
          <td>${categoryPill(e.category)}</td>
          <td class="text-dim">${e.note || ''}</td>
          <td class="num mono">${fmtMoney(e.amount)}</td>
          <td><div class="row-actions">
            <button class="btn btn-sm btn-ghost" data-edit="${e.id}">${ICONS.edit}</button>
            <button class="btn btn-sm btn-ghost" data-del="${e.id}">${ICONS.trash}</button>
          </div></td>
        </tr>`;
      }).join('')}</tbody></table>`;
    wrap.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => expenseForm(b.dataset.edit)));
    wrap.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
      const e = Store.get('expenses', b.dataset.del);
      confirmDelete(e.note || e.category, () => { Store.remove('expenses', e.id); toast('Expense deleted'); renderTable(); renderCharts(); });
    }));
  }

  function renderCharts() {
    destroyCharts(['cost-by-vehicle', 'cost-by-cat']);
    const byVeh = Store.data.vehicles.map((v) => ({ name: v.name, cost: Store.vehicleTotalCost(v.id) })).sort((a, b) => b.cost - a.cost);
    charts['cost-by-vehicle'] = new Chart(document.getElementById('chart-cost-by-vehicle'), {
      type: 'bar',
      data: { labels: byVeh.map((v) => v.name), datasets: [{ label: 'Total cost', data: byVeh.map((v) => Math.round(v.cost)), backgroundColor: CHART_COLORS.teal, borderRadius: 4 }] },
      options: chartBaseOptions({ plugins: { legend: { display: false } } }),
    });
    const catData = Store.costByCategory();
    const labels = Object.keys(catData).filter((k) => catData[k] > 0);
    charts['cost-by-cat'] = new Chart(document.getElementById('chart-cost-by-cat'), {
      type: 'pie',
      data: {
        labels: labels.map(cap),
        datasets: [{ data: labels.map((k) => Math.round(catData[k])), backgroundColor: [CHART_COLORS.amber, CHART_COLORS.teal, CHART_COLORS.red, CHART_COLORS.green, '#7a8ea3', '#c48ae0'], borderColor: '#1a222b', borderWidth: 3 }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: CHART_COLORS.text, font: { family: 'Inter', size: 11 }, padding: 12 } } } },
    });
  }

  document.getElementById('btn-add-expense').addEventListener('click', () => expenseForm());
  renderTable(); renderCharts();

  function expenseForm(id) {
    const editing = id ? Store.get('expenses', id) : null;
    const vehicles = Store.data.vehicles;
    const body = `
      <div class="field-row">
        <div class="field"><label>Vehicle</label><select id="f-vehicle">${vehicles.map((v) => `<option value="${v.id}" ${editing?.vehicleId === v.id ? 'selected' : ''}>${v.name}</option>`).join('')}</select></div>
        <div class="field"><label>Category</label>
          <select id="f-cat">${['fuel', 'maintenance', 'insurance', 'toll', 'fine', 'other'].map((c) => `<option value="${c}" ${editing?.category === c ? 'selected' : ''}>${cap(c)}</option>`).join('')}</select>
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label>Amount</label><input id="f-amt" type="number" value="${editing?.amount || ''}"></div>
        <div class="field"><label>Date</label><input id="f-date" type="date" value="${editing?.date || todayISO()}"></div>
      </div>
      <div class="field"><label>Note</label><input id="f-note" value="${editing?.note || ''}"></div>
    `;
    openModal(editing ? 'Edit expense' : 'Add expense', body,
      `<button class="btn btn-ghost" id="cancel">Cancel</button><button class="btn btn-primary" id="save">${editing ? 'Save changes' : 'Add expense'}</button>`);
    document.getElementById('cancel').addEventListener('click', closeModal);
    document.getElementById('save').addEventListener('click', () => {
      const amount = Number(document.getElementById('f-amt').value);
      if (!amount) { toast('Enter an amount'); return; }
      const record = { vehicleId: document.getElementById('f-vehicle').value, category: document.getElementById('f-cat').value, amount, date: document.getElementById('f-date').value, note: document.getElementById('f-note').value.trim() };
      if (editing) Store.update('expenses', editing.id, record); else Store.add('expenses', record);
      toast(editing ? 'Expense updated' : 'Expense added');
      closeModal(); renderTable(); renderCharts();
    });
  }
}

/* ============================================================  MAINTENANCE  ============================================================ */
function pageMaintenance(main) {
  pageHead(main, 'Finance', 'Maintenance', 'Service history and AI-predicted upcoming service windows.',
    `<button class="btn btn-primary" id="btn-add-maint">${ICONS.plus} Log service</button>`);

  const predictions = AIEngine.maintenanceInsights();
  const panel1 = document.createElement('div');
  panel1.className = 'panel';
  panel1.innerHTML = `<div class="panel-head"><h3>Predicted service needs</h3><span class="hint">auto-calculated from odometer + interval</span></div>
    ${predictions.length ? predictions.map(insightCardHtml).join('') : emptyStateHtml('Nothing due', 'No vehicles are within range of their next service interval.')}`;
  main.appendChild(panel1);

  const panel2 = document.createElement('div');
  panel2.className = 'panel';
  panel2.innerHTML = `<div class="panel-head"><h3>Service history</h3></div><div class="table-wrap" id="mnt-table-wrap"></div>`;
  main.appendChild(panel2);

  function renderTable() {
    const list = [...Store.data.maintenanceRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    const wrap = document.getElementById('mnt-table-wrap');
    if (!list.length) { wrap.innerHTML = emptyStateHtml('No service history', 'Log completed maintenance to build a history and improve predictions.'); return; }
    wrap.innerHTML = `<table>
      <thead><tr><th>Date</th><th>Vehicle</th><th>Type</th><th class="num">Odometer</th><th class="num">Cost</th><th>Next due</th><th></th></tr></thead>
      <tbody>${list.map((m) => {
        const v = Store.vehicleById(m.vehicleId);
        return `<tr>
          <td class="mono text-dim">${fmtDate(m.date)}</td>
          <td>${v ? v.name : '—'}</td>
          <td>${m.type}</td>
          <td class="num mono">${Number(m.odometer).toLocaleString()} km</td>
          <td class="num mono">${fmtMoney(m.cost)}</td>
          <td class="text-dim">${fmtDate(m.nextDueDate)} ${m.nextDueOdometer ? `/ ${Number(m.nextDueOdometer).toLocaleString()} km` : ''}</td>
          <td><div class="row-actions"><button class="btn btn-sm btn-ghost" data-del="${m.id}">${ICONS.trash}</button></div></td>
        </tr>`;
      }).join('')}</tbody></table>`;
    wrap.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
      const m = Store.get('maintenanceRecords', b.dataset.del);
      confirmDelete(m.type, () => { Store.remove('maintenanceRecords', m.id); toast('Record deleted'); renderTable(); });
    }));
  }
  renderTable();

  document.getElementById('btn-add-maint').addEventListener('click', () => {
    const vehicles = Store.data.vehicles;
    const body = `
      <div class="field-row">
        <div class="field"><label>Vehicle</label><select id="f-vehicle">${vehicles.map((v) => `<option value="${v.id}">${v.name}</option>`).join('')}</select></div>
        <div class="field"><label>Service type</label><input id="f-type" placeholder="Full service, brakes, tyres…"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Date</label><input id="f-date" type="date" value="${todayISO()}"></div>
        <div class="field"><label>Odometer at service</label><input id="f-odo" type="number"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Cost</label><input id="f-cost" type="number"></div>
        <div class="field"><label>Next due (date)</label><input id="f-next-date" type="date"></div>
      </div>
      <div class="field"><label>Note</label><input id="f-note"></div>
    `;
    openModal('Log service', body, `<button class="btn btn-ghost" id="cancel">Cancel</button><button class="btn btn-primary" id="save">Log service</button>`);
    document.getElementById('cancel').addEventListener('click', closeModal);
    document.getElementById('save').addEventListener('click', () => {
      const vehicleId = document.getElementById('f-vehicle').value;
      const odometer = Number(document.getElementById('f-odo').value) || 0;
      const v = Store.vehicleById(vehicleId);
      const record = {
        vehicleId, type: document.getElementById('f-type').value.trim() || 'Service', date: document.getElementById('f-date').value,
        odometer, cost: Number(document.getElementById('f-cost').value) || 0,
        note: document.getElementById('f-note').value.trim(),
        nextDueDate: document.getElementById('f-next-date').value || null,
        nextDueOdometer: v ? odometer + Number(v.serviceIntervalKm || 0) : null,
      };
      Store.add('maintenanceRecords', record);
      if (v) Store.update('vehicles', vehicleId, { lastServiceDate: record.date, lastServiceOdometer: odometer });
      toast('Service logged');
      closeModal(); navigate();
    });
  });
}

/* ============================================================  AI INSIGHTS  ============================================================ */
function pageAI(main) {
  pageHead(main, 'Automation', 'AI Insights', 'Fleetline continuously scans costs, maintenance, licences and utilisation for risk — no external API required.');

  const insights = AIEngine.run();
  const counts = { critical: insights.filter((i) => i.severity === 'critical').length, warning: insights.filter((i) => i.severity === 'warning').length, info: insights.filter((i) => i.severity === 'info').length };

  const kpis = document.createElement('div');
  kpis.className = 'kpi-grid';
  kpis.innerHTML = `
    <div class="kpi-card"><div class="kpi-accent red"></div><div class="kpi-label">Critical</div><div class="kpi-value mono">${counts.critical}</div></div>
    <div class="kpi-card"><div class="kpi-accent amber"></div><div class="kpi-label">Warning</div><div class="kpi-value mono">${counts.warning}</div></div>
    <div class="kpi-card"><div class="kpi-accent teal"></div><div class="kpi-label">Informational</div><div class="kpi-value mono">${counts.info}</div></div>
    <div class="kpi-card"><div class="kpi-accent green"></div><div class="kpi-label">Total signals</div><div class="kpi-value mono">${insights.length}</div></div>
  `;
  main.appendChild(kpis);

  const grid = document.createElement('div');
  grid.className = 'grid-2';
  grid.innerHTML = `
    <div class="panel">
      <div class="panel-head"><h3>All insights</h3><span class="hint">sorted by severity</span></div>
      <div id="ai-list">${insights.length ? insights.map(insightCardHtml).join('') : emptyStateHtml('All clear', 'No risks detected across the fleet right now.')}</div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Ask the fleet</h3><span class="hint">instant, offline Q&amp;A over your live data</span></div>
      <div class="assistant-log" id="assistant-log"></div>
      <div class="assistant-suggestions">
        <button data-q="which vehicle costs the most?">Most expensive vehicle</button>
        <button data-q="what's due for maintenance?">Maintenance due</button>
        <button data-q="whose licence expires soonest?">Licence risk</button>
        <button data-q="what's the spend forecast?">Spend forecast</button>
      </div>
      <div class="assistant-input-row">
        <input type="text" id="assistant-input" placeholder="Ask about costs, maintenance, licences…">
        <button class="btn btn-primary" id="assistant-send">Ask</button>
      </div>
    </div>
  `;
  main.appendChild(grid);

  const log = grid.querySelector('#assistant-log');
  function pushMsg(role, text) {
    const div = document.createElement('div');
    div.className = `assistant-msg ${role}`;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }
  pushMsg('bot', "Ask me things like \"which vehicle costs the most\" or \"what's due for maintenance\" — I read straight from your fleet data.");

  function ask(q) {
    if (!q.trim()) return;
    pushMsg('user', q);
    setTimeout(() => pushMsg('bot', AIEngine.ask(q)), 200);
  }
  grid.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => ask(b.dataset.q)));
  grid.querySelector('#assistant-send').addEventListener('click', () => {
    const input = grid.querySelector('#assistant-input');
    ask(input.value); input.value = '';
  });
  grid.querySelector('#assistant-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const input = e.target; ask(input.value); input.value = ''; }
  });
}

/* ============================================================  REPORTS  ============================================================ */
function pageReports(main) {
  pageHead(main, 'Automation', 'Reports', 'Export fleet data as CSV for accounting, audits or board packs.');

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="panel-head"><h3>Export center</h3></div>
    <div class="grid-2-even">
      ${reportCardHtml('vehicle-summary', 'Vehicle cost summary', 'One row per vehicle: total cost, distance, cost/km, status.')}
      ${reportCardHtml('trip-log', 'Trip log', 'Every trip with route, distance, driver and cost.')}
      ${reportCardHtml('expense-log', 'Expense log', 'All manual expense entries by category.')}
      ${reportCardHtml('maintenance-log', 'Maintenance history', 'Service records with cost and next due date.')}
    </div>
  `;
  main.appendChild(panel);

  const monthlyPanel = document.createElement('div');
  monthlyPanel.className = 'panel';
  monthlyPanel.innerHTML = `<div class="panel-head"><h3>Monthly spend (last 12 months)</h3></div><div class="chart-box"><canvas id="chart-annual"></canvas></div>`;
  main.appendChild(monthlyPanel);

  destroyCharts(['annual']);
  const months = Store.costByMonth(12);
  charts['annual'] = new Chart(document.getElementById('chart-annual'), {
    type: 'bar',
    data: { labels: months.map((m) => m.label), datasets: [{ label: 'Spend', data: months.map((m) => Math.round(m.total)), backgroundColor: CHART_COLORS.amber, borderRadius: 4 }] },
    options: chartBaseOptions({ plugins: { legend: { display: false } } }),
  });

  panel.querySelectorAll('[data-report]').forEach((btn) => {
    btn.addEventListener('click', () => runReport(btn.dataset.report));
  });
}

function reportCardHtml(id, title, desc) {
  return `<div class="panel" style="margin-bottom:0;">
    <h3 style="font-size:13.5px; text-transform:none; font-family:var(--font-body); font-weight:600; margin-bottom:6px;">${title}</h3>
    <p class="text-dim" style="font-size:12.5px; margin:0 0 14px;">${desc}</p>
    <button class="btn btn-sm" data-report="${id}">${ICONS.download} Download CSV</button>
  </div>`;
}

function runReport(kind) {
  if (kind === 'vehicle-summary') {
    const rows = [['Unit', 'Plate', 'Type', 'Status', 'Odometer (km)', 'Distance logged (km)', 'Total cost', 'Cost per km']];
    Store.data.vehicles.forEach((v) => rows.push([v.name, v.plate, v.type, v.status, v.odometer, Store.vehicleTotalDistance(v.id), Store.vehicleTotalCost(v.id).toFixed(2), Store.vehicleCostPerKm(v.id).toFixed(2)]));
    csvDownload('fleetline-vehicle-summary.csv', rows);
  }
  if (kind === 'trip-log') {
    const rows = [['Origin', 'Destination', 'Vehicle', 'Driver', 'Distance (km)', 'Status', 'Start', 'End', 'Fuel used (L)', 'Fuel cost', 'Other cost', 'Total cost']];
    Store.data.trips.forEach((t) => rows.push([t.origin, t.destination, Store.vehicleById(t.vehicleId)?.name || '', Store.driverById(t.driverId)?.name || '', t.distanceKm, t.status, t.startAt, t.endAt, t.fuelUsedL, t.fuelCost, t.otherCost, Store.totalTripCost(t).toFixed(2)]));
    csvDownload('fleetline-trip-log.csv', rows);
  }
  if (kind === 'expense-log') {
    const rows = [['Date', 'Vehicle', 'Category', 'Amount', 'Note']];
    Store.data.expenses.forEach((e) => rows.push([e.date, Store.vehicleById(e.vehicleId)?.name || '', e.category, e.amount, e.note]));
    csvDownload('fleetline-expense-log.csv', rows);
  }
  if (kind === 'maintenance-log') {
    const rows = [['Date', 'Vehicle', 'Type', 'Odometer', 'Cost', 'Next due date', 'Next due odometer', 'Note']];
    Store.data.maintenanceRecords.forEach((m) => rows.push([m.date, Store.vehicleById(m.vehicleId)?.name || '', m.type, m.odometer, m.cost, m.nextDueDate, m.nextDueOdometer, m.note]));
    csvDownload('fleetline-maintenance-log.csv', rows);
  }
  toast('CSV downloaded');
}

/* ---------------------------------------------------------- boot ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  navigate();
});
