# keyes-ai network gate: the only network path out of the devcontainer.
# The proxy script is mounted at container start (read-only), so updating the
# CLI never requires a rebuild of this image.
#
# The container sits on the internal network (no route to the outside —
# the devcontainer's only egress) plus a normal egress network (so IT can
# reach the outside, and its control port can be published on 127.0.0.1).
FROM node:20-alpine

WORKDIR /keyes

CMD ["node", "/keyes/ai-network-proxy.js"]
