export async function getOpfsRoot() {
  return await navigator.storage.getDirectory();
}

export async function saveToOPFS(file) {
  const root = await getOpfsRoot();
  let baseName = file.name;
  let extension = '';
  const lastDot = file.name.lastIndexOf('.');
  if (lastDot !== -1) {
    baseName = file.name.substring(0, lastDot);
    extension = file.name.substring(lastDot);
  }

  let uniqueName = file.name;
  let counter = 1;
  let fileHandle = null;

  while (true) {
    try {
      // Try to get handle without creating. If it exists, this succeeds.
      await root.getFileHandle(uniqueName);
      // If we are here, file exists. We must rename.
      uniqueName = `${baseName}_(${counter})${extension}`;
      counter++;
    } catch (e) {
      if (e.name === 'NotFoundError') {
        // File does not exist, we found our unique name!
        fileHandle = await root.getFileHandle(uniqueName, { create: true });
        break;
      } else {
        throw e;
      }
    }
  }

  const writable = await fileHandle.createWritable();
  await writable.write(file);
  await writable.close();
  return uniqueName;
}

export async function listOPFSFiles() {
  const root = await getOpfsRoot();
  const files = [];
  // Using values to iterate over files in OPFS root (better browser compatibility)
  for await (const handle of root.values()) {
    if (handle.kind === 'file' && handle.name.endsWith('.parquet')) {
      const file = await handle.getFile();
      files.push({
        id: `OPFS|${handle.name}`,
        name: handle.name,
        size: file.size,
        source: 'OPFS',
      });
    }
  }
  return files;
}

export async function deleteFromOPFS(filename) {
  const root = await getOpfsRoot();
  await root.removeEntry(filename);
}

export async function getFileFromOPFS(filename) {
  const root = await getOpfsRoot();
  const handle = await root.getFileHandle(filename);
  const file = await handle.getFile();
  return file;
}
