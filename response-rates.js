'use strict';

// Response-rate controls only. Dashboard calculations will be connected later.
(() => {
  const panel = document.querySelector('.response-panel');
  if (!panel) return;

  const leadSlider = panel.querySelector('#lead-response');
  const prospectSlider = panel.querySelector('#prospect-response');

  function updateResponseRates() {
    for (const slider of [leadSlider, prospectSlider]) {
      const percentage = slider.valueAsNumber;
      const formattedValue = `${percentage.toFixed(2)}%`;
      const output = panel.querySelector(`#${slider.id}-value`);

      output.value = formattedValue;
      slider.style.setProperty('--fill', `${percentage}%`);
      slider.setAttribute('aria-valuetext', formattedValue);
    }

    // Publish both values together for future chart/card integration.
    panel.dispatchEvent(new CustomEvent('response-rates-change', {
      bubbles: true,
      detail: {
        leadRate: leadSlider.valueAsNumber,
        prospectRate: prospectSlider.valueAsNumber,
      },
    }));
  }

  for (const slider of [leadSlider, prospectSlider]) {
    // Native range controls support mouse, touch, and keyboard input.
    slider.min = '0';
    slider.max = '100';
    slider.step = '1';
    slider.addEventListener('input', updateResponseRates);
    slider.addEventListener('change', updateResponseRates);
  }

  updateResponseRates();
})();
