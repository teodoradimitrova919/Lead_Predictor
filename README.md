# LeadPredictor

A responsive campaign calculator built with HTML, CSS, and vanilla JavaScript.

Open `index.html` directly in a browser, or serve this folder with any static web server. No dependencies or build step are required. Upload `index.html`, `styles.css`, and `script.js` together to a static hosting provider to publish online.

For a local preview with Node.js installed, run `node preview.cjs`, then visit `http://localhost:4173`.

## Calculations

- Customers = total revenue / average order value.
- Leads = customers × 100 / lead response rate.
- Prospects = leads × 100 / prospect response rate.

Each stage rounds up to whole people to meet the target. Card percentages represent each count as a share of prospects. The initial values produce **10 customers, 25 leads, and 125 prospects**.

Amounts and sliders update the cards and chart immediately. Invalid amounts, reversed dates, and zero response rates with a positive target show a validation message. A zero revenue target produces zero counts.

The chart distributes cumulative targets evenly across campaign months, including a partial final month. Same-day campaigns count as one month, month anniversaries clamp to shorter months, and the maximum supported duration is 120 months. Hover, tap, or keyboard-focus a bar for its counts. Monthly values round up independently for display and end at the final totals; they are planning targets rather than predictions of actual conversions.

The language selector supports English and Bulgarian. Currency supports USD and EUR and changes the monetary unit without converting entered amounts. Date formatting follows the browser's locale. Values reset on reload.

Run calculation tests with `node --test script.test.cjs`.
