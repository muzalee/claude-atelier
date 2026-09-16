export async function sendExport(exportId: string, userId: string) {
  const rows = await fetchRows(exportId);
  if (rows.length === 0) throw new Error("no rows");
  await upload(rows);          // throws on S3 timeout
  await notify(userId);        // throws if the user deleted their account
}

async function fetchRows(_id: string): Promise<unknown[]> { return []; }
async function upload(_rows: unknown[]) {}
async function notify(_userId: string) {}
