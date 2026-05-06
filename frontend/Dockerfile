FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the app (optional if running dev, but good for checks)
# RUN npm run build 

EXPOSE 5173

# Vite will now use the PORT env var and 0.0.0.0 host from vite.config.ts
CMD ["npm", "run", "dev", "--", "--host"]
