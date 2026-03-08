FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    openssh-server \
    bash \
    vim-tiny \
    less \
    curl \
    ca-certificates \
    procps \
    iproute2 \
    net-tools \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /var/run/sshd /etc/ssh/sshd_config.d \
  && sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication yes/' /etc/ssh/sshd_config \
  && sed -i 's/^#\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config \
  && sed -i 's/^#\?UsePAM .*/UsePAM yes/' /etc/ssh/sshd_config \
  && echo "ChallengeResponseAuthentication no" > /etc/ssh/sshd_config.d/99-local.conf \
  && echo "Port 2222" >> /etc/ssh/sshd_config.d/99-local.conf

COPY docker/ssh-entrypoint.sh /usr/local/bin/ssh-entrypoint.sh
RUN chmod +x /usr/local/bin/ssh-entrypoint.sh

EXPOSE 2222

CMD ["/usr/local/bin/ssh-entrypoint.sh"]
