FROM node:current
WORKDIR /app
COPY . .
RUN yarn install
COPY . /app
EXPOSE 3000
CMD [ "node", "src/index.js" ]
