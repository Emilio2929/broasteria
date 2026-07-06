# Etapa 1: Compilar la aplicacion Angular
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Construye la version de produccion de la app
RUN npm run build --prod

# Etapa 2: Servir la aplicacion con Nginx
FROM nginx:alpine
# Copiamos la configuracion de enrutamiento para Angular (Single Page Application)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copiamos los archivos estaticos generados por Angular (Ajustado para Angular 17+)
COPY --from=builder /app/dist/broasterfrontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
