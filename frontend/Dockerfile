FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm install -g expo-cli
RUN npx expo export:web

RUN npm install -g serve

EXPOSE 3000
CMD ["serve", "-s", "web-build", "-l", "3000"]