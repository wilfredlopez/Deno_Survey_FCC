import { dejs } from "./deps.ts";
const BASE_PATH = `${Deno.cwd()}/views/`;
export async function fileExist(filename: string) {
  try {
    const stats = await Deno.lstat(filename);
    return stats && stats.isFile;
  } catch (error) {
    if (error && error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

export async function renderView(filename: string, params: object = {}) {
  return await dejs.renderFileToString(
    BASE_PATH + filename + ".ejs",
    params,
  );
}
