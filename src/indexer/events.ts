import type { Event as ChainsauceEvent } from "chainsauce";
import type { MetaPtr } from "./types.js";
import type { ethers } from "ethers";

export interface RoundMetaPtrUpdatedEvent extends ChainsauceEvent {
  name: "RoundMetaPtrUpdated";
  args: {
    newMetaPtr: MetaPtr;
  };
}

export interface MatchAmountUpdatedEvent extends ChainsauceEvent {
  name: "MatchAmountUpdated";
  args: {
    newAmount: ethers.BigNumber;
  };
}

export interface ApplicationMetaPtrUpdatedEvent extends ChainsauceEvent {
  name: "ApplicationMetaPtrUpdated";
  args: {
    newMetaPtr: MetaPtr;
  };
}

export interface NewProjectApplicationEvent extends ChainsauceEvent {
  name: "NewProjectApplication";
  args: {
    projectID: ethers.BigNumber;
    project: string;
    applicationIndex: ethers.BigNumber;
    applicationMetaPtr: MetaPtr;
  };
}

export interface ProjectsMetaPtrUpdatedEvent extends ChainsauceEvent {
  name: "ProjectsMetaPtrUpdated";
  args: {
    newMetaPtr: MetaPtr;
  };
}

export interface ApplicationStatusesUpdatedEvent extends ChainsauceEvent {
  name: "ApplicationStatusesUpdated";
  args: {
    index: ethers.BigNumber;
    status: ethers.BigNumber;
  };
}

export interface VotingContractCreatedV1Event extends ChainsauceEvent {
  name: "VotingContractCreatedV1";
  args: {
    votingContractAddress: string;
  };
}

export interface VotingContractCreatedEvent extends ChainsauceEvent {
  name: "VotingContractCreated";
  args: {
    votingContractAddress: string;
  };
}

export interface VotedEvent extends ChainsauceEvent {
  name: "Voted";
  args: {
    roundAddress: string;
    applicationIndex?: ethers.BigNumber;
    projectId: string;
    amount: ethers.BigNumber;
    grantAddress: string;
    voter: string;
    contributor: string;
    token: string;
  };
}

export interface ProjectCreatedEvent extends ChainsauceEvent {
  name: "ProjectCreated";
  args: {
    projectID: ethers.BigNumber;
    owner: string;
  };
}

export interface MetadataUpdatedEvent extends ChainsauceEvent {
  name: "MetadataUpdated";
  args: {
    projectID: ethers.BigNumber;
    metaPtr: MetaPtr;
  };
}

export interface OwnerAddedEvent extends ChainsauceEvent {
  name: "OwnerAdded";
  args: {
    projectID: ethers.BigNumber;
    owner: string;
  };
}

export interface OwnerRemovedEvent extends ChainsauceEvent {
  name: "OwnerRemoved";
  args: {
    projectID: ethers.BigNumber;
    owner: string;
  };
}

export interface RoundCreatedV1Event extends ChainsauceEvent {
  name: "RoundCreatedV1";
  args: {
    roundAddress: string;
    token: string;
  };
}

export interface RoundCreatedEvent extends ChainsauceEvent {
  name: "RoundCreated";
  args: {
    roundAddress: string;
    token: string;
  };
}

export interface PayoutContractCreatedEvent extends ChainsauceEvent {
  name: "PayoutContractCreated";
  args: {
    payoutContractAddress: string;
    payoutImplementation: string;
  };
}

export interface ApplicationInReviewEvent extends ChainsauceEvent {
  name: "ApplicationInReview";
  args: {
    applicationIndex: ethers.BigNumber;
    operator: string;
  };
}

export type Event =
  | RoundMetaPtrUpdatedEvent
  | MatchAmountUpdatedEvent
  | ApplicationMetaPtrUpdatedEvent
  | NewProjectApplicationEvent
  | ProjectsMetaPtrUpdatedEvent
  | ApplicationStatusesUpdatedEvent
  | VotingContractCreatedV1Event
  | VotingContractCreatedEvent
  | VotedEvent
  | ProjectCreatedEvent
  | MetadataUpdatedEvent
  | OwnerAddedEvent
  | OwnerRemovedEvent
  | RoundCreatedV1Event
  | RoundCreatedEvent
  | PayoutContractCreatedEvent
  | ApplicationInReviewEvent;
