FROM node:lts-alpine as builder

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:lts-alpine
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY --from=builder /usr/src/app/dist ./dist
CMD [ "node", "dist/index.js" ]
