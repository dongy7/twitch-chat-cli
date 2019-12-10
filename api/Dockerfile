FROM node:latest

WORKDIR /app
COPY package.json /app

RUN yarn install
COPY . . 

COPY wait-for-it.sh wait-for-it.sh 
RUN chmod +x wait-for-it.sh

EXPOSE 3000