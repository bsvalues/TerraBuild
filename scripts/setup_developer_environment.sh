#!/bin/bash

# TerraBuild Developer Environment Setup Script
# This script helps developers set up their local environment for working on the TerraBuild project

set -e

# Default values
INSTALL_DEPS=true
SETUP_DB=true
SETUP_AWS=true
CLONE_REPO=false
REPO_URL="https://github.com/benton-county/terrabuild.git"
WORKSPACE_DIR="$HOME/terrabuild-workspace"

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
  echo -e "${BLUE}[TerraBuild Setup]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
  echo -e "${RED}[✗]${NC} $1"
}

# Print help message
show_help() {
  echo "TerraBuild Developer Environment Setup Script"
  echo ""
  echo "This script helps developers set up their local environment for TerraBuild development."
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  --skip-deps         Skip installation of dependencies"
  echo "  --skip-db           Skip PostgreSQL database setup"
  echo "  --skip-aws          Skip AWS CLI configuration"
  echo "  --clone-repo        Clone the repository (default: false)"
  echo "  --repo-url <url>    Repository URL (default: $REPO_URL)"
  echo "  --workspace <dir>   Workspace directory (default: $WORKSPACE_DIR)"
  echo "  --help              Show this help message"
  echo ""
  exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --skip-deps)
      INSTALL_DEPS=false
      shift
      ;;
    --skip-db)
      SETUP_DB=false
      shift
      ;;
    --skip-aws)
      SETUP_AWS=false
      shift
      ;;
    --clone-repo)
      CLONE_REPO=true
      shift
      ;;
    --repo-url)
      REPO_URL="$2"
      shift 2
      ;;
    --workspace)
      WORKSPACE_DIR="$2"
      shift 2
      ;;
    --help)
      show_help
      ;;
    *)
      print_error "Unknown option: $1"
      show_help
      ;;
  esac
done

# Check operating system
detect_os() {
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    OS="windows"
  else
    print_error "Unsupported operating system: $OSTYPE"
    exit 1
  fi
  print_message "Detected operating system: $OS"
}

