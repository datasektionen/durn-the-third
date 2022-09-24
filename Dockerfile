FROM ubuntu:20.04

ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update
RUN apt-get install -y \
  golang \
  npm

RUN mkdir -p /app
COPY . /app
WORKDIR /app
EXPOSE 3000


RUN npm install 
RUN npm run build

RUN go install 

CMD [ "go" "run" ]