export function SaveBar({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <div className="save-bar">
      <button onClick={onSave} disabled={saving}>
        Save changes
      </button>
    </div>
  );
}
