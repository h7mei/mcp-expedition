# Future remote ResearchOps server image.
# Not used in the initial stdio milestone.
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY servers/researchops-server/package.json servers/researchops-server/
COPY packages/shared-schemas/package.json packages/shared-schemas/
RUN pnpm install --filter @mcp-expedition/researchops-server... --frozen-lockfile

FROM base AS build
COPY --from=deps /app /app
COPY . .
RUN pnpm --filter @mcp-expedition/researchops-server build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/servers/researchops-server /app/servers/researchops-server
COPY --from=build /app/node_modules /app/node_modules
# ENTRYPOINT will be defined when Streamable HTTP is implemented.
CMD ["node", "servers/researchops-server/dist/index.js"]
