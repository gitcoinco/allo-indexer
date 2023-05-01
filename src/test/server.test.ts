import { describe, test, expect } from "vitest";
import fs from "fs";
import path from "path";
import request from "supertest";
import { app, calculatorConfig } from "../http/app";
import { TestDataProvider } from "./http/app.test";

describe("server", () => {
  describe("/matches", () => {
    describe("resources not found", () => {
      test("should render 404 if round is not present in rounds.json", async () => {
        calculatorConfig.dataProvider = new TestDataProvider({
          "1/rounds/0x1234/votes.json": "votes",
          "1/rounds/0x1234/applications.json": "applications",
          "1/rounds.json": [], // empty file so the round won't be found
          "passport_scores.json": "passport_scores",
        });

        const res = await request(app).get("/chains/1/rounds/0x1234/matches");
        expect(res.status).toBe(404);
      });

      test("should render 404 if rounds file doesn't exist", async () => {
        calculatorConfig.dataProvider = new TestDataProvider({
          "1/rounds/0x1234/votes.json": "votes",
          "1/rounds/0x1234/applications.json": "applications",
          "1/rounds.json": undefined,
          "passport_scores.json": "passport_scores",
        });

        const res = await request(app).get("/chains/1/rounds/0x1234/matches");
        expect(res.status).toBe(404);
      });

      test("should render 404 if votes file doesn't exist", async () => {
        calculatorConfig.dataProvider = new TestDataProvider({
          "1/rounds/0x1234/votes.json": undefined,
          "1/rounds/0x1234/applications.json": "applications",
          "1/rounds.json": "rounds",
          "passport_scores.json": "passport_scores",
        });

        const res = await request(app).get("/chains/1/rounds/0x1234/matches");
        expect(res.status).toBe(404);
      });

      test("should render 404 if applications file doesn't exist", async () => {
        calculatorConfig.dataProvider = new TestDataProvider({
          "1/rounds/0x1234/votes.json": "votes",
          "1/rounds/0x1234/applications.json": undefined,
          "1/rounds.json": "rounds",
          "passport_scores.json": "passport_scores",
        });

        const res = await request(app).get("/chains/1/rounds/0x1234/matches");
        expect(res.status).toBe(404);
      });

      test("should render 404 if passport_scores file doesn't exist", async () => {
        calculatorConfig.dataProvider = new TestDataProvider({
          "1/rounds/0x1234/votes.json": "votes",
          "1/rounds/0x1234/applications.json": "applications",
          "1/rounds.json": "rounds",
          "passport_scores.json": undefined,
        });

        const res = await request(app).get("/chains/1/rounds/0x1234/matches");
        expect(res.status).toBe(404);
      });
    });

    describe("calculations", () => {
      test("should render calculations", () =>
        new Promise((done) => {
          calculatorConfig.dataProvider = new TestDataProvider({
            "1/rounds/0x1234/votes.json": "votes",
            "1/rounds/0x1234/applications.json": "applications",
            "1/rounds.json": "rounds",
            "passport_scores.json": "passport_scores",
          });

          const expectedResults = [
            {
              applicationId: "application-id-1",
              projectId: "project-id-1",
              totalReceived: 15,
              sumOfSqrt: 7,
              matched: 13.6,
            },
            {
              applicationId: "application-id-2",
              projectId: "project-id-2",
              totalReceived: 10,
              sumOfSqrt: 8,
              matched: 21.6,
            },
            {
              applicationId: "application-id-3",
              projectId: "project-id-3",
              totalReceived: 34,
              sumOfSqrt: 14,
              matched: 64.8,
            },
          ];

          request(app)
            .get("/chains/1/rounds/0x1234/matches")
            .then((resp) => {
              expect(resp.statusCode).toBe(200);
              expect(resp.body).toEqual(expectedResults);
              done(true);
            });
        }));
    });
  });
});
