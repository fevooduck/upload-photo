# --- Estágio 1: Build ---
# Usa uma imagem Node.js completa para instalar dependências
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Copia os arquivos de dependência e instala tudo (incluindo devDependencies)
COPY package*.json ./
RUN npm install

# Copia o resto do código da aplicação
COPY . .

# --- Estágio 2: Produção ---
# Começa de uma imagem limpa e leve
FROM node:18-alpine
WORKDIR /usr/src/app

# Copia os arquivos de dependência novamente
COPY package*.json ./
# Instala APENAS as dependências de produção
RUN npm install --omit=dev

# Copia o código da aplicação do estágio de build
COPY --from=builder /usr/src/app/ .

# Expõe a porta que a nossa API usa
EXPOSE 4000

# O comando para iniciar o servidor
CMD [ "node", "server.js" ]