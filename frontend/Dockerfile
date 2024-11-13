# Use Node.js as base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with verbose logging
RUN npm install --verbose

# Install expo CLI globally
RUN npm install -g expo-cli@latest

# Copy the rest of the application
COPY . .

# Create the build directory
RUN mkdir -p web-build

# Build the app with debugging
RUN npx expo export:web --verbose || (echo "Build failed" && exit 1)

# Install serve
RUN npm install -g serve

# Expose the port
EXPOSE 3000

# Start the server
CMD ["npx", "serve", "web-build", "-l", "3000"]