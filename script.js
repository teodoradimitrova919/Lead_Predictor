'use strict';

// Main chart only: sample data, bars, and interactive tooltips.
// Sidebar controls, summary cards, and sliders will be connected later.
const monthlyData = [
  { month: 1, prospects: 21, leads: 4, customers: 2 },
  { month: 2, prospects: 42, leads: 8, customers: 4 },
  { month: 3, prospects: 63, leads: 13, customers: 5 },
  { month: 4, prospects: 83, leads: 17, customers: 7 },
  { month: 5, prospects: 104, leads: 21, customers: 8 },
  { month: 6, prospects: 125, leads: 25, customers: 10 },
];

function createSvgElement(tag, attributes = {}, text) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderMonthlyChart(data = monthlyData, language = 'en') {
  const monthlyData = data;
  const bg = language === 'bg';
  const words = bg ? ['Месец', 'Контакти', 'Потенциални клиенти', 'Клиенти', 'души'] : ['Month', 'Prospects', 'Leads', 'Customers', 'people'];
  const format = new Intl.NumberFormat(bg ? 'bg-BG' : 'en-US');
  const chart = document.querySelector('.chart');
  if (!chart) return;

  const left = 35;
  const top = 15;
  const width = 414;
  const rowHeight = 49;
  const bottom = top + monthlyData.length * rowHeight;
  const maxPeople = Math.max(1, ...monthlyData.map(item => item.prospects));
  chart.setAttribute('viewBox', `0 0 480 ${Math.max(350, bottom + 41)}`);
  const scale = count => count / maxPeople * width;

  chart.replaceChildren(
    createSvgElement('title', { id: 'chart-title' }, bg ? 'Натрупани цели по месеци' : 'Cumulative campaign targets by month'),
    createSvgElement('desc', { id: 'chart-description' },
      monthlyData.map(row => `${words[0]} ${row.month}: ${words[1]} ${format.format(row.prospects)}, ${words[2]} ${format.format(row.leads)}, ${words[3]} ${format.format(row.customers)}`).join('; ')),
  );

  const grid = createSvgElement('g', { class: 'grid' });
  const labels = createSvgElement('g', { class: 'people-labels' });
  const tickStep = Math.max(1, Math.ceil(maxPeople / 6));
  for (let people = 0; people <= maxPeople; people += tickStep) {
    const x = left + scale(people);
    grid.append(createSvgElement('path', { d: `M${x} ${top}V${bottom}` }));
    labels.append(createSvgElement('text', { x, y: bottom + 18 }, new Intl.NumberFormat(language, { notation: 'compact', maximumFractionDigits: 1 }).format(people)));
  }
  monthlyData.forEach((item, index) => {
    const y = top + index * rowHeight + rowHeight / 2;
    grid.append(createSvgElement('path', { d: `M${left} ${y}H${left + width}` }));
  });
  chart.append(grid, labels,
    createSvgElement('path', { class: 'axis', d: `M${left} ${top}V${bottom}H${left + width}` }),
    createSvgElement('text', { class: 'axis-title', transform: `translate(14 ${(top + bottom) / 2}) rotate(-90)` }, words[0]),
    createSvgElement('text', { class: 'people-labels', x: 242, y: bottom + 32 }, words[4]),
  );

  const tooltip = createSvgElement('g', {
    class: 'chart-tooltip', visibility: 'hidden', 'pointer-events': 'none', 'aria-hidden': 'true',
  });
  const hideTooltip = () => tooltip.setAttribute('visibility', 'hidden');

  monthlyData.forEach((item, index) => {
    const y = top + index * rowHeight;
    const details = [`${words[0]} #${item.month}`, `${words[1]}: ${format.format(item.prospects)}`, `${words[2]}: ${format.format(item.leads)}`, `${words[3]}: ${format.format(item.customers)}`];
    const row = createSvgElement('g', {
      class: 'chart-row', tabindex: '0', role: 'img', 'aria-label': details.join(', '),
    });

    // Smaller series overlay prospects, matching the reference image.
    for (const [key, className, inset] of [
      ['prospects', 'prospect-bars', 3],
      ['leads', 'lead-bars', 7],
      ['customers', 'customer-bars', 7],
    ]) {
      row.append(createSvgElement('rect', {
        class: className, x: left, y: y + inset,
        width: scale(item[key]), height: rowHeight - inset * 2,
      }));
    }
    row.append(createSvgElement('text', { class: 'month-labels', x: left - 6, y: y + 27 }, item.month));
    row.append(createSvgElement('rect', {
      class: 'chart-hit-area', x: left, y, width, height: rowHeight, fill: 'transparent',
    }));

    function showTooltip() {
      const tooltipWidth = Math.max(85, ...details.map(line => line.length * 6 + 12));
      const tooltipHeight = 59;
      const x = Math.min(left + width - tooltipWidth, left + scale(item.prospects) / 2);
      const tooltipY = Math.min(bottom - tooltipHeight, y);
      tooltip.replaceChildren(createSvgElement('rect', {
        x, y: tooltipY, width: tooltipWidth, height: tooltipHeight, rx: 2,
      }));
      details.forEach((line, lineIndex) => {
        tooltip.append(createSvgElement('text', { x: x + 6, y: tooltipY + 14 + lineIndex * 12 }, line));
      });
      tooltip.setAttribute('visibility', 'visible');
    }

    row.addEventListener('pointerenter', showTooltip);
    row.addEventListener('pointerleave', hideTooltip);
    row.addEventListener('focus', showTooltip);
    row.addEventListener('blur', hideTooltip);
    row.addEventListener('click', showTooltip);
    row.addEventListener('keydown', event => {
      if (event.key === 'Escape') hideTooltip();
    });
    chart.append(row);
  });
  // Keep the tooltip above all bars.
  chart.append(tooltip);
}

renderMonthlyChart();
