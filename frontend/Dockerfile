# Frontend image — two stages: build with Node, serve with nginx.
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Production build uses src/environments/environment.ts (baseUrl = '/api').
RUN npm run build -- --configuration production


FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
