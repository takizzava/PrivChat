FROM elixir:1.17-alpine

ENV MIX_ENV=dev \
    LANG=C.UTF-8

RUN apk add --no-cache build-base git bash openssl-dev inotify-tools postgresql-client

WORKDIR /app

RUN mix local.hex --force && \
    mix local.rebar --force

COPY mix.exs ./
COPY config ./config

RUN mix deps.get

COPY lib ./lib
COPY priv ./priv

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 4000

CMD ["./entrypoint.sh"]
