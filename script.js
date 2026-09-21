'use strict';

// Avoid counting an extra person for floating-point noise (e.g. 0.07 / 0.01).
function wholePeople(value) {
  const nearest = Math.round(value);
  const tolerance = Math.min(1e-7, Number.EPSILON * Math.abs(value) * 2);
  return nearest > 0 && Math.abs(value - nearest) <= tolerance ? nearest : Math.ceil(value);
}

// Pure helpers are also exported for Node.js tests.
function calculateFunnel(revenue, orderValue, leadRate, prospectRate) {
  if (![revenue, orderValue, leadRate, prospectRate].every(Number.isFinite)) throw new Error('numbers');
  if (revenue < 0) throw new Error('revenue');
  if (orderValue <= 0) throw new Error('order');
  if (leadRate < 0 || leadRate > 100 || prospectRate < 0 || prospectRate > 100) throw new Error('rates');
  if (revenue === 0) return { customers: 0, leads: 0, prospects: 0 };
  if (leadRate === 0 || prospectRate === 0) throw new Error('zeroRate');
  // Round up at each stage to provide enough whole people for the target.
  const customers = wholePeople(revenue / orderValue);
  const leads = wholePeople(customers / (leadRate / 100));
  const prospects = wholePeople(leads / (prospectRate / 100));
  if (![customers, leads, prospects].every(Number.isSafeInteger)) throw new Error('large');
  return { customers, leads, prospects };
}

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('dates');
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('dates');
  return date;
}

function campaignMonths(startValue, endValue) {
  const start = parseDate(startValue);
  const end = parseDate(endValue);
  if (end < start) throw new Error('dateOrder');
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
  // Month anniversaries clamp to the last day of shorter months.
  const anniversary = new Date(start);
  anniversary.setUTCDate(1);
  anniversary.setUTCMonth(start.getUTCMonth() + months);
  const lastDay = new Date(anniversary);
  lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0);
  anniversary.setUTCDate(Math.min(start.getUTCDate(), lastDay.getUTCDate()));
  if (end > anniversary) months += 1;
  return Math.max(1, months);
}

function monthlyTargets(totals, months) {
  if (!Number.isInteger(months) || months < 1 || months > 120) throw new Error('duration');
  return Array.from({ length: months }, (_, index) => ({
    month: index + 1,
    prospects: wholePeople(totals.prospects * ((index + 1) / months)),
    leads: wholePeople(totals.leads * ((index + 1) / months)),
    customers: wholePeople(totals.customers * ((index + 1) / months)),
  }));
}

if (typeof module !== 'undefined' && module.exports) module.exports = { calculateFunnel, campaignMonths, monthlyTargets };
if (typeof document !== 'undefined') initializeDashboard();

