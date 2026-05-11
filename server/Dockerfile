# ใช้ Node.js เป็น base image
FROM node:18-alpine

# กำหนดโฟลเดอร์ทำงานใน container
WORKDIR /app

# คัดลอก package.json และติดตั้ง dependencies ก่อน
COPY package*.json ./
RUN npm install

# คัดลอกโค้ดทั้งหมดในโฟลเดอร์ backend เข้าไป
COPY . .

# เปิดพอร์ตที่ Express ของคุณใช้งาน (สมมติว่าเป็นพอร์ต 5000)
EXPOSE 4000

# คำสั่งสำหรับรันเซิร์ฟเวอร์
CMD ["npm", "start"] 