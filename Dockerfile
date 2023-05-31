FROM node:lts

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

# Bundle app source
COPY src src
COPY tsconfig.json ./
COPY .eslintrc.cjs ./

RUN npm run build
RUN npm run lint

EXPOSE 8080

COPY init.sh ./

RUN npm run test

# Cache indexer in the image
RUN --mount=type=secret,id=INFURA_API_KEY \
    --mount=type=secret,id=ALCHEMY_API_KEY \
    --mount=type=secret,id=PASSPORT_API_KEY \
    --mount=type=secret,id=PASSPORT_SCORER_ID \
    --mount=type=secret,id=COINGECKO_API_KEY \
    --mount=type=secret,id=IPFS_GATEWAY \
    --mount=type=cache,target=/usr/src/app/.cache \
    INFURA_API_KEY=$(cat /run/secrets/INFURA_API_KEY) \
    ALCHEMY_API_KEY=$(cat /run/secrets/ALCHEMY_API_KEY) \
    PASSPORT_API_KEY=$(cat /run/secrets/PASSPORT_API_KEY) \
    PASSPORT_SCORER_ID=$(cat /run/secrets/PASSPORT_SCORER_ID) \
    COINGECKO_API_KEY=$(cat /run/secrets/COINGECKO_API_KEY) \
    IPFS_GATEWAY=$(cat /run/secrets/IPFS_GATEWAY) \
    npm run index:all -- 'npm:passport'

CMD [ "npm", "start" ]
