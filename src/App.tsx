import { useState } from "react";
import { MaskedText } from "./components/MaskedText";
import { DataElementEnum } from "./shared";
import { aiSuggestMaskLevel } from "./server/ai";

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

export default function App() {
  const [userRole, setUserRole] = useState(roles[0]);

  return (
    <>
      <h3>Data Masking Test</h3>
      <label>
        Select User Role:
        <select onChange={(e) => setUserRole(e.target.value)} value={userRole}>
          {roles.map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
      </label>
      <div>
        {(Object.keys(sampleData) as DataElementEnum[]).map((key) => (
          <div key={key}>
            <strong>{key}:</strong>{" "}
            <MaskedText
              value={sampleData[key]!}
              dataType={key}
              role={userRole}
              aiProvider={aiSuggestMaskLevel} // Pass AI provider here!
            />
          </div>
        ))}
      </div>
    </>
  );
}
