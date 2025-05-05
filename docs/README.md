# TerraBuild Documentation

This directory contains comprehensive documentation for the TerraBuild County Valuation Platform.

## Documentation Sections

### Deployment

- [Fly.io Deployment Guide](deployment/fly_io_deployment.md) - Instructions for deploying the backend API to Fly.io
- [Vercel Deployment Guide](deployment/vercel_deployment.md) - Instructions for deploying the frontend to Vercel

### Development

- [Database Setup](development/database_setup.md) - Guide for setting up and configuring the database
- [Environment Configuration](development/environment_config.md) - Details on environment variables and configuration
- [Contributing Guidelines](../CONTRIBUTING.md) - Guidelines for contributing to the project

### Demo

- [TerraBuild Stakeholder Demo](demo/TerraBuild_Stakeholder_Demo.md) - Script and setup for stakeholder demonstrations
- [Benton County Demo Script](demo/Benton_County_Demo_Script.md) - Specific demo script for Benton County presentations

## Architecture Overview

TerraBuild follows a modern web application architecture:

1. **Frontend**
   - React-based single-page application
   - Tailwind CSS for styling
   - Component-based architecture
   - API client for backend communication

2. **Backend**
   - FastAPI Python server
   - RESTful API endpoints
   - Session management
   - PDF and JSON export generation

3. **Storage**
   - PostgreSQL database (production)
   - File-based storage (development)
   - Session data persistence

4. **Deployment**
   - Frontend on Vercel
   - Backend on Fly.io
   - Database on managed PostgreSQL service

## Key Features

- **Matrix Data Management**: Upload, validation and editing of cost matrix data
- **AI Agent Insights**: Automated analysis and insights generation
- **Valuation Visualization**: Timeline charts and scenario comparisons
- **Export Functionality**: PDF and JSON exports with full audit trail
- **County Configuration**: Dynamic configuration for different jurisdictions

## Getting Started

If you're new to the project, start with:

1. Read the main [README.md](../README.md) file
2. Follow the [development setup instructions](../CONTRIBUTING.md#development-setup)
3. Review the [architecture overview](#architecture-overview)
4. Explore the specific documentation sections relevant to your work

## Documentation Contribution

We welcome improvements to the documentation:

1. Submit corrections or additions via pull requests
2. Follow the same formatting conventions as existing docs
3. Update table of contents when adding new sections
4. Test any code examples or commands before submitting