FROM node:25-alpine

WORKDIR /workspace/examples/resizing-terminal

# Node 25 no longer ships Corepack.
RUN npm install --global pnpm@10.30.3

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json /workspace/
COPY lib /workspace/lib
COPY src /workspace/src
COPY examples/resizing-terminal /workspace/examples/resizing-terminal

RUN pnpm install --filter resizing-terminal-demo... --no-frozen-lockfile

EXPOSE 5173

CMD ["pnpm", "run", "dev:client"]
