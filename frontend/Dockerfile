# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Final stage to serve the app
FROM node:20-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist

# Render provides the PORT environment variable automatically
CMD ["sh", "-c", "serve -s dist -l $PORT"]
