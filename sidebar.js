'use strict';

// Sidebar only. The chart and response sliders are connected in later steps.
(() => {
  const form = document.querySelector('.settings');
  if (!form) return;

  const field = id => form.querySelector(`#${id}`);
  const language = field('language');
  const currency = field('currency');
  const inputIds = ['campaign-start', 'campaign-end', 'revenue', 'order-value'];
  const translations = {
    en: {
      settings: 'Campaign settings', language: 'Language', currency: 'Currency',
      'campaign-start': 'Campaign Start', 'campaign-end': 'Campaign End',
      revenue: 'Total Revenue', 'order-value': 'Avg. Order Value',
      USD: '$ US Dollar', EUR: '€ Euro', GBP: '£ British Pound',
      date: 'Choose a valid date.', dateOrder: 'End date must be on or after the start date.',
      amount: 'Enter a valid amount.', revenueError: 'Revenue must be zero or greater.',
      orderError: 'Average order value must be greater than zero.',
      currencyHint: 'Changes the currency unit only; entered amounts are not converted.',
    },
    bg: {
      settings: 'Настройки на кампанията', language: 'Език', currency: 'Валута',
      'campaign-start': 'Начало на кампанията', 'campaign-end': 'Край на кампанията',
      revenue: 'Общ оборот', 'order-value': 'Средна стойност на поръчката',
      USD: '$ Щатски долар', EUR: '€ Евро', GBP: '£ Британска лира',
      date: 'Изберете валидна дата.', dateOrder: 'Краят трябва да е на или след началната дата.',
      amount: 'Въведете валидна сума.', revenueError: 'Оборотът трябва да е нула или повече.',
      orderError: 'Средната стойност на поръчката трябва да е по-голяма от нула.',
      currencyHint: 'Променя само валутната единица; въведените суми не се превалутират.',
    },
  };

  language.replaceChildren(new Option('English', 'en'), new Option('Български', 'bg'));
  currency.replaceChildren(...['USD', 'EUR', 'GBP'].map(code => new Option(translations.en[code], code)));

  // Each field has its own accessible validation message.
  for (const id of inputIds) {
    const input = field(id);
    input.required = true;
    const error = document.createElement('small');
    error.id = `${id}-error`;
    error.className = 'sidebar-error';
    error.setAttribute('aria-live', 'polite');
    error.hidden = true;
    input.closest('.field').append(error);
    input.setAttribute('aria-describedby', error.id);
  }
  field('revenue').step = 'any';
  field('order-value').step = 'any';

  function setError(id, message) {
    const input = field(id);
    const error = field(`${id}-error`);
    input.setCustomValidity(message);
    input.setAttribute('aria-invalid', String(Boolean(message)));
    error.textContent = message;
    error.hidden = !message;
  }

  function validate() {
    const text = translations[language.value];
    for (const id of inputIds) setError(id, '');
    const start = field('campaign-start');
    const end = field('campaign-end');
    end.min = start.value;
    for (const input of [start, end]) {
      if (!input.value || !Number.isFinite(input.valueAsNumber)) setError(input.id, text.date);
    }
    if (start.value && end.value && end.valueAsNumber < start.valueAsNumber) {
      setError('campaign-end', text.dateOrder);
    }
    for (const id of ['revenue', 'order-value']) {
      const value = field(id).valueAsNumber;
      if (!Number.isFinite(value)) setError(id, text.amount);
      else if (id === 'revenue' && value < 0) setError(id, text.revenueError);
      else if (id === 'order-value' && value <= 0) setError(id, text.orderError);
    }
    return inputIds.every(id => field(id).validity.valid);
  }

  function update() {
    const valid = validate();
    // Other sections can listen for this event when they are implemented.
    // Invalid values are never published as usable campaign settings.
    form.dispatchEvent(new CustomEvent('campaign-settings-change', {
      bubbles: true,
      detail: {
        valid,
        settings: valid ? {
          language: language.value,
          currency: currency.value,
          startDate: field('campaign-start').value,
          endDate: field('campaign-end').value,
          revenue: field('revenue').valueAsNumber,
          orderValue: field('order-value').valueAsNumber,
        } : null,
      },
    }));
  }

  function updateCurrency() {
    const symbols = { USD: '$', EUR: '€', GBP: '£' };
    form.querySelectorAll('.money-input span').forEach(span => { span.textContent = symbols[currency.value]; });
    for (const id of ['revenue', 'order-value']) field(id).title = currency.selectedOptions[0].text;
  }

  function updateLanguage() {
    const text = translations[language.value];
    const sidebar = form.closest('.sidebar');
    sidebar.lang = language.value;
    sidebar.setAttribute('aria-label', text.settings);
    form.querySelectorAll('label[for]').forEach(label => { label.textContent = text[label.htmlFor]; });
    form.querySelector('.flag').textContent = language.value === 'bg' ? '🇧🇬' : '🇺🇸';
    for (const option of currency.options) option.textContent = text[option.value];
    currency.title = text.currencyHint;
    updateCurrency();
    update();
  }

  for (const id of inputIds) field(id).addEventListener('input', update);
  language.addEventListener('change', updateLanguage);
  currency.addEventListener('change', () => { updateCurrency(); update(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    update();
    form.querySelector('[aria-invalid="true"]')?.focus();
  });
  updateLanguage();
})();
