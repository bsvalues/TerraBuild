FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Default command to run the development server
CMD ["npm", "run", "dev"]

# Expose the port the app runs on
EXPOSE 5000