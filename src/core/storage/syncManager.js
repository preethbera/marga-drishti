import { writeFileToOpfs, checkFileExists } from './opfsUtils';

const REGISTRY_KEY = 'data_registry';

export async function syncDataFiles(onProgress) {
  try {
    if (onProgress) onProgress('Fetching manifest...');
    const response = await fetch('/data/index.json');
    if (!response.ok) {
      throw new Error('Failed to fetch manifest');
    }
    const manifest = await response.json();
    
    const localRegistry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}');
    let updatedRegistry = { ...localRegistry };
    
    for (const file of manifest) {
      const localHash = updatedRegistry[file.name];
      const needsUpdate = localHash !== file.hash;
      const existsInOpfs = await checkFileExists(file.name);
      
      if (needsUpdate || !existsInOpfs) {
        console.log(`Syncing ${file.name}...`);
        if (onProgress) onProgress(`Downloading ${file.name}...`);
        const fileResponse = await fetch(`/data/${file.name}`);
        if (!fileResponse.ok) {
          console.error(`Failed to fetch ${file.name}`);
          continue;
        }
        const arrayBuffer = await fileResponse.arrayBuffer();
        await writeFileToOpfs(file.name, arrayBuffer);
        updatedRegistry[file.name] = file.hash;
      } else {
        console.log(`File ${file.name} is up to date.`);
      }
    }
    
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(updatedRegistry));
    return manifest;
  } catch (error) {
    console.error('Error during data sync:', error);
    throw error;
  }
}
