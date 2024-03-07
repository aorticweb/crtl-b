build: build-wasm-backend build-chrome-extension

build-wasm-backend:
	wasm-pack build --target web
	rm -rf extension/src/content/ctrl_b_wasm/
	mv -f pkg/ extension/src/content/ctrl_b_wasm/

build-chrome-extension:
	cd extension && npm run build
	# cp -r ./extension/src/ctrl_b_wasm/ ./extension/dist/target/ctrl_b_wasm/
