'use strict';

const CampaignCalculations = (() => {
  function roundPeople(value) {
    const nearest = Math.round(value);
    return nearest > 0 && Math.abs(value - nearest) <= Math.min(1e-7, Number.EPSILON * value * 2) ? nearest : Math.ceil(value);
  }

  function calculate(revenue, orderValue, leadRate, prospectRate) {
    if (![revenue, orderValue, leadRate, prospectRate].every(Number.isFinite) || revenue < 0 || orderValue <= 0) throw Error('invalid');
    if (leadRate < 0 || leadRate > 100 || prospectRate < 0 || prospectRate > 100) throw Error('invalid');
    if (revenue === 0) return { customers: 0, leads: 0, prospects: 0 };
    if (!leadRate || !prospectRate) throw Error('zeroRate');
    const customers = roundPeople(revenue / orderValue);
    const leads = roundPeople(customers / (leadRate / 100));
    const prospects = roundPeople(leads / (prospectRate / 100));
    if (![customers, leads, prospects].every(Number.isSafeInteger)) throw Error('large');
    return { customers, leads, prospects };
  }

  function months(startValue, endValue) {
    const parse = value => {
      const date = new Date(`${value}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw Error('invalid');
      return date;
    };
    const start = parse(startValue), end = parse(endValue);
    if (end < start) throw Error('invalid');
    let count = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
    const anniversary = new Date(start);
    anniversary.setUTCDate(1);
    anniversary.setUTCMonth(start.getUTCMonth() + count);
    const lastDay = new Date(anniversary);
    lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0);
    anniversary.setUTCDate(Math.min(start.getUTCDate(), lastDay.getUTCDate()));
    if (end > anniversary) count++;
    count = Math.max(1, count);
    if (count > 120) throw Error('duration');
    return count;
  }

  function rows(totals, count) {
    return Array.from({ length: count }, (_, i) => ({ month: i + 1,
      ...Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, roundPeople(value * ((i + 1) / count))])),
    }));
  }
  return { calculate, months, rows };
})();
if (typeof module !== 'undefined') module.exports = CampaignCalculations;
