FROM node:latest
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json package-lock.json /usr/src/app/
RUN npm install --registry https://registry.npmmirror.com/
COPY . /usr/src/app
RUN npm run tsc
EXPOSE 7006
CMD npx egg-scripts start --title=egg-server-p-test-end

