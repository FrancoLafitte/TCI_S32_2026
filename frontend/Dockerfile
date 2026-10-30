# Etapa 1: compilar la app React con Node + pnpm
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Las URLs se "hornean" en la compilación (Vite reemplaza import.meta.env.*)
ARG VITE_API_URL=http://localhost:4010
ARG VITE_HEALTH_URL=http://localhost:8000/health
ENV VITE_API_URL=$VITE_API_URL VITE_HEALTH_URL=$VITE_HEALTH_URL
RUN pnpm build

# Etapa 2: servir los archivos estáticos con nginx (imagen chica)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
