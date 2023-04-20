import fs from "fs";
import { linearQF, Contribution, Calculation } from "pluralistic";

export type CalculatorOptions = {
  baseDataPath: string;
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
  private baseDataPath: string;
  private chainId: string;
  private roundId: string;
  private minimumAmount: number | undefined;
  private enablePassport: boolean | undefined;
  private passportThreshold: number | undefined;

  constructor(options: CalculatorOptions) {
    const {
      baseDataPath,
      chainId,
      roundId,
      minimumAmount,
      enablePassport,
      passportThreshold,
    } = options;
    this.baseDataPath = baseDataPath;
    this.chainId = chainId;
    this.roundId = roundId;
    this.minimumAmount = minimumAmount;
    this.enablePassport = enablePassport;
    this.passportThreshold = passportThreshold;
  }

  calculate() {
    const rawContributions = this.parseJSONFile(
      `${this.chainId}/rounds/${this.roundId}/votes.json`
    );
    const applications = this.parseJSONFile(
      `${this.chainId}/rounds/${this.roundId}/applications.json`
    );
    const rounds = this.parseJSONFile(`${this.chainId}/rounds.json`);
    const passportScores = this.parseJSONFile("passport_scores.json");

    const currentRound = rounds.find((r: any) => r.id === this.roundId);
    const minAmount = this.minimumAmount ?? currentRound.minimumAmount ?? 0;

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
        recipient: raw.projectId,
        amount: raw.amountUSD,
      })
    );

    contributions = contributions.filter((c: Contribution) => {
      const addressData = passportScores.find(
        (ps: any) => ps.address === c.contributor
      );

      return c.amount >= minAmount && isEligible(c, addressData);
    });

    const results = linearQF(contributions, currentRound.matchAmount, {
      minimumAmount: this.minimumAmount ?? currentRound.minimumAmount,
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
        projectId: id,
        applicationId: application.id,
        contributionsCount: application.votes,
        projectName: application?.metadata?.application?.project?.title,
        payoutAddress: application?.metadata?.application?.recipient,
      });
    }

    return augmented;
  }

  parseJSONFile(path: string) {
    const fullPath = `${this.baseDataPath}/${path}`;
    const data = fs.readFileSync(fullPath, {
      encoding: "utf8",
      flag: "r",
    });

    return JSON.parse(data);
  }
}