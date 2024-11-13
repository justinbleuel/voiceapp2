FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install expo CLI
RUN npm install -g expo-cli

# Copy the rest of the application
COPY . .

# Build the app
RUN npx expo export:web || (echo "Build failed" && exit 1)

# Install serve
RUN npm install -g serve

# Expose the port
EXPOSE 3000

# Start the server
CMD ["npx", "serve", "web-build", "-l", "3000"]