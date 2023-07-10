import express, { Response, Request } from "express";

const upload = multer();
import multer from "multer";
import ClientError from "../clientError.js";
import { getApiConfig } from "../../../config.js";

import Calculator, {
  Overrides,
  DataProvider,
  FileSystemDataProvider,
  CalculatorOptions,
  parseOverrides,
} from "../../../calculator/index.js";
import { createPriceProvider, PriceProvider } from "../../../prices/index.js";

// XXX needs to be a function parameter, not a module variable
const config = getApiConfig();

const router = express.Router();

export const calculatorConfig: {
  dataProvider: DataProvider;
  priceProvider: PriceProvider;
} = {
  priceProvider: createPriceProvider({}),
  dataProvider: new FileSystemDataProvider(config.storageDir),
};

function boolParam<T extends Record<string, unknown>>(
  object: T,
  name: keyof T
): boolean | undefined {
  const param = object[name]?.toString()?.toLowerCase();

  if (param === undefined) {
    return undefined;
  }

  if (param === "true") {
    return true;
  } else if (param === "false") {
    return false;
  } else {
    throw new ClientError(
      `${name.toString()} parameter must be true or false`,
      400
    );
  }
}

async function matchesHandler(
  req: Request,
  res: Response,
  okStatusCode: number,
  useOverrides: boolean
) {
  const chainId = Number(req.params.chainId);
  const roundId = req.params.roundId;

  const minimumAmountUSD = req.query.minimumAmountUSD?.toString();
  const passportThreshold = req.query.passportThreshold?.toString();
  const matchingCapAmount = req.query.matchingCapAmount?.toString();

  const enablePassport = boolParam(req.query, "enablePassport");
  const ignoreSaturation = boolParam(req.query, "ignoreSaturation");

  let overrides: Overrides = {};

  if (useOverrides) {
    const file = req.file;
    if (file === undefined || file.fieldname !== "overrides") {
      res.status(400);
      res.send({ error: "overrides param required" });
      return;
    }

    const buf = file.buffer;
    overrides = await parseOverrides(buf);
  }

  const calculatorOptions: CalculatorOptions = {
    priceProvider: calculatorConfig.priceProvider,
    dataProvider: calculatorConfig.dataProvider,
    chainId: chainId,
    roundId: roundId,
    minimumAmountUSD: minimumAmountUSD ? Number(minimumAmountUSD) : undefined,
    matchingCapAmount: matchingCapAmount
      ? BigInt(matchingCapAmount)
      : undefined,
    passportThreshold: passportThreshold
      ? Number(passportThreshold)
      : undefined,
    enablePassport: enablePassport,
    ignoreSaturation: ignoreSaturation,
    overrides,
  };

  const calculator = new Calculator(calculatorOptions);
  const matches = await calculator.calculate();
  const responseBody = JSON.stringify(matches, (_key, value) =>
    typeof value === "bigint" ? value.toString() : (value as unknown)
  );
  res.setHeader("content-type", "application/json");
  res.status(okStatusCode);
  res.send(responseBody);
}

router.get("/chains/:chainId/rounds/:roundId/matches", async (req, res) => {
  await matchesHandler(req, res, 200, false);
});

router.post(
  "/chains/:chainId/rounds/:roundId/matches",
  upload.single("overrides"),
  async (req, res) => {
    await matchesHandler(req, res, 201, true);
  }
);

router.get("/chains/:chainId/rounds/:roundId/estimate", async (req, res) => {
  await estimateMatchesHandler(req, res, 200);
});

async function estimateMatchesHandler(
  req: Request,
  res: Response,
  okStatusCode: number
) {
  const chainId = Number(req.params.chainId);
  const roundId = req.params.roundId;

  const enablePassport = boolParam(req.query, "enablePassport");
  const ignoreSaturation = boolParam(req.query, "ignoreSaturation");

  const calculatorOptions: CalculatorOptions = {
    dataProvider: calculatorConfig.dataProvider,
    chainId: chainId,
    roundId: roundId,
    minimumAmountUSD: undefined,
    matchingCapAmount: undefined,
    passportThreshold: undefined,
    enablePassport: enablePassport,
    ignoreSaturation: ignoreSaturation,
    overrides: {},
  };

  const calculator = new Calculator(calculatorOptions);
  const matches = await calculator.calculate();
  const responseBody = JSON.stringify(matches, (_key, value) =>
    typeof value === "bigint" ? value.toString() : (value as unknown)
  );
  res.setHeader("content-type", "application/json");
  res.status(okStatusCode);
  res.send(responseBody);
}

export default router;
