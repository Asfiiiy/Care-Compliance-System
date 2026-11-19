FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm@11.10.0

COPY apps/backend/package.json ./

ENV CI=true
RUN echo "dangerouslyAllowAllBuilds: true" > pnpm-workspace.yaml
RUN pnpm install --no-frozen-lockfile

COPY apps/backend .

# Generate Prisma Client & Build backend dist bundle at build-time
RUN npx prisma generate
RUN pnpm build

EXPOSE 3001

CMD ["pnpm", "start:prod"]