# Install dependencies based on OS
install_dependencies() {
  print_message "Installing dependencies..."
  
  if [[ "$OS" == "linux" ]]; then
    # Check if we're on Ubuntu/Debian or other
    if command -v apt-get &> /dev/null; then
      print_message "Using apt package manager"
      sudo apt-get update
      sudo apt-get install -y nodejs npm git postgresql-client docker.io docker-compose jq curl wget unzip
      
      # Install NVM for Node.js version management
      if ! command -v nvm &> /dev/null; then
        print_message "Installing NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
      fi
      
      nvm install 20
      nvm use 20
      
    elif command -v yum &> /dev/null; then
      print_message "Using yum package manager"
      sudo yum update -y
      sudo yum install -y nodejs npm git postgresql jq curl wget unzip
      
      # Install Docker on Amazon Linux / RHEL / CentOS
      sudo yum install -y docker
      sudo systemctl enable docker
      sudo systemctl start docker
      sudo usermod -aG docker $USER
      
      # Install Docker Compose
      sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
      sudo chmod +x /usr/local/bin/docker-compose
      
      # Install NVM
      if ! command -v nvm &> /dev/null; then
        print_message "Installing NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
      fi
      
      nvm install 20
      nvm use 20
    else
      print_error "Unsupported Linux distribution"
      exit 1
    fi
    
  elif [[ "$OS" == "macos" ]]; then
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
      print_message "Installing Homebrew..."
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    print_message "Installing dependencies with Homebrew..."
    brew update
    brew install node postgresql docker docker-compose jq curl wget
    
    # Install Docker Desktop for Mac
    if ! command -v docker &> /dev/null; then
      print_message "Please download and install Docker Desktop for Mac from https://www.docker.com/products/docker-desktop/"
    fi
    
    # Install NVM for Node.js version management
    if ! command -v nvm &> /dev/null; then
      print_message "Installing NVM..."
      brew install nvm
      mkdir -p ~/.nvm
      
      # Add NVM config to shell profile
      if [[ -f ~/.zshrc ]]; then
        echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
        echo '[ -s "/usr/local/opt/nvm/nvm.sh" ] && . "/usr/local/opt/nvm/nvm.sh"' >> ~/.zshrc
        source ~/.zshrc
      elif [[ -f ~/.bash_profile ]]; then
        echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bash_profile
        echo '[ -s "/usr/local/opt/nvm/nvm.sh" ] && . "/usr/local/opt/nvm/nvm.sh"' >> ~/.bash_profile
        source ~/.bash_profile
      fi
    fi
    
    nvm install 20
    nvm use 20
    
  elif [[ "$OS" == "windows" ]]; then
    print_message "For Windows, please install the following tools manually:"
    print_message "1. Node.js 20 from https://nodejs.org/"
    print_message "2. Git from https://git-scm.com/download/win"
    print_message "3. Docker Desktop from https://www.docker.com/products/docker-desktop/"
    print_message "4. PostgreSQL Client from https://www.postgresql.org/download/windows/"
    print_message "5. AWS CLI from https://aws.amazon.com/cli/"
    
    read -p "Press Enter when you have installed these tools..." </dev/tty
    
    # Verify installations
    if command -v node &> /dev/null; then
      print_success "Node.js is installed: $(node --version)"
    else
      print_error "Node.js is not installed or not in PATH"
    fi
    
    if command -v git &> /dev/null; then
      print_success "Git is installed: $(git --version)"
    else
      print_error "Git is not installed or not in PATH"
    fi
    
    if command -v docker &> /dev/null; then
      print_success "Docker is installed: $(docker --version)"
    else
      print_error "Docker is not installed or not in PATH"
    fi
  fi
  
  # Install Terraform
  if ! command -v terraform &> /dev/null; then
    print_message "Installing Terraform..."
    
    if [[ "$OS" == "linux" ]]; then
      curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
      sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
      sudo apt-get update && sudo apt-get install terraform
    elif [[ "$OS" == "macos" ]]; then
      brew tap hashicorp/tap
      brew install hashicorp/tap/terraform
    elif [[ "$OS" == "windows" ]]; then
      print_message "Please install Terraform from https://www.terraform.io/downloads.html"
    fi
  fi
  
  # Install AWS CLI
  if ! command -v aws &> /dev/null; then
    print_message "Installing AWS CLI..."
    
    if [[ "$OS" == "linux" ]]; then
      curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
      unzip awscliv2.zip
      sudo ./aws/install
      rm -rf aws awscliv2.zip
    elif [[ "$OS" == "macos" ]]; then
      curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
      sudo installer -pkg AWSCLIV2.pkg -target /
      rm AWSCLIV2.pkg
    elif [[ "$OS" == "windows" ]]; then
      print_message "Please install AWS CLI from https://aws.amazon.com/cli/"
    fi
  fi
  
  print_success "Dependencies installed successfully"
}

# Setup PostgreSQL database
setup_database() {
  print_message "Setting up PostgreSQL database..."
  
  # Check if PostgreSQL is installed
  if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL client is not installed"
    return 1
  fi
  
  # For local development, use Docker to run PostgreSQL
  print_message "Starting PostgreSQL container..."
  
  # Create a docker network for the application
  docker network create terrabuild-network 2>/dev/null || true
  
  # Run PostgreSQL container
  if ! docker ps | grep -q "terrabuild-postgres"; then
    docker run --name terrabuild-postgres \
      --network terrabuild-network \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=terrabuild \
      -p 5432:5432 \
      -d postgres:15
    
    # Wait for PostgreSQL to start
    print_message "Waiting for PostgreSQL to start..."
    sleep 5
    
    # Test connection
    if docker exec terrabuild-postgres pg_isready -h localhost -U postgres; then
      print_success "PostgreSQL container is running"
    else
      print_error "Failed to start PostgreSQL container"
      return 1
    fi
  else
    print_success "PostgreSQL container is already running"
  fi
  
  # Create a .env file with the database connection string
  print_message "Creating .env file with database configuration..."
  
  mkdir -p "$WORKSPACE_DIR"
  
  if [[ -f "$WORKSPACE_DIR/.env" ]]; then
    # Backup existing .env file
    cp "$WORKSPACE_DIR/.env" "$WORKSPACE_DIR/.env.backup-$(date +%Y%m%d%H%M%S)"
  fi
  
  cat > "$WORKSPACE_DIR/.env" << EOF
# TerraBuild Environment Configuration
# Generated by setup_developer_environment.sh script

# Database connection
DATABASE_URL=postgres://postgres:postgres@localhost:5432/terrabuild

# Environment
NODE_ENV=development
PORT=5000

# Local Development
VITE_API_URL=http://localhost:5000
EOF
  
  print_success "Database setup complete"
}

