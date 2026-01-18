FROM node:20-alpine

WORKDIR /app

# 1. Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# 2. Copy all source code
COPY . .

# 3. Build the React Frontend
# This runs "vite build" and creates the /app/dist folder
RUN npm run build

# 4. Expose the internal port
EXPOSE 3000

# 5. Start the backend (which now also serves the frontend)
CMD ["npm", "run", "server"]