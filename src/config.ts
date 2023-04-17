import "dotenv/config";

type ChainId = number;

export type Chain = {
  rpc: string;
  name: string;
  id: ChainId;
  tokens: { code: string; address: string; decimals: number }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscriptions: {
    address: string;
    abi: string;
    fromBlock?: number;
    events?: Record<string, string>;
  }[];
};

const chains: Chain[] = [
  {
    id: 1,
    name: "mainnet",
    rpc: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    tokens: [
      // {
      //   code: "USDC",
      //   address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      //   decimals: 6,
      // },
      // {
      //   code: "DAI",
      //   address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      //   decimals: 18,
      // },
      // {
      //   code: "ETH",
      //   address: "0x0000000000000000000000000000000000000000",
      //   decimals: 18,
      // },
    ],
    subscriptions: [
      // {
      //   address: "0x03506eD3f57892C85DB20C36846e9c808aFe9ef4",
      //   abi: "#abis/v2/ProjectRegistry.json",
      // },
      // {
      //   address: "0xE2Bf906f7d10F059cE65769F53fe50D8E0cC7cBe",
      //   abi: "#abis/v1/RoundFactory.json",
      //   events: {
      //     RoundCreated: "RoundCreatedV1",
      //   },
      // },
      // {
      //   address: "0x06A6Cc566c5A88E77B1353Cdc3110C2e6c828e38",
      //   abi: "#abis/v1/QuadraticFundingVotingStrategyFactory.json",
      //   events: {
      //     VotingContractCreated: "VotingContractCreatedV1",
      //   },
      // },
      // {
      //   address: "0x9Cb7f434aD3250d1656854A9eC7A71EceC6eE1EF",
      //   abi: "#abis/v2/RoundFactory.json",
      //   fromBlock: 16994474,
      // },
      // {
      //   address: "0x4a850F463D1C4842937c5Bc9540dBc803D744c9F",
      //   abi: "#abis/v2/QuadraticFundingVotingStrategyFactory.json",
      //   fromBlock: 16994526,
      // },
      {
        address: "0x0E3efD5BE54CC0f4C64e0D186b0af4b7F2A0e95F",
        abi: "#abis/gtcStaking/IDStaking.json",
        fromBlock: 16401288,
      },
    ],
  },
  {
    id: 5,
    name: "goerli",
    rpc: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
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
    ],
  },
  {
    id: 10,
    name: "optimism",
    rpc: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
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
        address: "0x0f0A4961274A578443089D06AfB9d1fC231A5a4D",
        abi: "#abis/v1/RoundFactory.json",
        events: {
          RoundCreated: "RoundCreatedV1",
        },
      },
      {
        address: "0xE1F4A28299966686c689223Ee7803258Dbde0942",
        abi: "#abis/v1/QuadraticFundingVotingStrategyFactory.json",
        events: {
          VotingContractCreated: "VotingContractCreatedV1",
        },
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
      },
      {
        address: "0x06A6Cc566c5A88E77B1353Cdc3110C2e6c828e38",
        abi: "#abis/v1/QuadraticFundingVotingStrategyFactory.json",
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

export default {
  storageDir: process.env.STORAGE_DIR || "./data",
  port: Number(process.env.PORT || "4000"),
  ipfsGateway: process.env.IPFS_GATEWAY || "https://cloudflare-ipfs.com",
  coingeckoApiKey: process.env.COINGECKO_API_KEY,
  coingeckoApiUrl: process.env.COINGECKO_API_KEY
    ? "https://pro-api.coingecko.com/api/v3/"
    : "https://api.coingecko.com/api/v3",
  chains,
};
