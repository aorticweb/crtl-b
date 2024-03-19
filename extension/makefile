build: build-tailwind
	npm run build
	mkdir -p ./dist/target/content/styles
	mv  ./src/content/styles/output.css ./dist/target/content/styles/

build-tailwind:
	npx tailwindcss -i ./src/content/styles/styles.css -o ./src/content/styles/output.css

css-factory-watch:
	npx tailwindcss -i ./src/content/styles/styles.css -o ./src/content/styles/output.css --watch
