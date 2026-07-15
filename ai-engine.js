/* ============================================================
   FLEETLINE — AUTOMATION / "AI" ENGINE
   A deterministic rules-and-statistics engine that watches the
   fleet data and produces insights: predictive maintenance,
   cost anomalies, licence risk, idle-asset detection and a
   simple month-ahead spend forecast. Runs 100% client-side —
   no external API, no key, no server required.

   Why rule-based, not a hosted LLM: this project ships as a
   static site on GitHub Pages with no backend, and a real LLM
   call from the browser would either expose an API key or be
   blocked by CORS. See README "Wiring in a real LLM" for how
   to add one behind a small serverless proxy if you want true
   generative summaries on top of this engine.
   ============================================================ */

const AIEngine = {

  /* main entry point — returns a sorted array of insight objects */
  run() {
    const insights = [
      ...this.maintenanceInsights(),
      ...this.licenceInsights(),
      ...this.costAnomalyInsights(),
      ...this.fuelEfficiencyInsights(),
      ...this.utilizationInsights(),
      ...this.forecastInsight(),
    ];
    const weight = { critical: 0, warning: 1, info: 2 };
    return insights.sort((a, b) => weight[a.severity] - weight[b.severity]);
  },

  /* 1. predictive maintenance — km/time remaining vs. service interval */
  maintenanceInsights() {
    const out = [];
    Store.data.vehicles.forEach((v) => {
      if (!v.lastServiceOdometer || !v.serviceIntervalKm) return;
      const kmSince = Store.kmSinceService(v);
      const kmRemaining = v.serviceIntervalKm - kmSince;
      const daysSince = Store.daysSinceService(v) ?? 0;
      const daysRemaining = (v.serviceIntervalMonths || 6) * 30 - daysSince;

      const overdue = kmRemaining <= 0 || daysRemaining <= 0;
      const dueSoon = !overdue && (kmRemaining <= v.serviceIntervalKm * 0.1 || daysRemaining <= 14);

      if (overdue) {
        out.push({
          id: `mnt-${v.id}`, severity: 'critical', category: 'Maintenance',
          title: `${v.name} is overdue for service`,
          message: `${v.name} (${v.plate}) has covered ${kmSince.toLocaleString()} km since its last service — ${Math.abs(kmRemaining).toLocaleString()} km past the ${v.serviceIntervalKm.toLocaleString()} km interval. Book a service before its next dispatch.`,
          entityType: 'vehicle', entityId: v.id,
        });
      } else if (dueSoon) {
        out.push({
          id: `mnt-${v.id}`, severity: 'warning', category: 'Maintenance',
          title: `${v.name} is due for service soon`,
          message: `${v.name} (${v.plate}) has about ${Math.max(kmRemaining, 0).toLocaleString()} km or ${Math.max(daysRemaining, 0)} days left before its next scheduled service.`,
          entityType: 'vehicle', entityId: v.id,
        });
      }
    });
    return out;
  },

  /* 2. driver licence expiry */
  licenceInsights() {
    const out = [];
    Store.data.drivers.forEach((d) => {
      if (!d.licenseExpiry) return;
      const days = daysBetween(todayISO(), d.licenseExpiry);
      if (days < 0) {
        out.push({
          id: `lic-${d.id}`, severity: 'critical', category: 'Compliance',
          title: `${d.name}'s licence has expired`,
          message: `${d.name}'s ${d.licenseClass} licence expired ${Math.abs(days)} day(s) ago. Reassign trips until it's renewed.`,
          entityType: 'driver', entityId: d.id,
        });
      } else if (days <= 30) {
        out.push({
          id: `lic-${d.id}`, severity: 'warning', category: 'Compliance',
          title: `${d.name}'s licence expires soon`,
          message: `${d.name}'s ${d.licenseClass} licence expires in ${days} day(s), on ${d.licenseExpiry}. Schedule a renewal reminder.`,
          entityType: 'driver', entityId: d.id,
        });
      }
    });
    return out;
  },

  /* 3. cost-per-km outliers vs fleet average */
  costAnomalyInsights() {
    const out = [];
    const avg = Store.fleetAvgCostPerKm();
    if (!avg) return out;
    Store.data.vehicles.forEach((v) => {
      const dist = Store.vehicleTotalDistance(v.id);
      if (dist < 30) return; // not enough data yet
      const cpk = Store.vehicleCostPerKm(v.id);
      if (cpk > avg * 1.3) {
        out.push({
          id: `cost-${v.id}`, severity: 'warning', category: 'Costing',
          title: `${v.name} costs more per km than the fleet average`,
          message: `${v.name} runs at ${Store.data.settings.currency}${cpk.toFixed(2)}/km vs a fleet average of ${Store.data.settings.currency}${avg.toFixed(2)}/km — ${Math.round((cpk / avg - 1) * 100)}% higher. Check for excess idling, fuel loss, or overdue maintenance driving up cost.`,
          entityType: 'vehicle', entityId: v.id,
        });
      }
    });
    return out;
  },

  /* 4. fuel efficiency outliers (L/100km) from completed trips with fuel logged */
  fuelEfficiencyInsights() {
    const out = [];
    const perVehicle = {};
    Store.data.trips.forEach((t) => {
      if (t.status !== 'completed' || !t.fuelUsedL || !t.distanceKm) return;
      perVehicle[t.vehicleId] = perVehicle[t.vehicleId] || { l: 0, km: 0 };
      perVehicle[t.vehicleId].l += Number(t.fuelUsedL);
      perVehicle[t.vehicleId].km += Number(t.distanceKm);
    });
    const rates = Object.entries(perVehicle).map(([id, v]) => ({ id, rate: (v.l / v.km) * 100 }));
    if (rates.length < 2) return out;
    const fleetAvg = rates.reduce((s, r) => s + r.rate, 0) / rates.length;
    rates.forEach(({ id, rate }) => {
      if (rate > fleetAvg * 1.25) {
        const v = Store.vehicleById(id);
        if (!v) return;
        out.push({
          id: `fuel-${id}`, severity: 'info', category: 'Fuel',
          title: `${v.name} is burning more fuel than usual`,
          message: `${v.name} averages ${rate.toFixed(1)} L/100km vs a fleet average of ${fleetAvg.toFixed(1)} L/100km. Worth a tyre pressure and driving-behaviour check.`,
          entityType: 'vehicle', entityId: id,
        });
      }
    });
    return out;
  },

  /* 5. idle / underutilised vehicles */
  utilizationInsights() {
    const out = [];
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14);
    Store.data.vehicles.forEach((v) => {
      if (v.status !== 'active' && v.status !== 'idle') return;
      const recent = Store.tripsForVehicle(v.id).some((t) => new Date(t.startAt) >= cutoff);
      if (!recent) {
        out.push({
          id: `idle-${v.id}`, severity: 'info', category: 'Utilisation',
          title: `${v.name} has been idle for 14+ days`,
          message: `${v.name} (${v.plate}) hasn't been logged on a trip in the last two weeks. Consider reassigning it or reviewing whether it's still needed in active rotation.`,
          entityType: 'vehicle', entityId: v.id,
        });
      }
    });
    return out;
  },

  /* 6. simple linear trend forecast for next month's spend */
  forecastInsight() {
    const months = Store.costByMonth(4);
    const totals = months.map((m) => m.total);
    if (totals.every((t) => t === 0)) return [];
    const n = totals.length;
    const xs = totals.map((_, i) => i);
    const xBar = xs.reduce((a, b) => a + b, 0) / n;
    const yBar = totals.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((s, x, i) => s + (x - xBar) * (totals[i] - yBar), 0);
    const den = xs.reduce((s, x) => s + (x - xBar) ** 2, 0) || 1;
    const slope = num / den;
    const intercept = yBar - slope * xBar;
    const nextMonthEstimate = Math.max(0, intercept + slope * n);
    const currency = Store.data.settings.currency;
    const direction = slope > 0 ? 'rising' : slope < 0 ? 'falling' : 'flat';
    return [{
      id: 'forecast-next-month', severity: 'info', category: 'Forecast',
      title: `Next month's spend is trending ${direction}`,
      message: `Based on the last ${months.length} months of costs, Fleetline projects roughly ${currency}${Math.round(nextMonthEstimate).toLocaleString()} in total fleet spend next month.`,
      entityType: 'fleet', entityId: null,
    }];
  },

  /* ---------------------------------------------------------
     lightweight "ask the fleet" keyword assistant
     matches simple intents against live store data — no
     external calls, works instantly and offline.
     --------------------------------------------------------- */
  ask(question) {
    const q = question.toLowerCase();
    const currency = Store.data.settings.currency;

    const mostExpensiveVehicle = () => {
      const ranked = Store.data.vehicles
        .map((v) => ({ v, cost: Store.vehicleTotalCost(v.id) }))
        .sort((a, b) => b.cost - a.cost);
      return ranked[0];
    };
    const cheapestCpkVehicle = () => {
      const ranked = Store.data.vehicles
        .map((v) => ({ v, cpk: Store.vehicleCostPerKm(v.id) }))
        .filter((r) => r.cpk > 0)
        .sort((a, b) => a.cpk - b.cpk);
      return ranked[0];
    };
    const soonestLicence = () => {
      const ranked = [...Store.data.drivers].sort((a, b) => new Date(a.licenseExpiry) - new Date(b.licenseExpiry));
      return ranked[0];
    };

    if (/most (expensive|costly)|highest cost/.test(q)) {
      const r = mostExpensiveVehicle();
      if (!r) return "I don't have enough vehicle data yet.";
      return `${r.v.name} (${r.v.plate}) has the highest total cost on record: ${currency}${r.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`;
    }
    if (/cheapest|most efficient|lowest cost per/.test(q)) {
      const r = cheapestCpkVehicle();
      if (!r) return "I don't have enough completed-trip data to rank cost per km yet.";
      return `${r.v.name} (${r.v.plate}) is the most cost-efficient vehicle at ${currency}${r.cpk.toFixed(2)}/km.`;
    }
    if (/licen[sc]e|licence expir|expiring/.test(q)) {
      const d = soonestLicence();
      if (!d) return "No drivers on file.";
      const days = daysBetween(todayISO(), d.licenseExpiry);
      return days < 0
        ? `${d.name}'s licence expired ${Math.abs(days)} day(s) ago — it's the most urgent one to renew.`
        : `${d.name}'s licence expires soonest, in ${days} day(s) on ${d.licenseExpiry}.`;
    }
    if (/maintenance|service due|overdue/.test(q)) {
      const insights = this.maintenanceInsights();
      if (!insights.length) return 'No vehicles are due or overdue for service right now.';
      return insights.map((i) => i.title).join('. ') + '.';
    }
    if (/idle|underutili[sz]ed|not being used/.test(q)) {
      const insights = this.utilizationInsights();
      if (!insights.length) return 'Every active vehicle has been used in the last two weeks.';
      return insights.map((i) => i.title).join('. ') + '.';
    }
    if (/total cost|fleet cost|how much.*spend|spend.*fleet/.test(q)) {
      return `Total fleet spend on record is ${currency}${Store.fleetTotalCost().toLocaleString(undefined, { maximumFractionDigits: 0 })} across ${Store.fleetTotalDistance().toLocaleString()} km.`;
    }
    if (/forecast|next month|projected/.test(q)) {
      const f = this.forecastInsight();
      return f.length ? f[0].message : "I need a bit more cost history to forecast next month.";
    }
    if (/how many (vehicles|trucks|units)/.test(q)) {
      return `There are ${Store.data.vehicles.length} vehicles in the fleet: ${Object.entries(Store.fleetStatusCounts()).map(([k, v]) => `${v} ${k.replace('_', ' ')}`).join(', ')}.`;
    }
    if (/how many (drivers)/.test(q)) {
      return `There are ${Store.data.drivers.length} drivers on file, ${Store.data.drivers.filter((d) => d.status === 'active').length} of them active.`;
    }
    if (/active trip|on the road|in progress/.test(q)) {
      const active = Store.data.trips.filter((t) => t.status === 'in_progress');
      if (!active.length) return 'No trips are currently in progress.';
      return active.map((t) => {
        const v = Store.vehicleById(t.vehicleId);
        return `${v ? v.name : 'A vehicle'} is en route from ${t.origin} to ${t.destination}`;
      }).join('. ') + '.';
    }

    return "I can answer questions about costs, maintenance, licences, idle vehicles, and forecasts — try asking things like \"which vehicle costs the most\" or \"what's due for maintenance\".";
  },
};
