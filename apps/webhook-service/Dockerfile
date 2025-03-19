FROM oven/bun:1.0.0

WORKDIR /app

COPY package.json .
COPY tsconfig.json .
COPY src src

RUN bun install
RUN bun prisma generate
RUN bun build src/index.ts --outdir dist

CMD ["bun", "run", "dist/index.js"]