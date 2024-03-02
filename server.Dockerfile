FROM golang:1.19.3-alpine

WORKDIR /app
COPY go.mod go.sum /app/
RUN go mod download
COPY . /app/
EXPOSE 3000

CMD [ "go", "run", "main.go" ]
