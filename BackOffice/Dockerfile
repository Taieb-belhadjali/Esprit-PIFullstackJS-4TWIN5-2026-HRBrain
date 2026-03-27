# Use Node image
FROM node:18

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Expose port (must match main.ts)
EXPOSE 3000

# Start the app
CMD ["node", "dist/main"]
