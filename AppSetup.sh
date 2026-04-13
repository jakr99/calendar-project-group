npm install
node src/database/databaseSetup.js
docker build -t syncup-dev .
docker run -p 3001:3001 -p 4321:4321 -v ${PWD}/src/database/calendar.db:/app/src/database/calendar.db syncup-dev