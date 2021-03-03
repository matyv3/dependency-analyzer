
FROM node:14-alpine

WORKDIR /usr/app

COPY . .

EXPOSE 3000

RUN npm i 

CMD ["npm","start"]
