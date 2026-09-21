const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate, months, rows } = require('./calculations.js');

test('default campaign and revenue changes', () => {
  assert.deepEqual(calculate(10000,1000,40,20), {customers:10,leads:25,prospects:125});
  assert.deepEqual(calculate(20000,1000,40,20), {customers:20,leads:50,prospects:250});
});
test('both conversion rates affect the funnel', () => {
  assert.deepEqual(calculate(10000,1000,50,25), {customers:10,leads:20,prospects:80});
});
test('round up whole people without decimal noise', () => {
  assert.deepEqual(calculate(10001,1000,40,20), {customers:11,leads:28,prospects:140});
  assert.equal(calculate(.07,.01,100,100).customers,7);
});
test('invalid numbers, zero conversion, and excessive counts', () => {
  assert.throws(()=>calculate(100,0,40,20),/invalid/);
  assert.throws(()=>calculate(NaN,10,40,20),/invalid/);
  assert.throws(()=>calculate(100,10,0,20),/zeroRate/);
  assert.throws(()=>calculate(100,10,40,0),/zeroRate/);
  assert.throws(()=>calculate(Number.MAX_VALUE,1,1,1),/large/);
  assert.deepEqual(calculate(0,10,0,0),{customers:0,leads:0,prospects:0});
});
test('calendar months include partial final months and clamp month ends', () => {
  assert.equal(months('2026-05-08','2026-11-04'),6);
  assert.equal(months('2026-05-08','2026-05-08'),1);
  assert.equal(months('2026-05-08','2026-06-09'),2);
  assert.equal(months('2024-01-31','2024-02-29'),1);
  assert.throws(()=>months('2026-05-08','2026-01-01'),/invalid/);
  assert.throws(()=>months('2026-02-30','2026-11-04'),/invalid/);
  assert.throws(()=>months('2026-05-08','2050-01-01'),/duration/);
});
test('chart targets match tooltip values and final totals', () => {
  const totals=calculate(10000,1000,40,20);
  const data=rows(totals,6);
  assert.deepEqual(data[2],{month:3,customers:5,leads:13,prospects:63});
  assert.deepEqual(data[5],{month:6,...totals});
});
