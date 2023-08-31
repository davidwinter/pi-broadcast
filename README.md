# 📢 pi-broadcast

> broadcast hostnames for traefik served apps on local network

Using Traefik and serving some apps with Docker? Using `.local` DNS hostnames and want to have those automatically broadcast on your network for automatic discovery? Use `pi-broadcast`!

## Usage

```sh
curl https://raw.githubusercontent.com/davidwinter/pi-broadcast/main/compose.prod.yml -o compose.yml
docker compose up -d
```

So long as you have other docker containers running, with Traefik labels that setup Hosts, then it will start to broadcast them. An example other project that you might have running that `pi-broadcast` detects and broadcasts automatically `uptime.home.local`, is:

```yml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    volumes:
      - ./uptime-kuma-data:/app/data
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - 3001:3001
    restart: always
    labels:
     - "traefik.http.routers.uptime-kuma.rule=Host(`uptime.home.local`)"
```
