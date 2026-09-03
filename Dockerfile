# One image for the whole monorepo. Each floo service runs it with its own
# start command, so the pnpm workspace links resolve exactly as they do
# locally and there is only one build to keep working.
FROM node:22-slim

WORKDIR /app
RUN corepack enable

COPY . .

# Dev dependencies are needed for `next build` and `tsc`, so NODE_ENV stays
# unset until after the build.
RUN pnpm install --frozen-lockfile
RUN pnpm -r --if-present build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Overridden per service by `command` in floo.app.toml.
CMD ["pnpm", "--filter", "@galleon/platform-web", "exec", "next", "start", "apps/platform-web", "-H", "0.0.0.0"]
