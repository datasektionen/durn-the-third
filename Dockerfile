# Can't be heigher than node 16 since 17+ uses a newer version of OpenSSL
# which webpack apparently does not sypport (at 2022-09-26)
FROM node:19-alpine AS webpack_builder 
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install
COPY . /app/

RUN npm run build

FROM golang:1.24.0-alpine AS prod
WORKDIR /app
COPY go.mod go.sum /app/
RUN go mod download
COPY . /app/
COPY --from=webpack_builder /app/dist /app/dist
RUN go build 
EXPOSE 3000
CMD [ "./durn" ]

FROM prod AS dev

WORKDIR /app

RUN apk --no-cache add nginx

RUN echo "nginx &" >> run.sh
RUN echo "./durn" >> run.sh
RUN chmod +x run.sh
