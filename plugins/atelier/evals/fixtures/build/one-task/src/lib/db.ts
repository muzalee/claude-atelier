export type Settings = { displayName: string; emailDigest: boolean };

const store = new Map<string, Settings>();

export const db = {
  settings: {
    forUser: async (userId: string): Promise<Settings> =>
      store.get(userId) ?? { displayName: "", emailDigest: false },
    save: async (userId: string, settings: Settings): Promise<Settings> => {
      store.set(userId, settings);
      return settings;
    },
  },
};
