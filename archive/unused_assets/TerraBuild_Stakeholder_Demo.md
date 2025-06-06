
# 🧠 TerraBuild Stakeholder Demo – Smart Valuation Transparency

---

## 🎯 Mission
"To replace black-box cost systems with explainable, editable, AI-aided valuation — built for real assessors, auditors, and the public."

---

## 🛠️ What You’re Looking At

**TerraBuild is a fully functioning prototype.**
- Uploads real cost matrix data
- Validates schema and structure
- Runs simulated agent analysis
- Shows feature-based impact
- Allows edits, reruns, and exports

---

## 🧪 Live Demo Steps

1. **Start the API Backend**
```bash
cd backend
docker build -t terrabuild-api .
docker run -p 5001:5001 terrabuild-api
```

2. **Start the Frontend**
```bash
cd frontend
npm install
npm run dev
```

3. **Open the App** at [http://localhost:3000](http://localhost:3000)

---

## ✅ Try It Live

### 🧩 Step 1: Load a Matrix
- Simulated matrix will show inline
- Agent feed will populate
- Insight summary card appears

### 📝 Step 2: Edit a Cell
- Change a base cost
- Click "Re-run Agents"
- Watch agents post new output

### 📤 Step 3: Export Justification
- Enter session ID from validation response
- Download full audit JSON
- Download plain-text PDF summary

---

## 🧠 Why It’s Powerful

| Feature | Why It Matters |
|--------|----------------|
| Agent Insights | Clear reasoning for changes |
| SHAP-style UI | Explainable regression logic |
| Exportable | Audit-ready and defensible |
| Editable Matrix | Human-in-the-loop correction |
| Session UUIDs | Legal record of what happened |

---

## 📦 Summary

> TerraBuild is the valuation platform Marshall & Swift would never dare build:
> Transparent. Intelligent. Human-Aware.

---

## 🌐 Next Steps

- Deploy to Vercel / Fly.io for live link
- Integrate real county data
- Expand AI agent roles with learning