# Configure AWS CLI
setup_aws() {
  print_message "Setting up AWS CLI..."
  
  # Check if AWS CLI is installed
  if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    return 1
  fi
  
  # Check if AWS is already configured
  if [[ -f ~/.aws/credentials ]]; then
    print_message "AWS CLI is already configured"
    print_message "To reconfigure, run 'aws configure'"
    return 0
  fi
  
  # Configure AWS CLI
  print_message "Please enter your AWS credentials:"
  aws configure
  
  if [[ $? -eq 0 ]]; then
    print_success "AWS CLI configured successfully"
  else
    print_error "Failed to configure AWS CLI"
    return 1
  fi
}

# Clone the repository
clone_repository() {
  print_message "Cloning repository: $REPO_URL into $WORKSPACE_DIR"
  
  if [[ -d "$WORKSPACE_DIR/.git" ]]; then
    print_warning "Repository already exists in $WORKSPACE_DIR"
    read -p "Do you want to pull the latest changes? (y/n) " -n 1 -r </dev/tty
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      cd "$WORKSPACE_DIR"
      git pull
      print_success "Repository updated successfully"
    fi
  else
    # Create the workspace directory if it doesn't exist
    mkdir -p "$WORKSPACE_DIR"
    
    # Clone the repository
    git clone "$REPO_URL" "$WORKSPACE_DIR"
    
    if [[ $? -eq 0 ]]; then
      print_success "Repository cloned successfully"
    else
      print_error "Failed to clone repository"
      return 1
    fi
  fi
}

# Main script execution
print_message "Starting TerraBuild developer environment setup"

# Detect operating system
detect_os

# Install dependencies if requested
if [[ "$INSTALL_DEPS" == "true" ]]; then
  install_dependencies
else
  print_message "Skipping dependency installation"
fi

# Setup PostgreSQL database if requested
if [[ "$SETUP_DB" == "true" ]]; then
  setup_database
else
  print_message "Skipping database setup"
fi

# Configure AWS CLI if requested
if [[ "$SETUP_AWS" == "true" ]]; then
  setup_aws
else
  print_message "Skipping AWS CLI configuration"
fi

# Clone the repository if requested
if [[ "$CLONE_REPO" == "true" ]]; then
  clone_repository
else
  print_message "Skipping repository cloning"
  
  # Just create the workspace directory
  mkdir -p "$WORKSPACE_DIR"
fi

# Final instructions
print_message "===================================================="
print_message "TerraBuild developer environment setup complete!"
print_message "===================================================="
print_message "Next steps:"
print_message "1. Navigate to the workspace directory: cd $WORKSPACE_DIR"
print_message "2. Install project dependencies: npm install"
print_message "3. Initialize the database: npm run db:push"
print_message "4. Start the development server: npm run dev"
print_message "5. Access the application at: http://localhost:5000"
print_message "===================================================="

print_message "Would you like to perform these steps now? (y/n)"
read -n 1 -r </dev/tty
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  cd "$WORKSPACE_DIR"
  
  print_message "Installing project dependencies..."
  npm install
  
  print_message "Initializing the database..."
  npm run db:push
  
  print_message "Starting the development server..."
  npm run dev
else
  print_message "You can run these steps manually later"
fi