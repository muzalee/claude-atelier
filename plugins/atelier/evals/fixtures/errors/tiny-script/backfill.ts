// one-off: re-hash avatars that were stored at the wrong size
import { readdir, stat } from "node:fs/promises";

const DIR = process.env.AVATAR_DIR!;

for (const file of await readdir(DIR)) {
  const info = await stat(`${DIR}/${file}`);
  if (info.size > 2_000_000) {
    console.log("too big, skipping", file);
    continue;
  }
  await resize(`${DIR}/${file}`);
}

async function resize(path: string) {
  // ...
}
