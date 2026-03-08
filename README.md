# Work Order Schedule Timeline - Frontend Technical Test

**Repository:** [github.com/charmydarji/WorkOrderScheduler](https://github.com/charmydarji/WorkOrderScheduler)

## Overview

This Angular 17+ application implements a pixel-perfect Work Order Schedule Timeline for a manufacturing ERP system. Users can visualize, create, and edit work orders across multiple work centers, with robust validation and smooth interactions.

---

## Features

- Timeline grid with Day/Week/Month zoom levels
- Work order bars with status indicators and actions menu
- Create/Edit slide-out panel with form validation
- Overlap detection (error shown if work orders overlap)
- Sample data for work centers and work orders
- Automated unit and E2E tests
- Responsive design and keyboard navigation

---

## Setup & Running

### 1. Install dependencies

```bash
npm install
```

### 2. Start the application

```bash
ng serve
```

Visit [http://localhost:4200](http://localhost:4200) in your browser.

### 3. Run unit tests

```bash
npm test
```

### 4. Run E2E tests (requires app running)

```bash
npx cypress run
```

---

## Design Reference

**Sketch File:** [Sketch designs](https://www.sketch.com/s/d56a77de-9753-45a8-af7a-d93a42276667)

---

## Sample Data

- **5+ Work Centers:**
  - Genesis Hardware
  - Rodriques Electrics
  - Konsulting Inc
  - McMarrow Distribution
  - Spartan Manufacturing
- **9 Work Orders:**
  - All 4 status types (Open, In Progress, Complete, Blocked)
  - Multiple orders per center (non-overlapping)
  - Orders span different date ranges

---

## Component Structure

- `TimelineGridComponent`: Renders the timeline grid, handles zoom levels, scroll, and positioning
- `WorkOrderBarComponent`: Displays work order bars with status, actions menu, and tooltips
- `WorkOrderPanelComponent`: Slide-out panel for create/edit, uses Reactive Forms and validation
- `WorkOrderService`: Manages sample data and overlap detection
- `timeline.utils.ts`: Date calculations and timeline range logic
- `sample-data.ts`: Hardcoded sample data for demo

---

## Libraries Used

- **Angular 17+**: Standalone components, strict TypeScript
- **ng-select**: Dropdowns for status selection
- **@ng-bootstrap/ng-bootstrap**: Datepicker for start/end dates
- **SCSS**: All styling, pixel-perfect from Sketch file
- **Cypress**: E2E testing
- **Karma/Jasmine**: Unit testing

---

## Key Implementation Notes

- **Timeline Positioning:**
  - Bar positions calculated from dates relative to visible range
  - Zoom level changes recalculate column widths
  - Current day indicator always visible
- **Form Validation:**
  - All fields required
  - End date must be after start date
  - No overlap with existing orders on same work center
- **Interactions:**
  - Click empty timeline to create
  - Edit/Delete via actions menu
  - Panel closes on outside click or Cancel
  - Timescale dropdown updates zoom
  - Keyboard navigation and Escape to close panel

---

## Demo Video

[Loom Demo Video]
[Watch the demo on Loom](https://www.loom.com/share/ffa1a4488073484aaa792dffb96f8ca5)

---

## AI Prompts & Decisions (Bonus)

See `ai-prompts.md` for key AI prompts used in styling, architecture, and debugging.  
Trade-offs and future improvements are documented in code comments with `@upgrade` tags.

---

## Accessibility & Polish (Bonus)

- ARIA labels and focus management in panel and actions menu
- Keyboard navigation for form and panel
- Responsive design (horizontal scroll on mobile)
- Smooth panel animations and hover effects

---

## Future Improvements

- **localStorage persistence** for work orders
- **Infinite scroll** for timeline
- **Custom datepicker styling**
- **Performance optimizations** (virtual scroll, OnPush)
- **Advanced accessibility**

---

## Submission Checklist

- [x] Working Angular app (`ng serve`)
- [x] Pixel-perfect design (matches Sketch)
- [x] Sample data (5+ centers, 8+ orders)
- [x] Automated tests (unit + E2E)
- [x] README with setup, approach, and demo video
- [x] Loom video
- [x] Clean commit history
- [x] AI prompt documentation (bonus)

---

**Thank you for reviewing my solution!**
