#!/bin/sh
set -eu

SSH_USER="${SSH_USER:-test}"
SSH_PASS="${SSH_PASS:-test}"

if ! id "$SSH_USER" >/dev/null 2>&1; then
  useradd -m -s /bin/bash "$SSH_USER"
fi

echo "${SSH_USER}:${SSH_PASS}" | chpasswd

mkdir -p /var/run/sshd

exec /usr/sbin/sshd -D -e
