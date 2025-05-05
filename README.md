# TerraBuild - County Valuation Platform

<div align="center">
  <h3>Transparent, Intelligent, Defensible Property Valuation</h3>
  <p><em>Developed for and with Benton County, Washington</em></p>
</div>

## 🏢 Overview

TerraBuild is a comprehensive property valuation platform designed to replace black-box cost systems with explainable, transparent, and agent-assisted assessments. Initially developed for Benton County, the system is configurable for any jurisdiction.

### Key Features

- **Matrix Data Upload**: Import and validate cost matrix data
- **Smart Analysis**: Get AI agent insights on cost anomalies and trends
- **Visual Explanations**: Understand valuation factors with SHAP-style visualization
- **Editable Interface**: Make expert adjustments with full audit trails
- **Defensible Exports**: Generate PDF and JSON documentation for appeals and audits
- **Jurisdiction Flexibility**: Deploy for any county with simple configuration

## 📋 Project Structure

```
terrabuild/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── utils/            # Utility functions
│   │   ├── config.ts         # Environment configuration
│   │   └── App.tsx           # Main application component
│   ├── public/               # Static assets
│   └── package.json          # Frontend dependencies
├── backend/                  # FastAPI backend service
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   ├── core/             # Core functionality
│   │   ├── models/           # Data models
│   │   ├── services/         # Business logic services
│   │   └── utils/            # Utility functions
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile            # Backend container definition
│   └── terrabuild_api.py     # Main API entry point
├── docs/                     # Documentation
│   ├── demo/                 # Demo scripts and guides
│   ├── deployment/           # Deployment guides
│   └── development/          # Development guides
├── docker/                   # Docker configurations
│   ├── docker-compose.yml    # Local development setup
│   └── Dockerfile.dev        # Development container
├── fly.toml                  # Fly.io deployment configuration
├── vercel.json               # Vercel frontend deployment configuration
└── README.md                 # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (Frontend)
- Python 3.9+ (Backend)
- Docker (optional, for containerized development)

### Local Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/your-org/terrabuild.git
cd terrabuild
```

2. **Set up the frontend**

```bash
cd frontend
npm install
npm run dev
```

3. **Set up the backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn terrabuild_api:app --reload --port 5001
```

4. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- API Documentation: http://localhost:5001/docs

### Environment Configuration

The system is configurable through environment variables:

#### Frontend (.env file)

```
REACT_APP_API_URL=http://localhost:5001
REACT_APP_JURISDICTION=Benton County, WA
REACT_APP_REGION=Eastern Washington
```

#### Backend (.env file)

```
PORT=5001
DATABASE_URL=your_database_url
ENVIRONMENT=development
```

## 🏗️ Deployment

### Backend Deployment (Fly.io)

1. Install the Fly.io CLI
2. Authenticate with `flyctl auth login`
3. Deploy with `flyctl deploy`

```bash
cd backend
flyctl deploy
```

### Frontend Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Set the following environment variables in Vercel:
   - `REACT_APP_API_URL`: URL of your deployed backend
   - `REACT_APP_JURISDICTION`: County/jurisdiction name
   - `REACT_APP_REGION`: Region name
3. Deploy using the Vercel CLI or GitHub integration

## 🧪 Demo

See the [demo guide](docs/demo/Benton_County_Demo_Script.md) for a complete walkthrough of the system's capabilities and presentation script.

## 📄 License

This project is proprietary and confidential. © 2025 TerraBuild.

## 🙏 Acknowledgements

- Benton County Assessor's Office for initial requirements and testing
- All contributors to the open source libraries used in this project