import request from "supertest";
import { createApp } from "./index";

let app: any;
beforeAll(() => {
  app = createApp();
});

describe("/api/mask", () => {
  test("masks value and caches", async () => {
    const res1 = await request(app)
      .post("/api/mask")
      .send({ value: "123-45-6789", dataType: "SSN", role: "Supervisor" });
    expect(res1.body.masked).toBe("***-**-****");

    // cache hit flag
    const res2 = await request(app)
      .post("/api/mask")
      .send({ value: "123-45-6789", dataType: "SSN", role: "Supervisor" });
    expect(res2.body.cached).toBe(true);
  });

  test("returns fallback on missing fields", async () => {
    const res = await request(app).post("/api/mask").send({});
    expect(res.status).toBe(400);
  });
});

describe("/api/unmask", () => {
  test("denies unauthorized unmask", async () => {
    const res = await request(app).post("/api/unmask").send({
      recordId: "demo",
      field: "SSN",
      role: "Teller",
      purpose: "testing purpose",
    });
    expect(res.status).toBe(403);
  });

  test("allows unmask for admin", async () => {
    const res = await request(app).post("/api/unmask").send({
      recordId: "customer-123",
      field: "EMAIL",
      role: "Administrator",
      purpose: "verification",
    });
    expect(res.status).toBe(200);
    expect(res.body.revealed).toBeDefined();
  });
});
