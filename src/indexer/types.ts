export type MetaPtr = {
  pointer: string;
};

export type Round = {
  id: string;
  amountUSD: number;
  votes: number;
  token: string;
  matchAmount: string;
  matchAmountUSD: number;
  uniqueContributors: number;
  applicationMetaPtr: string;
  applicationMetadata: string | null;
  metaPtr: string;
  metadata: {
    name: string;
    quadraticFundingConfig?: {
      matchingFundsAvailable?: number;
      sybilDefense?: boolean;
      matchingCap?: boolean;
      matchingCapAmount?: number;
      minDonationThreshold?: boolean;
      minDonationThresholdAmount?: number;
    };
  } | null;
  applicationsStartTime: string;
  applicationsEndTime: string;
  roundStartTime: string;
  roundEndTime: string;
  createdAtBlock: number;
  updatedAtBlock: number;
};

export type Project = {
  id: string;
  metaPtr: string | null;
  owners: Array<string>;
  createdAtBlock: number;
  projectNumber: number;
  metadata: {
    title: string;
    description: string;
    website: string;
    projectTwitter: string;
    projectGithub: string;
    userGithub: string;
    logoImg: string;
    bannerImg: string;
    logoImgData: string;
    bannerImgData: string;
    cretedAt: number;
  } | null;
};

export type Contributor = { id: string; amountUSD: number; votes: number };

export type Application = {
  id: string;
  projectId: string;
  roundId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "IN_REVIEW";
  amountUSD: number;
  votes: number;
  uniqueContributors: number;
  metadata: {
    application: {
      project: {
        title: string;
        website: string;
        projectTwitter: string;
        projectGithub: string;
        userGithub: string;
      };
      answers: Array<{
        question: string;
        answer: string;
        encryptedAnswer: string | null;
      }>;
      recipient: string;
    };
  } | null;
  createdAtBlock: number;
  statusUpdatedAtBlock: number;
  statusSnapshots: Array<{
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "IN_REVIEW";
    statusUpdatedAtBlock: number;
  }>
};

export type Vote = {
  id: string;
  projectId: string;
  roundId: string;
  applicationId: string;
  token: string;
  voter: string;
  grantAddress: string;
  amount: string;
  amountUSD: number;
  amountRoundToken: string;
};

export type DetailedVote = Vote & {
  roundName?: string;
  projectTitle?: string;
  roundStartTime?: string;
  roundEndTime?: string;
};
