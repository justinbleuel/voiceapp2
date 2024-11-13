# Use Node.js as base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the app
RUN npm install -g expo-cli
RUN npx expo export:web

# Install serve
RUN npm install -g serve

# Expose the port
EXPOSE 3000

# Start the server
CMD ["npx", "serve", "web-build", "-l", "3000"]