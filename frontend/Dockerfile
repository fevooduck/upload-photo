# --- Estágio 1: Instalação de Dependências ---
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

# --- Estágio 2: Build ---
FROM node:22-alpine AS builder
WORKDIR /app

# Copia as dependências do estágio anterior
COPY --from=deps /app/node_modules ./node_modules
# Copia o resto do código
COPY . .

# Executa o build de produção do Next.js
RUN npm run build

# --- Estágio 3: Produção ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copia apenas os artefatos de build necessários do estágio anterior
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expõe a porta que o Next.js usa
EXPOSE 3000

# O comando para iniciar o servidor otimizado do Next.js
CMD ["npm", "start"]