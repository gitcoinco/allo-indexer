import fs from "fs";
import { linearQF, Contribution, Calculation } from "pluralistic";

export class FileNotFoundError extends Error {
  constructor(fileDescription: string) {
    super(`cannot find ${fileDescription} file`);
  }
}

export class ResourceNotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
  }
}

export interface DataProvider {
  loadFile(description: string, path: string): Array<any>;
}

export class FileSystemDataProvider {
  basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  loadFile(description: string, path: string) {
    const fullPath = `${this.basePath}/${path}`;
    if (!fs.existsSync(fullPath)) {
      throw new FileNotFoundError(description);
    }

    const data = fs.readFileSync(fullPath, {
      encoding: "utf8",
      flag: "r",
    });

    return JSON.parse(data);
  }
}

export type CalculatorOptions = {
  dataProvider: DataProvider;
  chainId: string;
  roundId: string;
  minimumAmount?: number;
  passportThreshold?: number;
  enablePassport?: boolean;
};

export type AugmentedResult = Calculation & {
  projectId: string;
  applicationId: string;
  projectName: string;
  payoutAddress: string;
  contributionsCount: number;
};

type RawContribution = {
  voter: string;
  projectId: string;
  applicationId: string;
  amountUSD: number;
};

type RawRound = {
  matchAmount: string;
  matchAmountUSD: number;
  id: string;
};

export default class Calculator {
  private dataProvider: DataProvider;
  private chainId: string;
  private roundId: string;
  private minimumAmount: number | undefined;
  private enablePassport: boolean | undefined;
  private passportThreshold: number | undefined;

  constructor(options: CalculatorOptions) {
    const {
      dataProvider,
      chainId,
      roundId,
      minimumAmount,
      enablePassport,
      passportThreshold,
    } = options;
    this.dataProvider = dataProvider;
    this.chainId = chainId;
    this.roundId = roundId;
    this.minimumAmount = minimumAmount;
    this.enablePassport = enablePassport;
    this.passportThreshold = passportThreshold;
  }

  calculate() {
    const rawContributions = this.parseJSONFile(
      "votes",
      `${this.chainId}/rounds/${this.roundId}/votes.json`
    );
    const applications = this.parseJSONFile(
      "applications",
      `${this.chainId}/rounds/${this.roundId}/applications.json`
    );
    const rounds = this.parseJSONFile("rounds", `${this.chainId}/rounds.json`);
    const passportScores = this.parseJSONFile(
      "passport scores",
      "passport_scores.json"
    );

    const round = rounds.find((r: RawRound) => r.id === this.roundId);
    if (round === undefined) {
      throw new ResourceNotFoundError("round");
    }

    if (round.matchAmountUSD === undefined) {
      throw new ResourceNotFoundError("round match amount");
    }

    const minAmount = this.minimumAmount ?? round.minimumAmount ?? 0;

    const isEligible = (_c: Contribution, addressData: any): boolean => {
      const hasValidEvidence = addressData?.evidence?.success;

      if (this.enablePassport) {
        if (typeof this.passportThreshold !== "undefined") {
          return (
            parseFloat(addressData?.evidence.rawScore ?? "0") >
            this.passportThreshold
          );
        } else {
          return hasValidEvidence;
        }
      }
      return true;
    };

    let contributions: Array<Contribution> = rawContributions.map(
      (raw: RawContribution) => ({
        contributor: raw.voter,
        recipient: raw.applicationId,
        amount: raw.amountUSD,
      })
    );

    const passportIndex = passportScores.reduce((ps: any, acc: any) => {
      acc[ps.address] = ps;
      return acc;
    }, {});

    contributions = contributions.filter((c: Contribution) => {
      const addressData = passportIndex[c.contributor];

      return c.amount >= minAmount && isEligible(c, addressData);
    });

    const results = linearQF(contributions, round.matchAmountUSD, {
      minimumAmount: this.minimumAmount ?? round.minimumAmount,
      ignoreSaturation: true,
    });

    const augmented: Array<AugmentedResult> = [];
    for (const id in results) {
      const calc = results[id];
      const application = applications.find((a: any) => a.id === id);

      augmented.push({
        totalReceived: calc.totalReceived,
        sumOfSqrt: calc.sumOfSqrt,
        matched: calc.matched,
        projectId: application.projectId,
        applicationId: application.id,
        contributionsCount: application.votes,
        projectName: application.metadata?.application?.project?.title,
        payoutAddress: application.metadata?.application?.recipient,
      });
    }

    return augmented;
  }

  parseJSONFile(fileDescription: string, path: string) {
    return this.dataProvider.loadFile(fileDescription, path);
  }
}
