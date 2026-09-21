const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateFunnel, campaignMonths, monthlyTargets } = require('./script.js');

test('reference example produces 10 customers, 25 leads, and 125 prospects', () => {
  assert.deepEqual(calculateFunnel(10000, 1000, 40, 20), { customers: 10, leads: 25, prospects: 125 });
});

test('each stage rounds up enough people to reach the target', () => {
  assert.deepEqual(calculateFunnel(10001, 1000, 40, 20), { customers: 11, leads: 28, prospects: 140 });
  assert.deepEqual(calculateFunnel(1, 3, 30, 30), { customers: 1, leads: 4, prospects: 14 });
});

test('decimal amounts do not add a person due to floating-point noise', () => {
  assert.deepEqual(calculateFunnel(0.07, 0.01, 100, 100), { customers: 7, leads: 7, prospects: 7 });
  assert.equal(calculateFunnel(0.07001, 0.01, 100, 100).customers, 8);
});

test('zero target requires no people, even with zero response rates', () => {
  assert.deepEqual(calculateFunnel(0, 100, 0, 0), { customers: 0, leads: 0, prospects: 0 });
});

test('zero rates cannot achieve a positive target', () => {
  assert.throws(() => calculateFunnel(100, 10, 0, 20), /zeroRate/);
  assert.throws(() => calculateFunnel(100, 10, 40, 0), /zeroRate/);
});

test('rejects invalid and unrepresentable counts', () => {
  for (const amount of [NaN, Infinity]) assert.throws(() => calculateFunnel(amount, 10, 40, 20), /numbers/);
  assert.throws(() => calculateFunnel(-1, 10, 40, 20), /revenue/);
  for (const amount of [0, -1]) assert.throws(() => calculateFunnel(100, amount, 40, 20), /order/);
  assert.throws(() => calculateFunnel(100, 10, 101, 20), /rates/);
  assert.throws(() => calculateFunnel(100, 10, 40, -1), /rates/);
  assert.throws(() => calculateFunnel(Number.MAX_VALUE, 1, 1, 1), /large/);
});

test('campaign duration handles partial months, same day, leap days, and year changes', () => {
  assert.equal(campaignMonths('2026-05-08', '2026-11-04'), 6);
  assert.equal(campaignMonths('2026-05-08', '2026-05-08'), 1);
  assert.equal(campaignMonths('2026-05-08', '2026-06-08'), 1);
  assert.equal(campaignMonths('2026-05-08', '2026-06-09'), 2);
  assert.equal(campaignMonths('2026-01-31', '2026-02-28'), 1);
  assert.equal(campaignMonths('2024-01-31', '2024-02-29'), 1);
  assert.equal(campaignMonths('2026-12-20', '2027-01-20'), 1);
});

test('rejects missing, impossible, and reversed dates', () => {
  for (const date of ['', '2026-02-30', 'not-a-date']) assert.throws(() => campaignMonths(date, '2026-11-04'), /dates/);
  assert.throws(() => campaignMonths('2026-11-04', '2026-05-08'), /dateOrder/);
});

test('monthly targets are cumulative and finish at the full totals', () => {
  const totals = calculateFunnel(10000, 1000, 40, 20);
  const rows = monthlyTargets(totals, 6);
  assert.deepEqual(rows[2], { month: 3, prospects: 63, leads: 13, customers: 5 });
  assert.deepEqual(rows[5], { month: 6, ...totals });
  for (let i = 1; i < rows.length; i++) {
    for (const key of ['customers', 'leads', 'prospects']) assert.ok(rows[i][key] >= rows[i - 1][key]);
  }
  assert.equal(monthlyTargets(totals, 120).length, 120);
  assert.throws(() => monthlyTargets(totals, 121), /duration/);
});
