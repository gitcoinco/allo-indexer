import "dotenv/config";
import { ethers } from "ethers";
import { parseArgs } from "node:util";
import { RetryProvider, Log, ToBlock } from "chainsauce";
import path from "node:path";

type ChainId = number;

export type Chain = {
  rpc: string;
  name: string;
  id: ChainId;
  tokens: { code: string; address: string; decimals: number }[];
  subscriptions: {
    address: string;
    abi: string;
    fromBlock?: number;
    events?: Record<string, string>;
  }[];
};

export const chains: Chain[] = [
  {
    id: 1,
    name: "mainnet",
    rpc: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY ?? ""}`,
    tokens: [
      {
        code: "USDC",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        decimals: 6,
      },
      {
        code: "DAI",
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        decimals: 18,
      },
      {
        code: "ETH",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
      },
    ],
    subscriptions: [
      {
        address: "0x03506eD3f57892C85DB20C36846e9c808aFe9ef4",
        abi: "#abis/v2/ProjectRegistry.json",
      },
      {
        address: "0x9Cb7f434aD3250d1656854A9eC7A71EceC6eE1EF",
        abi: "#abis/v2/RoundFactory.json",
        fromBlock: 16994474,
      },
      {
        address: "0x4a850F463D1C4842937c5Bc9540dBc803D744c9F",
        abi: "#abis/v2/QuadraticFundingVotingStrategyFactory.json",
        fromBlock: 16994526,
      },
    ],
  },
  {
    id: 5,
    name: "goerli",
    rpc: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY ?? ""}`,
    tokens: [
      {
        code: "USDC",
        address: "0xd35CCeEAD182dcee0F148EbaC9447DA2c4D449c4",
        decimals: 6,
      },
      {
        code: "DAI",
        address: "0x73967c6a0904aA032C103b4104747E88c566B1A2",
        decimals: 18,
      },
      {
        code: "DAI",
        address: "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844",
        decimals: 18,
      },
      {
        code: "ETH",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
      },
    ],
    subscriptions: [
      {
        address: "0x832c5391dc7931312CbdBc1046669c9c3A4A28d5",
        abi: "#abis/v1/ProjectRegistry.json",
      },
      {
        address: "0x5770b7a57BD252FC4bB28c9a70C9572aE6400E48",
        abi: "#abis/v1/RoundFactory.json",
        events: {
          RoundCreated: "RoundCreatedV1",
        },
      },
      {
        address: "0xa71864fAd36439C50924359ECfF23Bb185FFDf21",
        abi: "#abis/v2/ProjectRegistry.json",
        fromBlock: 8738420,
      },
      {
        address: "0x24F9EBFAdf095e0afe3d98635ee83CD72e49B5B0",
        abi: "#abis/v2/RoundFactory.json",
        fromBlock: 8738430,
      },
      {
        address: "0x06A6Cc566c5A88E77B1353Cdc3110C2e6c828e38",
        abi: "#abis/v2/QuadraticFundingVotingStrategyFactory.json",
        fromBlock: 8790265,
      },
      {
        address: "0x0077551e24bfB910aBABedC4336246e34B5fB0A2",
        abi: "#abis/v2/DirectPayoutStrategyFactory.json",
        fromBlock: 9284367,
      },
    ],
  },
  {
    id: 10,
    name: "optimism",
    rpc: `https://opt-mainnet.g.alchemy.com/v2/${
      process.env.ALCHEMY_API_KEY ?? ""
    }`,
    tokens: [
      {
        code: "USDC",
        address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
        decimals: 6,
      },
      {
        code: "DAI",
        address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
        decimals: 18,
      },
      {
        code: "ETH",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
      },
    ],
    subscriptions: [
      {
        address: "0x8e1bD5Da87C14dd8e08F7ecc2aBf9D1d558ea174",
        abi: "#abis/v2/ProjectRegistry.json",
      },
      {
        address: "0x04E753cFB8c8D1D7f776f7d7A033740961b6AEC2",
        abi: "#abis/v2/RoundFactory.json",
        fromBlock: 87169287,
      },
      {
        address: "0x838C5e10dcc1e54d62761d994722367BA167AC22",
        abi: "#abis/v2/QuadraticFundingVotingStrategyFactory.json",
        fromBlock: 87168143,
      },
    ],
  },
  {
    id: 250,
    name: "fantom",
    rpc: "https://rpcapi.fantom.network",
    tokens: [
      {
        code: "USDC",
        address: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
        decimals: 6,
      },
      {
        code: "DAI",
        address: "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E",
        decimals: 18,
      },
      {
        code: "FTM",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
      },
    ],
    subscriptions: [
      {
        address: "0x8e1bD5Da87C14dd8e08F7ecc2aBf9D1d558ea174",
        abi: "#abis/v1/ProjectRegistry.json",
      },
      {
        address: "0x3e7f72DFeDF6ba1BcBFE77A94a752C529Bb4429E",
        abi: "#abis/v1/RoundFactory.json",
        events: {
          RoundCreated: "RoundCreatedV1",
        },
        fromBlock: 55528191,
      },
      {
        address: "0x06A6Cc566c5A88E77B1353Cdc3110C2e6c828e38",
        abi: "#abis/v1/QuadraticFundingVotingStrategyFactory.json",
        fromBlock: 55528191,
      },
    ],
  },
];

