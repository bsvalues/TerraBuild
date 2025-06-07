# Contributing to TerraBuild

Thank you for your interest in contributing to the TerraBuild platform! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project is dedicated to providing a harassment-free experience for everyone. We do not tolerate harassment of participants in any form.

## Development Setup

### Prerequisites

- Node.js 18+ (Frontend)
- Python 3.9+ (Backend)
- Docker and Docker Compose (optional, for containerized development)
- Git

### Local Development Environment

1. **Fork and clone the repository**

```bash
git clone https://github.com/your-username/terrabuild.git
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

4. **Docker setup (alternative)**

```bash
docker-compose -f docker/docker-compose.yml up -d
```

## Development Workflow

1. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**

3. **Run tests**

```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
pytest
```

4. **Commit your changes**

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add new feature
fix: fix bug in X
docs: update documentation
style: format code
refactor: restructure code without changing functionality
test: add or update tests
chore: update build scripts, etc.
```

5. **Push your changes and create a pull request**

```bash
git push origin feature/your-feature-name
```

## Coding Standards

### Frontend (TypeScript/React)

- Use functional components with hooks
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use TypeScript for type safety
- Write meaningful comments for complex logic
- Keep components small and focused on a single responsibility

### Backend (Python/FastAPI)

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) standards
- Use type hints
- Write docstrings for all functions and classes
- Keep functions small and focused on a single responsibility

## Testing

### Frontend Testing

- Write tests for all components and services
- Use Jest and React Testing Library
- Aim for at least 80% code coverage

### Backend Testing

- Write tests for all API endpoints and services
- Use pytest
- Aim for at least 80% code coverage

## Documentation

- Update documentation when adding/changing features
- Document all environment variables in `.env.example` files
- Provide detailed comments for complex code sections
- Follow JSDoc/docstring conventions

## Pull Request Process

1. Update the README.md or relevant documentation with details of changes
2. Run all tests and ensure they pass
3. Update the CHANGELOG.md with details of changes
4. The PR should be reviewed by at least one maintainer
5. Once approved, a maintainer will merge your PR

Thank you for contributing to TerraBuild!

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)