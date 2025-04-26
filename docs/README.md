# Benton County Building Cost System (BCBS)

## Overview

The Benton County Building Cost System (BCBS) is a sophisticated SaaS platform for building cost management in Benton County, Washington. It is designed to revolutionize infrastructure cost calculation and property assessment through cutting-edge technology.

## Technical Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Supabase integration
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Authentication**: Supabase Auth
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions, Docker
- **Infrastructure**: Terraform on AWS

## Getting Started

### Prerequisites

- Node.js 20.x or later
- Docker and Docker Compose
- PostgreSQL (local or remote)
- Git

### Development Environment

The easiest way to start developing is using our Docker environment:

```bash
# Clone the repository
git clone <repository-url>
cd bcbs

# Start the Docker development environment
./scripts/docker-dev.sh up

# Access the application at http://localhost:5000
```

For manual setup without Docker:

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.dev .env.local
# Edit .env.local with your configuration

# Start the development server
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## CI/CD Infrastructure

The project includes a comprehensive CI/CD infrastructure to ensure code quality and streamline deployment:

- **Docker Environment**: Consistent development and testing environment
- **GitHub Actions**: Automated testing and building
- **Terraform**: Infrastructure as Code for AWS deployment
- **Deployment Scripts**: Simplified deployment to multiple environments

For more information, see the [CI/CD documentation](./ci_cd_index.md).

## Documentation

- [API Endpoints](../API-ENDPOINTS.md): API documentation
- [Development Guidelines](./development_guidelines.md): Coding standards and practices
- [CI/CD Infrastructure](./ci_cd_index.md): CI/CD documentation
- [Property Data Import](../PROPERTY_DATA_IMPORT.md): Data import documentation

## Project Structure

```
.
├── client/                  # Frontend React application
├── server/                  # Backend Node.js API
├── shared/                  # Shared code and types
├── docs/                    # Documentation
├── tests/                   # Test files
├── scripts/                 # Helper scripts
├── terrafusion/             # Terraform infrastructure
├── .github/                 # GitHub Actions workflows
└── docker-compose.yml       # Docker development environment
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Submit a pull request

All pull requests will trigger the CI pipeline, which runs tests and checks code quality.

## License

This project is licensed under the MIT License - see the LICENSE file for details.