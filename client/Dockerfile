# --- Stage 1: Build ---
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# คำสั่ง build React (ถ้าใช้ Vite จะได้โฟลเดอร์ dist, ถ้าใช้ Create React App จะได้โฟลเดอร์ build)
RUN npm run build 

# --- Stage 2: Serve ด้วย Nginx ---
FROM nginx:alpine
# ก๊อปปี้ไฟล์ที่ build เสร็จแล้วจาก Stage 1 มาไว้ที่โฟลเดอร์ของ Nginx
# หมายเหตุ: เปลี่ยน /app/dist เป็น /app/build ถ้าคุณใช้ Create React App
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# เปิดพอร์ต 80
EXPOSE 80

# สั่งรัน Nginx
CMD ["nginx", "-g", "daemon off;"]