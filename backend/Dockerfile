FROM golang:1.22-alpine AS builder
WORKDIR /src

# cache deps
COPY go.mod go.sum ./
RUN go mod download

COPY . ./

# build statically
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags='-s -w' -o /out/server ./cmd/server

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
COPY --from=builder /out/server /usr/local/bin/server
# include SQL migrations so the runtime container can access them
COPY --from=builder /src/migrations /app/migrations
WORKDIR /app
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/server"]
