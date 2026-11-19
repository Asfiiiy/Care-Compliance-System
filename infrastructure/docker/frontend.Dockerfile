FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm@11.10.0

COPY apps/frontend/package.json ./

ENV CI=true
RUN echo "dangerouslyAllowAllBuilds: true" > pnpm-workspace.yaml
RUN pnpm install --no-frozen-lockfile

COPY apps/frontend .

# Set build-time API base URL for client bundle compilation
ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]