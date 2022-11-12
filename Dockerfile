# Can't be heigher than node 16 since 17+ uses a newer version of OpenSSL
# which webpack apparently does not sypport (at 2022-09-26)
FROM node:19-alpine AS webpack_builder 
COPY . /app
WORKDIR /app
RUN npm install
RUN npm run build

FROM golang:1.19
COPY . /app
WORKDIR /app
RUN go mod download
COPY --from=webpack_builder /app/dist /app/dist
EXPOSE 3000
CMD [ "go", "run", "main.go" ]