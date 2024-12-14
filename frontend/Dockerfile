# Используем официальный образ Node.js для сборки
FROM node:18 AS build

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы проекта
COPY . .

# Строим проект
RUN npm run build --prod

# Проверяем содержимое директории dist/frontend
RUN ls -la /app/dist/frontend

# Используем официальный образ Nginx для обслуживания статических файлов
FROM nginx:alpine

# Копируем собранные файлы в директорию Nginx
COPY --from=build /app/dist/frontend /usr/share/nginx/html

# Копируем файл конфигурации Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 8080
EXPOSE 8080

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]
