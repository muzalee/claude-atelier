import { useState } from "react";

export function ProfileCard() {
  const [name, setName] = useState("");

  return (
    <section style={{ background: "#f9fafb", border: "1px solid #e5e5e5", padding: 24 }}>
      <label style={{ color: "#374151" }}>Display name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ background: "#ffffff", color: "#1a1a1a", border: "1px solid #d1d5db" }}
      />
      <button style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 16px" }}>
        Save
      </button>
    </section>
  );
}
