// Requires jsdom in the Node module search path: node --test dashboard.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

test('all dashboard sections update together and recover from invalid input', () => {
  const dom = new JSDOM(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'), {runScripts:'dangerously'});
  const w=dom.window, d=w.document;
  try {
    for(const file of ['script.js','sidebar.js','response-rates.js','calculations.js','dashboard.js']) {
      const script=d.createElement('script');
      script.textContent=fs.readFileSync(path.join(__dirname,file),'utf8');
      d.body.append(script);
    }
    const value = key => d.querySelector('.'+key+' .metric-value').textContent;
    const set = (id,value,type='input') => { const el=d.getElementById(id); el.value=value; el.dispatchEvent(new w.Event(type,{bubbles:true})); };
    assert.equal(value('customers'),'10'); assert.equal(value('leads'),'25'); assert.equal(value('prospects'),'125');
    assert.equal(d.querySelectorAll('.chart-row').length,6);
    set('revenue','20000'); assert.equal(value('customers'),'20'); assert.equal(value('prospects'),'250');
    set('lead-response','50'); assert.equal(value('leads'),'40'); assert.equal(value('prospects'),'200');
    set('prospect-response','50'); assert.equal(value('prospects'),'80');
    assert.equal(d.getElementById('prospect-response-value').value,'50.00%');
    assert.equal(d.getElementById('prospect-response').style.getPropertyValue('--fill'),'50%');
    set('campaign-end','2026-06-08'); assert.equal(d.querySelectorAll('.chart-row').length,1);
    set('campaign-end','2026-01-01'); assert.equal(value('customers'),'—'); assert.equal(d.querySelectorAll('.chart-row').length,0);
    set('campaign-end','2026-11-04'); assert.equal(value('customers'),'20');
    set('order-value','0'); assert.equal(value('customers'),'—');
    set('order-value','1000'); set('lead-response','0'); assert.equal(value('prospects'),'—');
    set('revenue','0'); assert.equal(value('prospects'),'0');
    set('lead-response','40'); set('prospect-response','20'); set('revenue','10000');
    set('language','bg','change'); assert.equal(d.documentElement.lang,'bg');
    assert.ok(d.querySelector('.customers .metric-title').textContent.includes('Клиенти'));
    assert.ok(d.querySelector('label[for="lead-response"]').textContent.includes('Отговори'));
    set('currency','EUR','change'); assert.equal(d.querySelector('.money-input span').textContent,'€'); assert.equal(value('customers'),'10');
    const row=d.querySelectorAll('.chart-row')[2]; row.dispatchEvent(new w.Event('pointerenter'));
    assert.equal(d.querySelector('.chart-tooltip').getAttribute('visibility'),'visible');
    assert.ok(d.querySelector('.chart-tooltip').textContent.includes('63'));
    row.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));
    assert.equal(d.querySelector('.chart-tooltip').getAttribute('visibility'),'hidden');
    set('revenue',''); assert.equal(value('customers'),'—');
    set('language','en','change'); set('revenue','10000'); assert.equal(value('prospects'),'125');
  } finally { w.close(); }
});
