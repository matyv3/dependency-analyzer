
# Dependency Analizer

## Run with Docker

```
docker build . -t dependency_analyzer && docker run --name analyzer -p 3000:3000 -d dependency_analyzer:latest
```

## Run with NPM

npm 13 or higher is required 

```
npm i && npm start
```

## How to use it

- Open `http://localhost:3000` on your browser and use the web version
- use the following curl command and replace CSV file path: 
	```
	curl --request POST \
	--url http://localhost:3000/ \
	--header 'content-type: multipart/form-data;' \
	--form file=<PATH_TO_CSV_FILE>
	```

