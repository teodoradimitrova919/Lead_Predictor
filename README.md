# LeadPredictor

A responsive, static HTML and CSS recreation of the supplied dashboard reference.

Open `index.html` directly in a browser, or serve this folder with any static web server. No dependencies or build step are required. Upload `index.html` and `styles.css` together to a static hosting provider to publish it online.

For a local preview with Node.js installed, run `node preview.cjs`, then visit `http://localhost:4173`.

The chart, summary cards, percentages, and tooltip are sample visuals. Form controls use native browser behavior; changing them does not calculate or update the dashboard. Date formatting follows the browser's locale.
<div align="center">

# LeadPredictor

**Turn a revenue goal into a clear campaign plan.**

A responsive dashboard that calculates how many prospects, leads, and customers you need to reach your target revenue.

**HTML · CSS · Vanilla JavaScript**

English & Bulgarian · Live calculations · Interactive charts

[Getting started](#getting-started) · [How it works](#how-it-works) · [Testing](#testing) · [Project structure](#project-structure)

</div>

---

## Overview
<img width="1430" height="818" alt="image" src="https://github.com/user-attachments/assets/67f809f9-ba19-4460-a824-e40c1827cd21" />


LeadPredictor connects your campaign settings, response rates, and revenue goal in one dashboard. Change an amount or move a slider, and the summary cards and monthly chart update immediately.

Built as a project for **Programming Fundamentals with AI at SoftUni**, it uses plain HTML, CSS, and JavaScript, with no frontend framework or build step.

## Features

| Feature | What you can do |
| --- | --- |
| Campaign settings | Set start and end dates, target revenue, and average order value. |
| Response-rate sliders | Adjust lead and prospect response rates from 0% to 100%. |
| Live summary cards | See the required prospects, leads, and customers, with percentage bars. |
| Monthly chart | Explore cumulative targets with hover, tap, and keyboard-focus tooltips. |
| Language selection | Switch dashboard labels and number formatting between English and Bulgarian. |
| Currency selection | Choose USD, EUR, or GBP for your monetary inputs. |
| Input validation | Get clear feedback for invalid amounts, dates, or impossible conversion targets. |
| Responsive layout | Use the dashboard on desktop and smaller screens. |

## Getting started

### Open directly

Download or clone the repository, then open **`index.html`** in your browser. Keep the CSS and JavaScript files alongside it. The dashboard itself needs no package installation.

### Run a local preview

For the preview server and automated tests, use **Node.js 24 or later** with npm.

```bash
git clone https://github.com/teodoradimitrova919/Lead_Predictor.git
cd Lead_Predictor
npm ci
npm start
```

Open **[http://localhost:4173](http://localhost:4173)**. Stop the server with `Ctrl+C`.

> If PowerShell blocks `npm.ps1`, use `npm.cmd ci`, `npm.cmd start`, and `npm.cmd test` instead.

## Using the dashboard

1. Select your language and currency.
2. Choose the campaign start and end dates.
3. Enter your revenue target and average order value.
4. Adjust the two response-rate sliders.
5. Review the required counts and explore each month's targets in the chart.

All sections update together. Currency selection changes the displayed monetary unit; it **does not perform exchange-rate conversion**.

## How it works

The campaign funnel follows three stages:

**Prospects → Leads → Customers**

To plan the campaign, the calculator works backwards from your revenue goal:

```text
Customers = Revenue ÷ Average order value
Leads     = Customers × 100 ÷ Lead response rate
Prospects = Leads × 100 ÷ Prospect response rate
```

Each stage rounds **up to whole people** so the calculated counts are sufficient for the target under the selected response-rate assumptions.

### Example campaign

| Input | Value |
| --- | ---: |
| Target revenue | $10,000 |
| Average order value | $1,000 |
| Lead response rate | 40% |
| Prospect response rate | 20% |

| Required prospects | Required leads | Required customers |
| :---: | :---: | :---: |
| **125** | **25** | **10** |

Card percentages show each count as a share of total prospects: **100%**, **20%**, and **8%** in this example.

### Monthly targets

The chart spreads the totals evenly across the campaign months and displays **cumulative** counts, rounded up. The last month matches the final card totals. For the six-month example, month three shows **63 prospects, 13 leads, and 5 customers**.

Partial final months count as a month, same-day campaigns count as one month, and month anniversaries adjust to shorter months. Campaigns can span up to **120 months**.

These values are planning targets based on your inputs, rather than predictions of actual customer behaviour.

## Validation and behaviour

- Revenue must be zero or greater; average order value must be greater than zero.
- The end date must be on or after the start date.
- A positive revenue target requires both response rates to be above 0%.
- A zero revenue target produces zero required people.
- Invalid settings clear the previous results and display a message.
- Settings are held in memory and reset on reload; there is no database or account system.
- Native date-input formatting follows your browser's locale.



Interaction tests use **jsdom**, which tests DOM behaviour without a graphical browser. Visual layout should also be reviewed in a browser.

The **Dashboard checks** GitHub Actions workflow runs on pushes and pull requests. Check its result before merging changes.



