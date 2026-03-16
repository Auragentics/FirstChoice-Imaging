# Scheduling Optimization — Shelved

**Status:** On hold — waiting for data collection
**Last updated:** March 14, 2026

## Goal
Maximize equipment utilization across all FCI locations by building a constraint-based scheduling optimization system.

## Phases
1. **Data Model** ← current (blocked on data)
2. Template-based block scheduling
3. Cancellation recovery system
4. Dynamic constraint solver

## What We Have
- `knowledge-base/locations-hours-services.md` — hours, services, walk-in status
- `knowledge-base/Modalities & Exams - Sheet1.csv` — exam catalog with modality and location availability
- Equipment weight limits (documented in voice agent prompts)

## Data Still Needed to Resume

### 1. Exam Durations (highest priority)
For each exam in the CSV, two numbers:
- **Scan time** — how long the patient is on the table
- **Prep/turnover time** — room setup, positioning, cleanup before next patient

### 2. Equipment Inventory
- Machine count per modality per location (e.g., Logan MRI 1 + MRI 2 Mobile — both running simultaneously?)
- Capability differences between machines at the same location
- Scheduled maintenance windows or downtime patterns

### 3. Staff / Tech Model
- Number of techs per location per shift
- Which modalities each tech is certified to operate
- Shift schedules (start/end, days of week)
- Can one tech run multiple modalities in a shift?

### 4. Current Scheduling Patterns
- Slot lengths currently used per exam type
- Existing block schedules (e.g., "arthrograms only Tuesday mornings")
- Recurring holds or standing appointments

### 5. Historical Data (if available)
- Average daily exam volume per modality per location
- Cancellation / no-show rates
- Peak demand times (day of week, time of day)

## How to Resume
Once the data above is gathered, drop it in `knowledge-base/` and pick up Phase 1 (data model build).
