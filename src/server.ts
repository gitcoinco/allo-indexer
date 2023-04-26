import express from "express";
import cors from "cors";
import serveIndex from "serve-index";
import path from "node:path";
import { JsonStorage } from "chainsauce";
import { createArrayCsvStringifier } from "csv-writer";

import config from "./config.js";
import Calculator, {
  DataProvider,
  FileSystemDataProvider,
  CalculatorOptions,
  FileNotFoundError,
  ResourceNotFoundError,
} from "./calculator.js";

export const app = express();
function loadDatabase(chainId: string) {
  const storageDir = path.join(config.storageDir, chainId);
  return new JsonStorage(storageDir);
}

app.use(cors());

app.use(
  "/data",
  express.static(config.storageDir, {
    acceptRanges: true,
    setHeaders: (res) => {
      res.setHeader("Accept-Ranges", "bytes");
    },
  }),
  serveIndex(config.storageDir, { icons: true, view: "details" })
);

app.get("/", (_req, res) => {
  res.redirect("/data");
});

app.get("/data/:chainId/rounds/:roundId/applications.csv", async (req, res) => {
  const db = loadDatabase(req.params.chainId);

  const applications = await db
    .collection(`rounds/${req.params.roundId}/applications`)
    .all();

  let questionTitles = [];

  if (
    applications.length > 0 &&
    applications[0].metadata?.application.answers
  ) {
    questionTitles = applications[0].metadata.application.answers.map(
      (answer: any) => answer.question
    );
  }

  const csv = createArrayCsvStringifier({
    header: [
      "applicationId",
      "projectId",
      "status",
      "title",
      "website",
      "projecTwitter",
      "projectGithub",
      "userGithub",
      ...questionTitles,
    ],
  });

  const records = [];

  for (const application of applications) {
    const answers =
      application.metadata?.application.answers.map(
        (answer: any) => answer.answer || JSON.stringify(answer.encryptedAnswer)
      ) ?? [];

    records.push([
      application.id,
      application.projectId,
      application.status,
      application.metadata.application.project.title,
      application.metadata.application.project.website,
      application.metadata.application.project.projectTwitter,
      application.metadata.application.project.projectGithub,
      application.metadata.application.project.userGithub,
      ...answers,
    ]);
  }

  res.setHeader("content-type", "text/csv");
  res.send(csv.getHeaderString() + csv.stringifyRecords(records));
});

export const calculatorConfig: { dataProvider: DataProvider } = {
  dataProvider: new FileSystemDataProvider("./data"),
};

app.get("/chains/:chainId/rounds/:roundId/matches", (req, res) => {
  const chainId = req.params.chainId;
  const roundId = req.params.roundId;

  const minimumAmount = req.query.minimumAmount?.toString();
  const passportThreshold = req.query.passportThreshold?.toString();
  const enablePassport =
    req.query.enablePassport?.toString()?.toLowerCase() === "true";

  const calculatorOptions: CalculatorOptions = {
    dataProvider: calculatorConfig.dataProvider,
    chainId: chainId,
    roundId: roundId,
    minimumAmount: minimumAmount ? Number(minimumAmount) : undefined,
    passportThreshold: passportThreshold
      ? Number(passportThreshold)
      : undefined,
    enablePassport: enablePassport,
  };

  try {
    const calculator = new Calculator(calculatorOptions);
    const matches = calculator.calculate();
    res.send(matches);
  } catch (e) {
    if (e instanceof FileNotFoundError) {
      res.statusCode = 404;
      res.send({
        error: e.message,
      });

      return;
    }

    if (e instanceof ResourceNotFoundError) {
      res.statusCode = 404;
      res.send({
        error: e.message,
      });

      return;
    }

    console.error(e);
    res.statusCode = 500;
    res.send({
      error: "something went wrong",
    });
  }
});

if (process.env.VITEST !== "true") {
  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}
