FROM node:22-alpine

WORKDIR /app

COPY apps/backend/package.json ./

RUN corepack enable
RUN corepack prepare pnpm@11.10.0 --activate

RUN pnpm install

COPY apps/backend .

EXPOSE 3000

CMD ["pnpm", "start:dev"]