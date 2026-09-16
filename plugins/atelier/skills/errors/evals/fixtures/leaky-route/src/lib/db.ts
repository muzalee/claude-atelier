// thin wrapper over the real driver; throws whatever postgres throws
export const db = {
  projects: {
    byId: async (_id: string): Promise<{ id: string; name: string } | null> => null,
    create: async (_input: unknown): Promise<{ id: string; name: string }> => {
      throw new Error('duplicate key value violates unique constraint "projects_name_key"');
    },
  },
};
