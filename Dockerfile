FROM node:carbon
MAINTAINER Mat Bentley <mathewkbentley@gmail.com>

RUN mkdir -p /usr/src/app/

COPY ./ /usr/src/app/

WORKDIR /usr/src/app/node_modules/inheretic

RUN npm install && npm test
