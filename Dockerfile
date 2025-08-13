# Can't be heigher than node 16 since 17+ uses a newer version of OpenSSL
# which webpack apparently does not sypport (at 2022-09-26)
FROM node:19-alpine AS webpack_builder 
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install
COPY . /app/
RUN npm run build

FROM golang:1.19.3
WORKDIR /app
COPY go.mod go.sum /app/
RUN go mod download
COPY . /app/
COPY --from=webpack_builder /app/dist /app/dist
RUN go build 
EXPOSE 3000
CMD [ "./durn" ]
