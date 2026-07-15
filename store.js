/* ============================================================
   FLEETLINE — DATA STORE
   A tiny localStorage-backed "database" for the whole app.
   No backend required — everything lives in the browser.
   ============================================================ */

const DB_KEY = 'fleetline_v1';

const uid = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const todayISO = () => new Date().toISOString().slice(0, 10);

function daysBetween(a, b) {
  const MS = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b) - new Date(a)) / MS);
}

/* ---------- seed data (so the board isn't empty on first load) ---------- */
function seedData() {
  const now = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const daysAgo = (n) => { const d = new Date(now); d.setDate(d.getDate() - n); return iso(d); };
  const daysFromNow = (n) => { const d = new Date(now); d.setDate(d.getDate() + n); return iso(d); };
  const hoursFromNow = (n) => { const d = new Date(now); d.setHours(d.getHours() + n); return d.toISOString(); };
  const hoursAgo = (n) => { const d = new Date(now); d.setHours(d.getHours() - n); return d.toISOString(); };

  const vehicles = [
    { id: 'veh_1', name: 'Unit 01', plate: 'CA 123-456', make: 'Isuzu', model: 'NPR 400', year: 2021, type: 'Box Truck', status: 'active', odometer: 84250, fuelType: 'Diesel', purchaseDate: '2021-03-14', assignedDriverId: 'drv_1', serviceIntervalKm: 10000, serviceIntervalMonths: 6, lastServiceDate: daysAgo(150), lastServiceOdometer: 75200 },
    { id: 'veh_2', name: 'Unit 02', plate: 'CA 552-981', make: 'Toyota', model: 'Hilux 2.8 GD-6', year: 2022, type: 'Pickup', status: 'active', odometer: 41230, fuelType: 'Diesel', purchaseDate: '2022-07-02', assignedDriverId: 'drv_2', serviceIntervalKm: 15000, serviceIntervalMonths: 6, lastServiceDate: daysAgo(40), lastServiceOdometer: 38900 },
    { id: 'veh_3', name: 'Unit 03', plate: 'CA 771-204', make: 'Mercedes-Benz', model: 'Sprinter 316', year: 2020, type: 'Van', status: 'maintenance', odometer: 102340, fuelType: 'Diesel', purchaseDate: '2020-01-20', assignedDriverId: null, serviceIntervalKm: 12000, serviceIntervalMonths: 6, lastServiceDate: daysAgo(10), lastServiceOdometer: 102000 },
    { id: 'veh_4', name: 'Unit 04', plate: 'CA 340-119', make: 'Ford', model: 'Ranger 3.2', year: 2023, type: 'Pickup', status: 'idle', odometer: 15870, fuelType: 'Diesel', purchaseDate: '2023-05-11', assignedDriverId: 'drv_4', serviceIntervalKm: 15000, serviceIntervalMonths: 6, lastServiceDate: daysAgo(200), lastServiceOdometer: 4200 },
    { id: 'veh_5', name: 'Unit 05', plate: 'CA 889-330', make: 'Isuzu', model: 'FTR 850', year: 2019, type: 'Flatbed', status: 'active', odometer: 156400, fuelType: 'Diesel', purchaseDate: '2019-09-08', assignedDriverId: 'drv_3', serviceIntervalKm: 10000, serviceIntervalMonths: 4, lastServiceDate: daysAgo(115), lastServiceOdometer: 148900 },
  ];

  const drivers = [
    { id: 'drv_1', name: 'Sipho Nkosi', licenseNo: 'CD84213', licenseClass: 'C1', licenseExpiry: daysFromNow(240), phone: '082 511 2093', email: 'sipho.n@fleetline.local', status: 'active', assignedVehicleId: 'veh_1' },
    { id: 'drv_2', name: 'Amahle Dlamini', licenseNo: 'CD91120', licenseClass: 'EB', licenseExpiry: daysFromNow(18), phone: '073 220 5541', email: 'amahle.d@fleetline.local', status: 'active', assignedVehicleId: 'veh_2' },
    { id: 'drv_3', name: 'Johan van der Merwe', licenseNo: 'CD77045', licenseClass: 'C1', licenseExpiry: daysFromNow(410), phone: '084 902 7761', email: 'johan.v@fleetline.local', status: 'active', assignedVehicleId: 'veh_5' },
    { id: 'drv_4', name: 'Lindiwe Zulu', licenseNo: 'CD65321', licenseClass: 'EB', licenseExpiry: daysFromNow(-6), phone: '071 334 8820', email: 'lindiwe.z@fleetline.local', status: 'active', assignedVehicleId: 'veh_4' },
  ];

  const trips = [
    { id: 'trp_1', vehicleId: 'veh_1', driverId: 'drv_1', origin: 'Cape Town Depot', destination: 'Paarl DC', distanceKm: 62, startAt: hoursAgo(2), endAt: hoursFromNow(1), purpose: 'Scheduled delivery', status: 'in_progress', fuelUsedL: null, fuelCost: null, otherCost: 0 },
    { id: 'trp_2', vehicleId: 'veh_2', driverId: 'drv_2', origin: 'Bellville Yard', destination: 'Stellenbosch', distanceKm: 45, startAt: hoursFromNow(3), endAt: hoursFromNow(6), purpose: 'Site inspection', status: 'scheduled', fuelUsedL: null, fuelCost: null, otherCost: 0 },
    { id: 'trp_3', vehicleId: 'veh_5', driverId: 'drv_3', origin: 'Cape Town Depot', destination: 'George', distanceKm: 430, startAt: hoursAgo(30), endAt: hoursAgo(23), purpose: 'Long-haul freight', status: 'completed', fuelUsedL: 96, fuelCost: 2208, otherCost: 340 },
    { id: 'trp_4', vehicleId: 'veh_1', driverId: 'drv_1', origin: 'Paarl DC', destination: 'Cape Town Depot', distanceKm: 60, startAt: hoursAgo(50), endAt: hoursAgo(48), purpose: 'Return trip', status: 'completed', fuelUsedL: 12, fuelCost: 276, otherCost: 0 },
    { id: 'trp_5', vehicleId: 'veh_4', driverId: 'drv_4', origin: 'Bellville Yard', destination: 'Wellington', distanceKm: 75, startAt: hoursAgo(400), endAt: hoursAgo(398), purpose: 'Equipment drop-off', status: 'completed', fuelUsedL: 14, fuelCost: 322, otherCost: 0 },
    { id: 'trp_6', vehicleId: 'veh_5', driverId: 'drv_3', origin: 'Cape Town Depot', destination: 'Mossel Bay', distanceKm: 390, startAt: hoursAgo(200), endAt: hoursAgo(190), purpose: 'Long-haul freight', status: 'completed', fuelUsedL: 88, fuelCost: 2024, otherCost: 410 },
    { id: 'trp_7', vehicleId: 'veh_3', driverId: null, origin: 'Bellville Yard', destination: 'Workshop', distanceKm: 8, startAt: hoursAgo(240), endAt: hoursAgo(239), purpose: 'Transport to workshop', status: 'completed', fuelUsedL: 2, fuelCost: 46, otherCost: 0 },
  ];

  const expenses = [
    { id: 'exp_1', vehicleId: 'veh_1', category: 'fuel', amount: 3120, date: daysAgo(3), note: 'Diesel top-up — Engen Paarl' },
    { id: 'exp_2', vehicleId: 'veh_5', category: 'fuel', amount: 4232, date: daysAgo(9), note: 'Diesel — Sasol N2' },
    { id: 'exp_3', vehicleId: 'veh_3', category: 'maintenance', amount: 8600, date: daysAgo(9), note: 'Gearbox repair' },
    { id: 'exp_4', vehicleId: 'veh_2', category: 'insurance', amount: 1450, date: daysAgo(15), note: 'Monthly premium' },
    { id: 'exp_5', vehicleId: 'veh_1', category: 'toll', amount: 186, note: 'N1 toll gates', date: daysAgo(4) },
    { id: 'exp_6', vehicleId: 'veh_4', category: 'fine', amount: 750, date: daysAgo(21), note: 'Speeding — R102' },
    { id: 'exp_7', vehicleId: 'veh_5', category: 'maintenance', amount: 2100, date: daysAgo(30), note: 'Brake pads + inspection' },
    { id: 'exp_8', vehicleId: 'veh_1', category: 'insurance', amount: 1620, date: daysAgo(15), note: 'Monthly premium' },
    { id: 'exp_9', vehicleId: 'veh_2', category: 'fuel', amount: 2870, date: daysAgo(18), note: 'Diesel top-up' },
    { id: 'exp_10', vehicleId: 'veh_5', category: 'fuel', amount: 3960, date: daysAgo(40), note: 'Diesel — long haul' },
    { id: 'exp_11', vehicleId: 'veh_3', category: 'insurance', amount: 1710, date: daysAgo(45), note: 'Monthly premium' },
    { id: 'exp_12', vehicleId: 'veh_4', category: 'insurance', amount: 1390, date: daysAgo(45), note: 'Monthly premium' },
  ];

  const maintenanceRecords = [
    { id: 'mnt_1', vehicleId: 'veh_3', type: 'Gearbox repair', date: daysAgo(9), odometer: 102000, cost: 8600, note: 'Clutch + gearbox seal replaced', nextDueOdometer: 114000, nextDueDate: daysFromNow(170) },
    { id: 'mnt_2', vehicleId: 'veh_5', type: 'Brake service', date: daysAgo(30), odometer: 148900, cost: 2100, note: 'Front pads, disc skim', nextDueOdometer: 158900, nextDueDate: daysFromNow(90) },
    { id: 'mnt_3', vehicleId: 'veh_1', type: 'Full service', date: daysAgo(150), odometer: 75200, cost: 3400, note: 'Oil, filters, general check', nextDueOdometer: 85200, nextDueDate: daysFromNow(-10) },
  ];

  return { vehicles, drivers, trips, expenses, maintenanceRecords, settings: { fleetName: 'Fleetline Ops', currency: 'R' } };
}

