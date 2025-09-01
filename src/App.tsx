import { useState } from "react";
import { MaskedText } from "./components/MaskedText";
import { DataElementEnum } from "./shared";

const sampleData: Partial<Record<DataElementEnum, string>> = {
  [DataElementEnum.SSN]: "123-45-6789",
  [DataElementEnum.ACCOUNT_NUMBER]: "9876543210",
  [DataElementEnum.PHONE]: "9876543210",
  [DataElementEnum.EMAIL]: "rahul@example.com",
};

const roles = [
  "Administrator",
  "Regional Manager",
  "Manager",
  "Supervisor",
  "Teller",
];

// const sampleData = {
//   SSN: "123-45-6789",
//   ACCOUNT_NUMBER: "9876543210",
//   PHONE: "9876543210",
//   EMAIL: "rahul@example.com",
// };

export default function App() {
  const [userRole, setUserRole] = useState(roles[0]);

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "auto",
        padding: 20,
        fontFamily: "sans-serif",
      }}
    >
      <h1>Data Masking Test</h1>

      <label htmlFor="roleSelect">Select User Role: </label>
      <select
        id="roleSelect"
        value={userRole}
        onChange={(e) => setUserRole(e.target.value)}
        style={{ marginBottom: 20, padding: 8, fontSize: 16 }}
      >
        {roles.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>

      {(Object.keys(sampleData) as DataElementEnum[]).map((key) => (
        <div key={key}>
          <strong>{key}:</strong>{" "}
          <MaskedText
            value={sampleData[key] ?? ""}
            dataType={key}
            role={userRole}
          />
        </div>
      ))}
    </div>
  );
}
