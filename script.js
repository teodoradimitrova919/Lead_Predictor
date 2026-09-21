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

function renderMonthlyChart() {
  const chart = document.querySelector('.chart');
  if (!chart) return;

  const left = 35;
  const top = 15;
  const width = 414;
  const rowHeight = 49;
  const bottom = top + monthlyData.length * rowHeight;
  const maxPeople = Math.max(...monthlyData.map(item => item.prospects));
  const scale = count => count / maxPeople * width;

  chart.replaceChildren(
    createSvgElement('title', { id: 'chart-title' }, 'Campaign growth by month'),
    createSvgElement('desc', { id: 'chart-description' },
      'Sample cumulative targets for six months. Hover, tap, or focus a row to see its prospects, leads, and customers.'),
  );

  const grid = createSvgElement('g', { class: 'grid' });
  const labels = createSvgElement('g', { class: 'people-labels' });
  for (let people = 0; people <= maxPeople; people += 20) {
    const x = left + scale(people);
    grid.append(createSvgElement('path', { d: `M${x} ${top}V${bottom}` }));
    labels.append(createSvgElement('text', { x, y: bottom + 18 }, `${people} people`));
  }
  monthlyData.forEach((item, index) => {
    const y = top + index * rowHeight + rowHeight / 2;
    grid.append(createSvgElement('path', { d: `M${left} ${y}H${left + width}` }));
  });
  chart.append(grid, labels,
    createSvgElement('path', { class: 'axis', d: `M${left} ${top}V${bottom}H${left + width}` }),
    createSvgElement('text', { class: 'axis-title', transform: 'translate(14 179) rotate(-90)' }, 'Month'),
  );

  const tooltip = createSvgElement('g', {
    class: 'chart-tooltip', visibility: 'hidden', 'pointer-events': 'none', 'aria-hidden': 'true',
  });
  const hideTooltip = () => tooltip.setAttribute('visibility', 'hidden');

  monthlyData.forEach((item, index) => {
    const y = top + index * rowHeight;
    const details = [`Month #${item.month}`, `Prospects: ${item.prospects}`, `Leads: ${item.leads}`, `Customers: ${item.customers}`];
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
      const tooltipWidth = 85;
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