/* ---------- store ---------- */
const Store = {
  data: null,

  load() {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      try { this.data = JSON.parse(raw); return this.data; } catch (e) { /* fall through to reseed */ }
    }
    this.data = seedData();
    this.save();
    return this.data;
  },

  save() {
    localStorage.setItem(DB_KEY, JSON.stringify(this.data));
  },

  reset() {
    this.data = seedData();
    this.save();
  },

  wipe() {
    this.data = { vehicles: [], drivers: [], trips: [], expenses: [], maintenanceRecords: [], settings: this.data.settings };
    this.save();
  },

  /* generic CRUD helpers */
  add(collection, record) {
    const item = { id: uid(collection.slice(0, 3)), ...record };
    this.data[collection].push(item);
    this.save();
    return item;
  },
  update(collection, id, patch) {
    const idx = this.data[collection].findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data[collection][idx] = { ...this.data[collection][idx], ...patch };
    this.save();
    return this.data[collection][idx];
  },
  remove(collection, id) {
    this.data[collection] = this.data[collection].filter((r) => r.id !== id);
    this.save();
  },
  get(collection, id) {
    return this.data[collection].find((r) => r.id === id) || null;
  },

  /* ---------- derived / computed helpers used across views ---------- */
  vehicleById(id) { return this.get('vehicles', id); },
  driverById(id) { return this.get('drivers', id); },

  tripsForVehicle(vehicleId) { return this.data.trips.filter((t) => t.vehicleId === vehicleId); },
  expensesForVehicle(vehicleId) { return this.data.expenses.filter((e) => e.vehicleId === vehicleId); },

  totalTripCost(trip) {
    return (Number(trip.fuelCost) || 0) + (Number(trip.otherCost) || 0);
  },

  vehicleTotalCost(vehicleId) {
    const exp = this.expensesForVehicle(vehicleId).reduce((s, e) => s + Number(e.amount || 0), 0);
    const trips = this.tripsForVehicle(vehicleId).reduce((s, t) => s + this.totalTripCost(t), 0);
    return exp + trips;
  },

  vehicleTotalDistance(vehicleId) {
    return this.tripsForVehicle(vehicleId)
      .filter((t) => t.status === 'completed')
      .reduce((s, t) => s + Number(t.distanceKm || 0), 0);
  },

  vehicleCostPerKm(vehicleId) {
    const dist = this.vehicleTotalDistance(vehicleId);
    if (!dist) return 0;
    return this.vehicleTotalCost(vehicleId) / dist;
  },

  fleetTotalCost() {
    const exp = this.data.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const trips = this.data.trips.reduce((s, t) => s + this.totalTripCost(t), 0);
    return exp + trips;
  },

  fleetTotalDistance() {
    return this.data.trips.filter((t) => t.status === 'completed').reduce((s, t) => s + Number(t.distanceKm || 0), 0);
  },

  fleetAvgCostPerKm() {
    const dist = this.fleetTotalDistance();
    if (!dist) return 0;
    return this.fleetTotalCost() / dist;
  },

  costByCategory() {
    const cats = {};
    this.data.expenses.forEach((e) => { cats[e.category] = (cats[e.category] || 0) + Number(e.amount || 0); });
    const fuelFromTrips = this.data.trips.reduce((s, t) => s + (Number(t.fuelCost) || 0), 0);
    cats.fuel = (cats.fuel || 0) + fuelFromTrips;
    const otherFromTrips = this.data.trips.reduce((s, t) => s + (Number(t.otherCost) || 0), 0);
    cats.other = (cats.other || 0) + otherFromTrips;
    return cats;
  },

  costByMonth(monthsBack = 6) {
    const buckets = [];
    const now = new Date();
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth(), total: 0 });
    }
    const addTo = (dateStr, amount) => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      const b = buckets.find((x) => x.year === d.getFullYear() && x.month === d.getMonth());
      if (b) b.total += amount;
    };
    this.data.expenses.forEach((e) => addTo(e.date, Number(e.amount || 0)));
    this.data.trips.forEach((t) => addTo(t.startAt, this.totalTripCost(t)));
    return buckets;
  },

  fleetStatusCounts() {
    const counts = { active: 0, idle: 0, maintenance: 0, out_of_service: 0 };
    this.data.vehicles.forEach((v) => { counts[v.status] = (counts[v.status] || 0) + 1; });
    return counts;
  },

  activeAndUpcomingTrips() {
    return this.data.trips
      .filter((t) => t.status === 'in_progress' || t.status === 'scheduled')
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  },

  kmSinceService(vehicle) {
    return Math.max(0, Number(vehicle.odometer || 0) - Number(vehicle.lastServiceOdometer || 0));
  },
  daysSinceService(vehicle) {
    if (!vehicle.lastServiceDate) return null;
    return daysBetween(vehicle.lastServiceDate, todayISO());
  },
};

Store.load();
