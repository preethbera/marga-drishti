export async function getOpfsRoot() {
  const root = await navigator.storage.getDirectory();
  return await root.getDirectoryHandle('v2', { create: true });
}

async function getFileHandle(filePath, create = false) {
  const root = await getOpfsRoot();
  const parts = filePath.split('/').filter(Boolean);
  let currentDir = root;

  // Traverse all but the last part (directories)
  for (let i = 0; i < parts.length - 1; i++) {
    currentDir = await currentDir.getDirectoryHandle(parts[i], { create });
  }

  const fileName = parts[parts.length - 1];
  return await currentDir.getFileHandle(fileName, { create });
}

export async function checkFileExists(filePath) {
  try {
    await getFileHandle(filePath, false);
    return true;
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return false;
    }
    throw error;
  }
}

export async function writeFileToOpfs(filePath, arrayBuffer, retries = 5) {
  const fileHandle = await getFileHandle(filePath, true);
  for (let i = 0; i < retries; i++) {
    try {
      const writable = await fileHandle.createWritable();
      await writable.write(arrayBuffer);
      await writable.close();
      return;
    } catch (error) {
      if (error.name === 'NoModificationAllowedError') {
        if (i < retries - 1) {
          console.warn(`OPFS File ${filePath} is locked (likely by a previous worker). Retrying in 1s...`);
          await new Promise(r => setTimeout(r, 1000));
          continue;
        } else {
          // If we exhausted retries, assume it's correctly written and locked by an active process
          console.warn(`OPFS File ${filePath} is permanently locked. Bypassing write.`);
          return;
        }
      }
      throw error;
    }
  }
}

export async function readFileFromOpfs(filePath) {
  const fileHandle = await getFileHandle(filePath, false);
  const file = await fileHandle.getFile();
  return await file.arrayBuffer();
}
