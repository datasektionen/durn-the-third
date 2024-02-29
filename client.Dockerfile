FROM node:19-alpine
WORKDIR /app
COPY client/package.json client/package-lock.json /app/
RUN npm install
COPY client/ /app/
EXPOSE 8080

CMD ["npm", "start"]