function initializeDashboard() {
  const byId = id => document.getElementById(id);
  const language = byId('language');
  const currency = byId('currency');
  const chart = document.querySelector('.chart');
  const message = byId('validation-message');
  const controls = ['revenue', 'order-value', 'lead-response', 'prospect-response', 'campaign-start', 'campaign-end'];
  const words = {
    en: {
      locale: 'en-US', language: 'Language', currency: 'Currency', start: 'Campaign Start', end: 'Campaign End',
      revenueLabel: 'Total Revenue', orderLabel: 'Avg. Order Value', leadLabel: 'Lead Response Rate', prospectLabel: 'Prospect Response Rate',
      prospects: 'Prospects', leads: 'Leads', customers: 'Customers', month: 'Month', people: 'people',
      chart: 'Cumulative campaign targets by month', settings: 'Campaign settings', overview: 'Campaign overview', response: 'Response rates',
      usd: '$ US Dollar', eur: '€ Euro',
      numbers: 'Enter a valid number in every amount field.', revenue: 'Total revenue must be zero or greater.',
      order: 'Average order value must be greater than zero.', rates: 'Response rates must be between 0% and 100%.',
      zeroRate: 'A positive revenue target cannot be reached with a 0% response rate. Increase both response rates above zero.',
      large: 'The required counts are too large. Reduce the target or increase the order value or response rates.',
      dates: 'Choose a valid campaign start and end date.', dateOrder: 'Campaign end must be on or after campaign start.',
      duration: 'Choose a campaign of at most 120 months.',
    },
    bg: {
      locale: 'bg-BG', language: 'Език', currency: 'Валута', start: 'Начало на кампанията', end: 'Край на кампанията',
      revenueLabel: 'Общ оборот', orderLabel: 'Средна стойност на поръчка', leadLabel: 'Отговори от потенциални клиенти', prospectLabel: 'Отговори от контакти',
      prospects: 'Контакти', leads: 'Потенциални клиенти', customers: 'Клиенти', month: 'Месец', people: 'души',
      chart: 'Натрупани цели по месеци', settings: 'Настройки на кампанията', overview: 'Преглед на кампанията', response: 'Проценти на отговорите',
      usd: '$ Щатски долар', eur: '€ Евро',
      numbers: 'Въведете валидно число във всяко поле за сума.', revenue: 'Общият оборот трябва да е нула или повече.',
      order: 'Средната стойност на поръчката трябва да е по-голяма от нула.', rates: 'Процентите на отговорите трябва да са между 0% и 100%.',
      zeroRate: 'Положителен целеви оборот не може да бъде достигнат при 0% отговори. Увеличете двата процента над нула.',
      large: 'Необходимият брой е твърде голям. Намалете целта или увеличете стойността на поръчката или процентите на отговорите.',
      dates: 'Изберете валидни дати за начало и край.', dateOrder: 'Краят на кампанията трябва да е на или след началната дата.',
      duration: 'Изберете кампания с продължителност до 120 месеца.',
    },
  };
  let text = words.en;
  let numberFormat = new Intl.NumberFormat(text.locale);
  let compactFormat = new Intl.NumberFormat(text.locale, { notation: 'compact', maximumFractionDigits: 1 });
  language.replaceChildren(new Option('English', 'en'), new Option('Български', 'bg'));
  currency.replaceChildren(new Option(words.en.usd, 'USD'), new Option(words.en.eur, 'EUR'));
  for (const id of ['revenue', 'order-value']) { byId(id).step = 'any'; byId(id).required = true; }
  for (const id of ['campaign-start', 'campaign-end']) byId(id).required = true;
  document.querySelector('.settings').addEventListener('submit', event => event.preventDefault());

  function translate() {
    text = words[language.value];
    document.documentElement.lang = language.value;
    numberFormat = new Intl.NumberFormat(text.locale);
    compactFormat = new Intl.NumberFormat(text.locale, { notation: 'compact', maximumFractionDigits: 1 });
    const labels = { language: 'language', currency: 'currency', 'campaign-start': 'start', 'campaign-end': 'end', revenue: 'revenueLabel', 'order-value': 'orderLabel', 'lead-response': 'leadLabel', 'prospect-response': 'prospectLabel' };
    for (const [id, key] of Object.entries(labels)) document.querySelector(`label[for="${id}"]`).textContent = text[key];
    document.querySelector('.flag').textContent = language.value === 'bg' ? '🇧🇬' : '🇺🇸';
    currency.options[0].textContent = text.usd;
    currency.options[1].textContent = text.eur;
    document.querySelector('.sidebar').setAttribute('aria-label', text.settings);
    document.querySelector('.overview').setAttribute('aria-label', text.overview);
    document.querySelector('.response-panel').setAttribute('aria-label', text.response);
    for (const key of ['prospects', 'leads', 'customers']) {
      const title = document.querySelector(`.${key} .metric-title`);
      title.replaceChildren(title.querySelector('svg'), document.createTextNode(text[key]));
      document.querySelector(`.${key} .meter`).setAttribute('aria-label', text[key]);
    }
  }

  function svg(tag, attributes = {}, content) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    if (content !== undefined) element.textContent = content;
    return element;
  }

  function renderChart(totals, months) {
    chart.replaceChildren(svg('title', { id: 'chart-title' }, text.chart));
    const description = svg('desc', { id: 'chart-description' });
    chart.append(description);
    if (!totals) {
      chart.setAttribute('viewBox', '0 0 480 350');
      description.textContent = message.textContent;
      chart.append(svg('text', { x: 240, y: 175, 'text-anchor': 'middle', 'font-size': 24 }, '—'));
      return;
    }
    const rows = monthlyTargets(totals, months);
    const height = Math.max(350, months * 49 + 56);
    const bottom = height - 40;
    const rowHeight = (bottom - 15) / months;
    chart.setAttribute('viewBox', `0 0 480 ${height}`);
    description.textContent = rows.map(row => `${text.month} ${row.month}: ${text.prospects} ${numberFormat.format(row.prospects)}, ${text.leads} ${numberFormat.format(row.leads)}, ${text.customers} ${numberFormat.format(row.customers)}`).join('; ');
    const grid = svg('g', { class: 'grid' });
    const axisMaximum = Math.max(1, totals.prospects);
    for (let tick = 0; tick <= 5; tick++) {
      const x = 35 + tick * 82.8;
      grid.append(svg('path', { d: `M${x} 15V${bottom}` }));
      chart.append(svg('text', { class: 'people-labels', x, y: bottom + 18 }, compactFormat.format(axisMaximum * tick / 5)));
    }
    chart.append(grid, svg('path', { class: 'axis', d: `M35 15V${bottom}H449` }),
      svg('text', { class: 'people-labels', x: 242, y: bottom + 32 }, text.people),
      svg('text', { class: 'axis-title', transform: `translate(13 ${(bottom + 15) / 2}) rotate(-90)`, 'text-anchor': 'middle' }, text.month));
    const tooltip = svg('g', { class: 'chart-tooltip', 'pointer-events': 'none', visibility: 'hidden', 'aria-hidden': 'true' });
    rows.forEach(row => {
      const y = 15 + (row.month - 1) * rowHeight;
      const label = `${text.month} ${row.month}: ${text.prospects} ${numberFormat.format(row.prospects)}, ${text.leads} ${numberFormat.format(row.leads)}, ${text.customers} ${numberFormat.format(row.customers)}`;
      const group = svg('g', { class: 'chart-row', tabindex: 0, role: 'img', 'aria-label': label });
      group.append(svg('title', {}, label));
      for (const [key, className, inset] of [['prospects', 'prospect-bars', 3], ['leads', 'lead-bars', 7], ['customers', 'customer-bars', 7]]) {
        group.append(svg('rect', { class: className, x: 35, y: y + inset, width: row[key] / axisMaximum * 414, height: rowHeight - inset * 2 }));
      }
      group.append(svg('text', { class: 'month-labels', x: 29, y: y + rowHeight / 2 + 3 }, row.month));
      group.append(svg('rect', { class: 'chart-hit-area', x: 35, y, width: 414, height: rowHeight, fill: 'transparent' }));
      const showTooltip = () => {
        const lines = [`${text.month} #${row.month}`, ...['prospects', 'leads', 'customers'].map(key => `${text[key]}: ${numberFormat.format(row[key])}`)];
        const width = Math.max(100, Math.max(...lines.map(line => line.length)) * 6 + 16);
        const x = Math.min(440 - width, Math.max(70, 35 + row.prospects / axisMaximum * 180));
        const top = Math.min(bottom - 65, y + 3);
        tooltip.replaceChildren(svg('rect', { x, y: top, width, height: 62, rx: 3 }));
        lines.forEach((line, index) => tooltip.append(svg('text', { x: x + 7, y: top + 14 + index * 12 }, line)));
        tooltip.setAttribute('visibility', 'visible');
      };
      group.addEventListener('pointerenter', showTooltip);
      group.addEventListener('focus', showTooltip);
      group.addEventListener('click', showTooltip);
      group.addEventListener('pointerleave', () => tooltip.setAttribute('visibility', 'hidden'));
      group.addEventListener('blur', () => tooltip.setAttribute('visibility', 'hidden'));
      group.addEventListener('keydown', event => { if (event.key === 'Escape') tooltip.setAttribute('visibility', 'hidden'); });
      chart.append(group);
    });
    chart.append(tooltip);
  }

  function renderMetrics(totals) {
    for (const key of ['prospects', 'leads', 'customers']) {
      const card = document.querySelector(`.metric.${key}`);
      const percentage = totals && totals.prospects ? totals[key] / totals.prospects * 100 : 0;
      card.querySelector('.metric-value').textContent = totals ? numberFormat.format(totals[key]) : '—';
      card.querySelector('.percentage').textContent = totals ? `${new Intl.NumberFormat(text.locale, { maximumFractionDigits: 2 }).format(percentage)}%` : '—';
      card.querySelector('.meter span').style.width = `${percentage}%`;
      const meter = card.querySelector('.meter');
      if (totals) meter.setAttribute('aria-valuenow', percentage);
      else meter.removeAttribute('aria-valuenow');
      meter.setAttribute('aria-valuetext', totals ? `${numberFormat.format(totals[key])} ${text[key]}` : message.textContent);
    }
  }

  function update() {
    for (const id of controls) byId(id).removeAttribute('aria-invalid');
    message.hidden = true;
    message.textContent = '';
    for (const id of ['lead-response', 'prospect-response']) {
      const control = byId(id);
      control.style.setProperty('--fill', `${control.value}%`);
      byId(`${id}-value`).value = `${new Intl.NumberFormat(text.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(control.valueAsNumber)}%`;
      control.setAttribute('aria-valuetext', byId(`${id}-value`).value);
    }
    const symbol = currency.value === 'EUR' ? '€' : '$';
    document.querySelectorAll('.money-input span').forEach(element => { element.textContent = symbol; });
    for (const id of ['revenue', 'order-value']) byId(id).title = currency.options[currency.selectedIndex].text;
    try {
      const totals = calculateFunnel(...['revenue', 'order-value', 'lead-response', 'prospect-response'].map(id => byId(id).valueAsNumber));
      const months = campaignMonths(byId('campaign-start').value, byId('campaign-end').value);
      if (months > 120) throw new Error('duration');
      renderMetrics(totals);
      renderChart(totals, months);
    } catch (error) {
      if (!Object.hasOwn(text, error.message)) throw error;
      message.textContent = text[error.message];
      message.hidden = false;
      const invalidFields = { numbers: ['revenue', 'order-value'], revenue: ['revenue'], order: ['order-value'], rates: ['lead-response', 'prospect-response'], zeroRate: ['lead-response', 'prospect-response'].filter(id => byId(id).valueAsNumber === 0), dates: ['campaign-start', 'campaign-end'], dateOrder: ['campaign-end'], duration: ['campaign-end'], large: ['revenue', 'order-value'] };
      for (const id of invalidFields[error.message] || []) byId(id).setAttribute('aria-invalid', 'true');
      renderMetrics(null);
      renderChart(null);
    }
  }

  for (const id of controls) byId(id).addEventListener('input', update);
  language.addEventListener('change', () => { translate(); update(); });
  currency.addEventListener('change', update);
  translate();
  update();
}
