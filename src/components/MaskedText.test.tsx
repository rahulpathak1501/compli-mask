import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { MaskedText } from "./MaskedText";
import { DataElementEnum } from "../shared";

const server = setupServer(
  http.post("/api/mask", (req) => {
    return HttpResponse.json(
      {
        masked: "***-**-6789",
        level: "PARTIAL4",
        reason: "",
        source: "Policy",
      },
      { status: 200 }
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("MaskedText displays loading then masked value", async () => {
  render(
    <MaskedText
      value="123-45-6789"
      dataType={DataElementEnum.SSN}
      role="Supervisor"
    />
  );

  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  await waitFor(() =>
    expect(screen.getByText("***-**-6789")).toBeInTheDocument()
  );

  expect(screen.getByText(/masked by policy/i)).toBeInTheDocument();
});
