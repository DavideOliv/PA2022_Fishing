FROM node:lts-stretch-slim
RUN apt-get update && apt-get upgrade -y
RUN apt-get install watch -y
WORKDIR /usr/src/app
COPY . .
RUN npm run build
RUN npm install
CMD ["npm", "run", "start"]