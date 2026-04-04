# Use Node.js 18 alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy all other project files
COPY . .

# Expose development port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
