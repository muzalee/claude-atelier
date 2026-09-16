export const db = {
  schedule: {
    forWorkspace: async (_workspaceId: string) => ({ shifts: [] }),
    addShift: async (_workspaceId: string, _shift: unknown) => ({ id: "sh_1" }),
  },
};
