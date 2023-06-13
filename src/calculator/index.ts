import fs from "fs";
import csv from "csv-parser";
import { linearQF, Contribution, Calculation } from "pluralistic";
import type { PassportScore } from "../passport/index.js";
import { convertToUSD } from "../prices/index.js";
import { tokenDecimals } from "../config.js";
import type { Round, Application, Vote } from "../indexer/types.js";
import { getVotesWithCoefficients } from "./votes.js";
import {
  CalculatorError,
  ResourceNotFoundError,
  FileNotFoundError,
  OverridesColumnNotFoundError,
  OverridesInvalidRowError,
} from "./errors.js";

export {
  CalculatorError,
  ResourceNotFoundError,
  FileNotFoundError,
  OverridesColumnNotFoundError,
  OverridesInvalidRowError,
};

export interface DataProvider {
  loadFile<T>(description: string, path: string): Array<T>;
}

export type Overrides = {
  [id: string]: string;
};

export class FileSystemDataProvider implements DataProvider {
  basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  loadFile<T>(description: string, path: string): Array<T> {
    const fullPath = `${this.basePath}/${path}`;
    if (!fs.existsSync(fullPath)) {
      throw new FileNotFoundError(description);
    }

    const data = fs.readFileSync(fullPath, {
      encoding: "utf8",
      flag: "r",
    });

    return JSON.parse(data) as Array<T>;
  }
}

export function parseOverrides(buf: Buffer): Promise<Overrides> {
  return new Promise((resolve, _reject) => {
    const results: Overrides = {};
    let rowIndex = 1;

    const stream = csv()
      .on("headers", (headers) => {
        if (headers.indexOf("id") < 0) {
          throw new OverridesColumnNotFoundError("id");
        }

        if (headers.indexOf("coefficient") < 0) {
          throw new OverridesColumnNotFoundError("coefficient");
        }
      })
      .on("data", (data) => {
        if (data["coefficient"] !== "0" && data["coefficient"] !== "1") {
          throw new OverridesInvalidRowError(
            rowIndex,
            `Coefficient must be 0 or 1, found: ${data["coefficient"]}`
          );
        }

        results[data["id"]] = data["coefficient"];
        rowIndex += 1;
      })
      .on("end", () => {
        resolve(results);
      });

    stream.write(buf);
    stream.end();
  });
}

export type CalculatorOptions = {
  dataProvider: DataProvider;
  chainId: number;
  roundId: string;
  minimumAmountUSD?: number;
  matchingCapAmount?: bigint;
  passportThreshold?: number;
  enablePassport?: boolean;
  ignoreSaturation?: boolean;
  overrides: Overrides;
};

export type AugmentedResult = Calculation & {
  projectId: string;
  applicationId: string;
  matchedUSD: number;
  projectName: string;
  payoutAddress: string;
};

export default class Calculator {
  private dataProvider: DataProvider;
  private chainId: number;
  private roundId: string;
  private minimumAmountUSD: number | undefined;
  private matchingCapAmount: bigint | undefined;
  private enablePassport: boolean | undefined;
  private passportThreshold: number | undefined;
  private ignoreSaturation: boolean | undefined;
  private overrides: Overrides;

  constructor(options: CalculatorOptions) {
    this.dataProvider = options.dataProvider;
    this.chainId = options.chainId;
    this.roundId = options.roundId;
    this.minimumAmountUSD = options.minimumAmountUSD;
    this.enablePassport = options.enablePassport;
    this.passportThreshold = options.passportThreshold;
    this.matchingCapAmount = options.matchingCapAmount;
    this.overrides = options.overrides;
    this.ignoreSaturation = options.ignoreSaturation;
  }

  async calculate(): Promise<Array<AugmentedResult>> {
    const votes = this.parseJSONFile<Vote>(
      "votes",
      `${this.chainId}/rounds/${this.roundId}/votes.json`
    );
    const applications = this.parseJSONFile<Application>(
      "applications",
      `${this.chainId}/rounds/${this.roundId}/applications.json`
    );

    const rounds = this.parseJSONFile<Round>(
      "rounds",
      `${this.chainId}/rounds.json`
    );

    const passportScores = this.parseJSONFile<PassportScore>(
      "passport scores",
      "passport_scores.json"
    );

    const round = rounds.find((r: Round) => r.id === this.roundId);

    if (round === undefined) {
      throw new ResourceNotFoundError("round");
    }

    if (round.matchAmount === undefined) {
      throw new ResourceNotFoundError("round match amount");
    }

    if (round.token === undefined) {
      throw new ResourceNotFoundError("round token");
    }

    const matchAmount = BigInt(round.matchAmount);
    const matchTokenDecimals = BigInt(tokenDecimals[this.chainId][round.token]);

    let matchingCapAmount = this.matchingCapAmount;

    if (
      matchingCapAmount === undefined &&
      (round.metadata?.quadraticFundingConfig?.matchingCap ?? false)
    ) {
      // round.metadata.quadraticFundingConfig.matchingCapAmount is a percentage, 0 to 100, could contain decimals
      matchingCapAmount =
        (matchAmount *
          BigInt(
            Math.trunc(
              Number(
                round.metadata?.quadraticFundingConfig?.matchingCapAmount ?? 0
              ) * 100
            )
          )) /
        10000n;
    }

    const votesWithCoefficients = await getVotesWithCoefficients(
      round,
      applications,
      votes,
      passportScores,
      {
        minimumAmountUSD: this.minimumAmountUSD,
        enablePassport: this.enablePassport,
        passportThreshold: this.passportThreshold,
      }
    );

    const contributions: Array<Contribution> = votesWithCoefficients.flatMap(
      (vote) => {
        const scaleFactor = Math.pow(10, 4);
        const coefficient = BigInt(
          Math.trunc(
            Number(this.overrides[vote.id] ?? vote.coefficient) * scaleFactor
          )
        );

        if (coefficient === 0n) {
          return [];
        }

        const amount = BigInt(vote.amountRoundToken) * BigInt(scaleFactor);
        const multipliedAmount = (amount * coefficient) / BigInt(scaleFactor);

        return [
          {
            contributor: vote.voter,
            recipient: vote.applicationId,
            amount: multipliedAmount,
          },
        ];
      }
    );

    const results = linearQF(contributions, matchAmount, matchTokenDecimals, {
      minimumAmount: 0n,
      matchingCapAmount,
      ignoreSaturation: this.ignoreSaturation ?? false,
    });

    const augmented: Array<AugmentedResult> = [];

    const applicationsMap = applications.reduce((all, current) => {
      all[current.id] = current;
      return all;
    }, {} as Record<string, Application>);

    for (const id in results) {
      const calc = results[id];
      const application = applicationsMap[id];

      const conversionUSD = await convertToUSD(
        this.chainId,
        round.token,
        calc.matched
      );

      augmented.push({
        ...calc,
        matchedUSD: conversionUSD.amount,
        projectId: application.projectId,
        applicationId: application.id,
        projectName: application.metadata?.application?.project?.title,
        payoutAddress: application.metadata?.application?.recipient,
      });
    }

    return augmented;
  }

  parseJSONFile<T>(fileDescription: string, path: string): Array<T> {
    return this.dataProvider.loadFile<T>(fileDescription, path);
  }
}