// mapping of chain id => token address => decimals
export const tokenDecimals = Object.fromEntries(
  chains.map((chain) => {
    return [
      chain.id,
      Object.fromEntries(
        chain.tokens.map((token) => [
          token.address.toLowerCase(),
          token.decimals,
        ])
      ),
    ];
  })
);

// mapping of chain id => address => event name => renamed event name
export const eventRenames = Object.fromEntries(
  chains.map((chain) => {
    return [
      chain.id,
      Object.fromEntries(
        chain.subscriptions.map((sub) => [sub.address, sub.events])
      ),
    ];
  })
);

export interface DatabaseConfig {
  storageDir: string;
}

export const getDatabaseConfig = (): DatabaseConfig => {
  const storageDir = path.join(process.env.STORAGE_DIR || "./data");

  return { storageDir };
};

export type IndexerConfig = DatabaseConfig & {
  provider: ethers.providers.StaticJsonRpcProvider;
  cacheDir: string | null;
  chain: Chain;
  fromBlock: number;
  oneShot?: boolean;
  toBlock?: ToBlock;
  logLevel?: Log;
  follow?: boolean;
  clear: boolean;
  ipfsGateway: string;
};

export const getIndexerConfig = (): IndexerConfig => {
  const { values: args } = parseArgs({
    options: {
      chain: {
        type: "string",
        short: "s",
      },
      "log-level": {
        type: "string",
      },
      follow: {
        type: "boolean",
        short: "f",
      },
      "to-block": {
        type: "string",
      },
      "from-block": {
        type: "string",
      },
      clear: {
        type: "boolean",
      },
      "no-cache": {
        type: "boolean",
      },
    },
  });

  const chainName = args.chain;

  if (!chainName) {
    throw new Error("Chain not provided");
  }

  const chain = chains.find((chain) => chain.name === chainName);
  if (!chain) {
    throw new Error("Chain " + chainName + " is not configured");
  }

  const { storageDir } = getDatabaseConfig();

  const toBlock =
    "to-block" in args ? Number(args["to-block"]) : ("latest" as const);
  const fromBlock = "from-block" in args ? Number(args["from-block"]) : 0;

  const provider = new RetryProvider({
    url: chain.rpc,
    timeout: 5 * 60 * 1000,
  });

  let logLevel = Log.Info;
  if (args["log-level"]) {
    switch (args["log-level"]) {
      case "debug":
        logLevel = Log.Debug;
        break;
      case "info":
        logLevel = Log.Info;
        break;
      case "warning":
        logLevel = Log.Warning;
        break;
      case "error":
        logLevel = Log.Error;
        break;
      default:
        throw new Error("Invalid log level.");
    }
  }

  const clear = args.clear ?? false;

  const follow = args.follow;

  const cacheDir = args["no-cache"]
    ? null
    : process.env.CACHE_DIR || "./.cache";

  const ipfsGateway = process.env.IPFS_GATEWAY || "https://cloudflare-ipfs.com";

  return {
    storageDir,
    chain,
    provider,
    toBlock,
    fromBlock,
    cacheDir,
    logLevel,
    follow,
    clear,
    ipfsGateway,
  };
};

export type PricesConfig = DatabaseConfig & {
  coingeckoApiKey?: string;
  coingeckoApiUrl: string;
};

export const getPricesConfig = (): PricesConfig => {
  const coingeckoApiKey = process.env.COINGECKO_API_KEY;

  const coingeckoApiUrl = process.env.COINGECKO_API_KEY
    ? "https://pro-api.coingecko.com/api/v3/"
    : "https://api.coingecko.com/api/v3";

  return {
    ...getDatabaseConfig(),
    coingeckoApiKey,
    coingeckoApiUrl,
  };
};

export type ApiConfig = DatabaseConfig & {
  port: number;
};

export const getApiConfig = (): ApiConfig => {
  const port = Number(process.env.PORT || "4000");

  return {
    ...getDatabaseConfig(),
    port,
  };
};

export type PassportConfig = DatabaseConfig & {
  scorerId: number;
};

export const getPassportConfig = (): PassportConfig => {
  if (!process.env.PASSPORT_SCORER_ID) {
    throw new Error("PASSPORT_SCORER_ID is not set");
  }
  const scorerId = Number(process.env.PASSPORT_SCORER_ID);

  return {
    ...getDatabaseConfig(),
    scorerId,
  };
};
