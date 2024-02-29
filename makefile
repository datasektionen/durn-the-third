.PHONY: dev

dev: init build #run

prod: init build run-server

stop:
	killall npm
	killall fresh


init: init-server init-client

init-server:
	go mod download

init-client:
	npm install

build: build-server build-client

build-server:
	go build

build-client:
	cd client && npm run build

# run: run-server run-client

run-server:
	fresh

run-client:
	cd client && npm run dev
