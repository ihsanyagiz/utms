# Step 1: Build the React frontend
FROM node:20-alpine AS build-frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Set up the backend server and run it
FROM node:20-alpine
WORKDIR /app

# Copy backend package configuration
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy built frontend dist folder
COPY --from=build-frontend /app/dist ./dist

# Copy backend source code and shared utils
COPY server/ ./server/
COPY src/utils/ ./src/utils/

# Expose backend port (which also serves the frontend in production)
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
WORKDIR /app/server

# Start the Express server. Run `node seed.js` manually only for demo data.
CMD ["node", "index.js"]
