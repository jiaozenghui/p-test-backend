FROM node:20-alpine3.20
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app
RUN npm run tsc
EXPOSE 7006
CMD npx egg-scripts start --title=egg-server-p-test-end

