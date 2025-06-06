
# 📁 Matrix Upload & Validation UX Specification

## Objective
Create a transparent, guided, and agent-supported interface for uploading, validating, and understanding cost matrix Excel files.

---

## 🔄 User Flow

1. **User navigates to `/matrix-upload`**
2. Sees drag-and-drop upload zone + file checklist
3. Upload triggers:
   - `InquisitorAgent`: validates file content
   - `InterpreterAgent`: parses into standard JSON
   - `VisualizerAgent`: renders preview insights
4. User sees:
   - Row-by-row validation results
   - Summary of cost trends
   - Any errors with download option

---

## 🖼️ UI Components

### 🔹 UploadZone.tsx
- Drag-and-drop file zone
- Checklist of required sheets: `matrix`, `matrix_detail`, `region_codes`

### 🔹 ImportStatusPanel.tsx
- Agent feedback log (live stream)
- “Rows parsed”, “Issues found”, “Matrix year”, “Detected regions/types”

### 🔹 MatrixPreviewTable.tsx
- Table showing parsed content (10 rows max)
- Highlighted errors
- Toggle raw vs processed view

### 🔹 CostInsightPanel.tsx
- Card UI:
    - Avg cost by type
    - Min/max entries
    - Notable trends (“R3 in East rose +12.3%”)

---

## 🧠 Agent Flow

- `InquisitorAgent`:
    - Check for correct sheets and columns
    - Validate year, region, and type integrity
    - Return human-readable issues
- `InterpreterAgent`:
    - Convert sheets into standardized JSON
    - Fill missing fields with default rules
- `VisualizerAgent`:
    - Auto-generate cost summaries and visual diffs

