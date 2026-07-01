FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install

EXPOSE 3000
CMD ["npm", "run", "dev"]
