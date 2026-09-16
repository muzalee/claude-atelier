import { ProfileCard } from "./ProfileCard.js";

export function SettingsPage() {
  return (
    <div style={{ background: "#ffffff", color: "#1a1a1a", minHeight: "100vh" }}>
      <h1 style={{ color: "#1a1a1a", fontSize: 28 }}>Settings</h1>
      <nav style={{ borderBottom: "1px solid #e5e5e5" }}>
        <a href="/settings/profile" style={{ color: "#2563eb" }}>Profile</a>
        <a href="/settings/notifications" style={{ color: "#6b7280" }}>Notifications</a>
      </nav>
      <ProfileCard />
    </div>
  );
}
