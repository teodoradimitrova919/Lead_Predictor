'use strict';

// Connect the independently implemented sections through their change events.
(() => {
  const byId = id => document.getElementById(id);
  const message = document.createElement('p');
  message.className = 'dashboard-message';
  message.setAttribute('role', 'status');
  message.hidden = true;
  document.querySelector('.overview').after(message);

  function updateDashboard() {
    const language = byId('language').value;
    const bg = language === 'bg';
    const format = new Intl.NumberFormat(bg ? 'bg-BG' : 'en-US', { maximumFractionDigits: 2 });
    const names = bg ? ['Контакти', 'Потенциални клиенти', 'Клиенти'] : ['Prospects', 'Leads', 'Customers'];
    document.documentElement.lang = language;
    document.querySelector('.overview').setAttribute('aria-label', bg ? 'Преглед на кампанията' : 'Campaign overview');
    document.querySelector('.response-panel').setAttribute('aria-label', bg ? 'Проценти на отговорите' : 'Response rates');
    for (const [id, title] of [['lead-response', bg ? 'Отговори от потенциални клиенти' : 'Lead Response Rate'], ['prospect-response', bg ? 'Отговори от контакти' : 'Prospect Response Rate']]) {
      document.querySelector(`label[for="${id}"]`).textContent = title;
      const value = `${new Intl.NumberFormat(bg ? 'bg-BG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(byId(id).valueAsNumber)}%`;
      byId(`${id}-value`).value = value;
      byId(id).setAttribute('aria-valuetext', value);
    }
    let totals = null;
    message.hidden = true;
    message.textContent = '';
    try {
      if (!['revenue', 'order-value', 'campaign-start', 'campaign-end'].every(id => byId(id).validity.valid)) throw Error('invalid');
      totals = CampaignCalculations.calculate(...['revenue', 'order-value', 'lead-response', 'prospect-response'].map(id => byId(id).valueAsNumber));
      const months = CampaignCalculations.months(byId('campaign-start').value, byId('campaign-end').value);
      renderMonthlyChart(CampaignCalculations.rows(totals, months), language);
    } catch (error) {
      const errors = {
        invalid: bg ? 'Коригирайте невалидните настройки на кампанията.' : 'Correct the invalid campaign settings.',
        zeroRate: bg ? 'За положителен оборот двата процента на отговорите трябва да са над 0%.' : 'Both response rates must be above 0% to reach a positive revenue target.',
        large: bg ? 'Необходимият брой е твърде голям. Проверете сумите и процентите.' : 'Required counts are too large. Check the amounts and response rates.',
        duration: bg ? 'Изберете кампания до 120 месеца.' : 'Choose a campaign of up to 120 months.',
      };
      if (!errors[error.message]) throw error;
      totals = null;
      message.textContent = errors[error.message];
      message.hidden = false;
      renderMonthlyChart([], language);
      document.getElementById('chart-description').textContent = message.textContent;
    }
    ['prospects', 'leads', 'customers'].forEach((key, index) => {
      const card = document.querySelector(`.metric.${key}`);
      const title = card.querySelector('.metric-title');
      title.replaceChildren(title.querySelector('svg'), document.createTextNode(names[index]));
      const percentage = totals?.prospects ? totals[key] / totals.prospects * 100 : 0;
      card.querySelector('.metric-value').textContent = totals ? format.format(totals[key]) : '—';
      card.querySelector('.percentage').textContent = totals ? `${format.format(percentage)}%` : '—';
      card.querySelector('.meter span').style.width = `${percentage}%`;
      const meter = card.querySelector('.meter');
      meter.setAttribute('aria-label', names[index]);
      if (totals) meter.setAttribute('aria-valuenow', percentage);
      else meter.removeAttribute('aria-valuenow');
      meter.setAttribute('aria-valuetext', totals ? `${format.format(percentage)}%` : message.textContent);
    });
  }
  document.addEventListener('campaign-settings-change', updateDashboard);
  document.addEventListener('response-rates-change', updateDashboard);
  // Earlier scripts have already initialized; read current values on startup.
  updateDashboard();
})();
