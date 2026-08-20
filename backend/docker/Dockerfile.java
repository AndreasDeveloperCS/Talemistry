FROM eclipse-temurin:20-jdk-alpine

WORKDIR /app

RUN apk add --no-cache bash

CMD ["tail", "-f", "/dev/null"]