build: build-wasm-backend build-chrome-extension

build-wasm-backend:
	wasm-pack build --target web
	rm -rf extension/src/background/ctrl_b_wasm/
	mv -f pkg/ extension/src/background/ctrl_b_wasm/

build-chrome-extension:
	cd extension && make build
