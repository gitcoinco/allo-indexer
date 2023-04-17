import { Indexer, JsonStorage, Event } from "chainsauce";
import { ethers } from "ethers";
import StatusesBitmap from "statuses-bitmap";

import { fetchJsonCached as ipfs } from "./ipfs.js";
import { convertToUSD } from "./prices.js";
import { eventRenames } from "./config.js";

// Event handlers
import roundMetaPtrUpdated from "./handlers/roundMetaPtrUpdated.js";
import applicationMetaPtrUpdated from "./handlers/applicationMetaPtrUpdated.js";

enum ApplicationStatus {
  PENDING = 0,
  APPROVED,
  REJECTED,
  CANCELLED,
}

function fullProjectId(
  projectChainId: number,
  projectId: number,
  projectRegistryAddress: string
) {
  return ethers.utils.solidityKeccak256(
    ["uint256", "address", "uint256"],
    [projectChainId, projectRegistryAddress, projectId]
  );
}

async function handleEvent(indexer: Indexer<JsonStorage>, event: Event) {
  const db = indexer.storage;
  const eventName =
    eventRenames[indexer.chainId]?.[event.address]?.[event.name] ?? event.name;
  
  console.log("Handling event", eventName, event.args);

  switch (eventName) {
    // -- PROJECTS
    case "ProjectCreated": {
      await db.collection("projects").insert({
        id: fullProjectId(
          indexer.chainId,
          event.args.projectID.toNumber(),
          event.address
        ),
        projectNumber: event.args.projectID.toNumber(),
        metaPtr: null,
        owners: [event.args.owner],
      });

      break;
    }

    case "MetadataUpdated": {
      const id = fullProjectId(
        indexer.chainId,
        event.args.projectID.toNumber(),
        event.address
      );

      try {
        await db.collection("projects").updateById(id, (project) => ({
          ...project,
          metaPtr: event.args.metaPtr.pointer,
        }));

        return async () => {
          const metadata = await ipfs(
            event.args.metaPtr.pointer,
            indexer.cache
          );

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await db.collection("projects").updateById(id, (project: any) => {
            if (project.metaPtr === event.args.metaPtr.pointer) {
              return { ...project, metadata };
            }

            return project;
          });
        };
      } catch (e) {
        console.error("Project not found", event.args.projectID.toNumber());
      }
      break;
    }

    case "OwnerAdded": {
      const id = fullProjectId(
        indexer.chainId,
        event.args.projectID.toNumber(),
        event.address
      );

      await db.collection("projects").updateById(id, (project) => ({
        ...project,
        owners: [...project.owners, event.args.owner],
      }));
      break;
    }

    case "OwnerRemoved": {
      const id = fullProjectId(
        indexer.chainId,
        event.args.projectID.toNumber(),
        event.address
      );

      await db.collection("projects").updateById(id, (project) => ({
        ...project,
        owners: project.owners.filter((o: string) => o == event.args.owner),
      }));
      break;
    }

    // --- ROUND
    case "RoundCreatedV1":
    case "RoundCreated": {
      let contract: ethers.Contract;

      if (eventName === "RoundCreatedV1") {
        contract = indexer.subscribe(
          event.args.roundAddress,
          (
            await import("#abis/v1/RoundImplementation.json", {
              assert: { type: "json" },
            })
          ).default,
          event.blockNumber
        );
      } else {
        contract = indexer.subscribe(
          event.args.roundAddress,
          (
            await import("#abis/v2/RoundImplementation.json", {
              assert: { type: "json" },
            })
          ).default,
          event.blockNumber
        );
      }

      let applicationMetaPtr = contract.applicationMetaPtr();
      let metaPtr = contract.roundMetaPtr();
      let applicationsStartTime = contract.applicationsStartTime();
      let applicationsEndTime = contract.applicationsEndTime();
      let roundStartTime = contract.roundStartTime();
      let roundEndTime = contract.roundEndTime();

      applicationMetaPtr = (await applicationMetaPtr).pointer;
      metaPtr = (await metaPtr).pointer;
      applicationsStartTime = (await applicationsStartTime).toString();
      applicationsEndTime = (await applicationsEndTime).toString();
      roundStartTime = (await roundStartTime).toString();
      roundEndTime = (await roundEndTime).toString();

      const roundId = event.args.roundAddress;

      await db.collection("rounds").insert({
        id: roundId,
        amountUSD: 0,
        votes: 0,
        uniqueContributors: 0,
        applicationMetaPtr,
        applicationMetadata: null,
        metaPtr,
        metadata: null,
        applicationsStartTime,
        applicationsEndTime,
        roundStartTime,
        roundEndTime,
      });

      // create empty sub collections
      await db.collection(`rounds/${roundId}/projects`).replaceAll([]);
      await db.collection(`rounds/${roundId}/applications`).replaceAll([]);
      await db.collection(`rounds/${roundId}/votes`).replaceAll([]);
      await db.collection(`rounds/${roundId}/contributors`).replaceAll([]);

      return async () => {
        (await roundMetaPtrUpdated(indexer, {
          ...event,
          address: event.args.roundAddress,
          args: {
            newMetaPtr: { pointer: metaPtr },
          },
        }))!();

        (await applicationMetaPtrUpdated(indexer, {
          ...event,
          address: event.args.roundAddress,
          args: {
            newMetaPtr: { pointer: applicationMetaPtr },
          },
        }))!();
      };
    }

    case "RoundMetaPtrUpdated": {
      return roundMetaPtrUpdated(indexer, event);
    }

    case "ApplicationMetaPtrUpdated": {
      return applicationMetaPtrUpdated(indexer, event);
    }

    case "NewProjectApplication": {
      const projectId = event.args.project || event.args.projectID;
      const project = await db.collection("projects").findById(projectId);

      const applications = db.collection(
        `rounds/${event.address}/applications`
      );

      const projects = db.collection(`rounds/${event.address}/projects`);

      const applicationIndex =
        event.args.applicationIndex?.toString() ??
        (await applications.all()).length.toString();

      await applications.insert({
        id: applicationIndex,
        projectId: projectId,
        projectNumber: project?.projectNumber ?? null,
        roundId: event.address,
        status: "PENDING",
        amountUSD: 0,
        votes: 0,
        uniqueContributors: 0,
        payoutAddress: null,
        metadata: null,
      });

      const isNewProject = await projects.upsertById(projectId, (p) => {
        return (
          p ?? {
            id: projectId,
            projectNumber: project?.projectNumber ?? null,
            roundId: event.address,
            status: "PENDING",
            amountUSD: 0,
            votes: 0,
            uniqueContributors: 0,
            payoutAddress: null,
            metadata: null,
          }
        );
      });

      await db
        .collection(
          `rounds/${event.address}/applications/${applicationIndex}/votes`
        )
        .replaceAll([]);

      await db
        .collection(
          `rounds/${event.address}/applications/${applicationIndex}/contributors`
        )
        .replaceAll([]);

      if (isNewProject) {
        await db
          .collection(`rounds/${event.address}/projects/${projectId}/votes`)
          .replaceAll([]);

        await db
          .collection(
            `rounds/${event.address}/projects/${projectId}/contributors`
          )
          .replaceAll([]);
      }

      return async () => {
        const metadata = await ipfs(
          event.args.applicationMetaPtr.pointer,
          indexer.cache
        );

        await applications.updateById(applicationIndex, (app) => ({
          ...app,
          metadata,
        }));
        await projects.updateById(projectId, (project) => ({
          ...project,
          metadata,
        }));
      };
    }

    case "ProjectsMetaPtrUpdated": {
      const projects: { id: string; status: string; payoutAddress: string }[] =
        await ipfs(event.args.newMetaPtr.pointer, indexer.cache);

      for (const projectApp of projects) {
        const projectId = projectApp.id.split("-")[0];

        await db
          .collection(`rounds/${event.address}/projects`)
          .updateById(projectId, (application) => ({
            ...application,
            status: projectApp.status ?? application.status,
            payoutAddress: projectApp.payoutAddress,
          }));
      }
      break;
    }

    case "ApplicationStatusesUpdated": {
      const bitmap = new StatusesBitmap(256n, 2n);
      bitmap.setRow(event.args.index.toBigInt(), event.args.status.toBigInt());
      const startIndex = event.args.index.toBigInt() * bitmap.itemsPerRow;

      for (let i = startIndex; i < startIndex + bitmap.itemsPerRow; i++) {
        const status = bitmap.getStatus(i);
        const statusString = ApplicationStatus[status];
        const application = await db
          .collection(`rounds/${event.address}/applications`)
          .updateById(i.toString(), (application) => ({
            ...application,
            status: statusString,
          }));

        if (application) {
          await db
            .collection(`rounds/${event.address}/projects`)
            .updateById(application.projectId, (application) => ({
              ...application,
              status: statusString,
            }));
        }
      }
      break;
    }

    // --- Voting Strategy
    case "VotingContractCreatedV1": {
      indexer.subscribe(
        event.args.votingContractAddress,
        (
          await import(
            "#abis/v1/QuadraticFundingVotingStrategyImplementation.json",
            {
              assert: { type: "json" },
            }
          )
        ).default,
        event.blockNumber
      );
      break;
    }

    case "VotingContractCreated": {
      indexer.subscribe(
        event.args.votingContractAddress,
        (
          await import(
            "#abis/v2/QuadraticFundingVotingStrategyImplementation.json",
            {
              assert: { type: "json" },
            }
          )
        ).default,
        event.blockNumber
      );
      break;
    }

    // --- Votes
    case "Voted": {
      return async () => {
        const voteId = ethers.utils.solidityKeccak256(
          ["string"],
          [
            `${event.transactionHash}-${event.args.voter}-${event.args.grantAddress}`,
          ]
        );

        const projectApplication = await db
          .collection(`rounds/${event.args.roundAddress}/projects`)
          .findById(event.args.projectId);

        const round = await db
          .collection(`rounds`)
          .findById(event.args.roundAddress);

        if (
          projectApplication === undefined ||
          projectApplication.status !== "APPROVED" ||
          round === undefined
        ) {
          // TODO: We seem to be ceceiving votes for projects that have been rejected? Here's an example:
          // Project ID: 0x79f3e178005bfbe0a3defff8693009bb12e58102763501e52995162820ae3560
          // Round ID: 0xd95a1969c41112cee9a2c931e849bcef36a16f4c
          return;
        }

        const token = event.args.token.toLowerCase();

        const amountUSD = await convertToUSD(
          indexer.chainId,
          token,
          event.args.amount.toBigInt(),
          event.blockNumber
        );

        const vote = {
          id: voteId,
          projectId: event.args.projectId,
          roundId: event.args.roundAddress,
          token: event.args.token,
          voter: event.args.voter,
          grantAddress: event.args.grantAddress,
          amount: event.args.amount.toString(),
          amountUSD: amountUSD,
        };

        // Insert or update  unique round contributor
        const roundContributors = db.collection(
          `rounds/${event.args.roundAddress}/contributors`
        );

        const isNewRoundContributor = await roundContributors.upsertById(
          event.args.voter,
          (contributor) => {
            if (contributor) {
              return {
                ...contributor,
                amountUSD: contributor.amountUSD + amountUSD,
                votes: contributor.votes + 1,
              };
            } else {
              return {
                id: event.args.voter,
                amountUSD,
                votes: 1,
              };
            }
          }
        );

        // Insert or update unique project contributor
        const projectContributors = db.collection(
          `rounds/${event.args.roundAddress}/projects/${event.args.projectId}/contributors`
        );

        const isNewProjectContributor = await projectContributors.upsertById(
          event.args.voter,
          (contributor) => {
            if (contributor) {
              return {
                ...contributor,
                amountUSD: contributor.amountUSD + amountUSD,
                votes: contributor.votes + 1,
              };
            } else {
              return {
                id: event.args.voter,
                amountUSD,
                votes: 1,
              };
            }
          }
        );

        if (event.args.applicationIndex) {
          const applicationIndex = event.args.applicationIndex.toString();

          // Insert or update unique application contributor
          const applicationContributors = db.collection(
            `rounds/${event.args.roundAddress}/applications/${applicationIndex}/contributors`
          );

          const isNewapplicationContributor =
            await applicationContributors.upsertById(
              event.args.voter,
              (contributor) => {
                if (contributor) {
                  return {
                    ...contributor,
                    amountUSD: contributor.amountUSD + amountUSD,
                    votes: contributor.votes + 1,
                  };
                } else {
                  return {
                    id: event.args.voter,
                    amountUSD,
                    votes: 1,
                  };
                }
              }
            );

          db.collection(
            `rounds/${event.args.roundAddress}/applications`
          ).updateById(applicationIndex, (project) => ({
            ...project,
            amountUSD: project.amountUSD + amountUSD,
            votes: project.votes + 1,
            uniqueContributors:
              project.uniqueContributors +
              (isNewapplicationContributor ? 1 : 0),
          }));

          db.collection(
            `rounds/${event.args.roundAddress}/applications/${applicationIndex}/votes`
          ).insert(vote);
        }

        await Promise.all([
          db
            .collection("rounds")
            .updateById(event.args.roundAddress, (round) => ({
              ...round,
              amountUSD: round.amountUSD + amountUSD,
              votes: round.votes + 1,
              uniqueContributors:
                round.uniqueContributors + (isNewRoundContributor ? 1 : 0),
            })),
          db
            .collection(`rounds/${event.args.roundAddress}/projects`)
            .updateById(event.args.projectId, (project) => ({
              ...project,
              amountUSD: project.amountUSD + amountUSD,
              votes: project.votes + 1,
              uniqueContributors:
                project.uniqueContributors + (isNewProjectContributor ? 1 : 0),
            })),
          db.collection(`rounds/${event.args.roundAddress}/votes`).insert(vote),
          db
            .collection(
              `rounds/${event.args.roundAddress}/projects/${event.args.projectId}/votes`
            )
            .insert(vote),
        ]);
      };
    }
      
    case "xStake": {
      // id is roundId and the user who was staked community on
      const id = `${event.args.roundId}-${event.args.user}}`;

      const dbCollection = db.collection("communityStakers");

      const stakingEvent = await dbCollection.findById(id);

      if (stakingEvent) {
        await db.collection("communityStakers").updateById(id, (stakingEvent) => ({
          ...stakingEvent,
          stakers: [...stakingEvent.stakers, event.args.staker],
          stakedAmounts: [...stakingEvent.stakedAmounts, event.args.amount],
        }));
      } else {
        await db.collection("communityStakers").insert({
          id,
          roundId: event.args.roundId,
          staked: event.args.staked,
          stakers: [event.args.staker],
          stakedAmounts: [event.args.amount],
        });
      }
      break;
    }
      
    case "selfStake": {
      const id = `${event.args.roundId}-${event.args.staker}`;

      const dbCollection = db.collection("selfStakers");

      const stakingEvent = await dbCollection.findById(id);

      if (stakingEvent) {
        await db.collection("selfStakers").updateById(id, (stakingEvent) => ({
          ...stakingEvent,
          stakedAmount: [...stakingEvent.stakedAmount, event.args.amount],
        }));
      } else {
        await db.collection("selfStakers").insert({
          id,
          roundId: event.args.roundId,
          staker: event.args.staker,
          stakedAmount: [event.args.amount],
          staked: event.args.staked,
        });
      }
    }

    default:
    // console.log("TODO", event.name, event.args);
  }
}

export default handleEvent;

