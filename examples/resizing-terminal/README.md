# xterm-messaging-demo

Minimal demo for `xterm-multiplex-addon` with:

- browser client (`vite`)
- websocket bridge server (`hono` + `ssh2`)
- SSH target container (Debian slim + OpenSSH)

## Run

```bash
docker compose up --build
```

Open: `http://localhost:5173`

## Services

- `client`: frontend on `5173`
- `server`: websocket endpoint on `ws://localhost:3000/ws`
- `ssh`: OpenSSH on `localhost:2222` (password auth)

## Credentials

Set in `.env` (or compose env):

- `SSH_USER`
- `SSH_PASS`
