import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, './src/dist');

(async () => {
    try {
        console.log(`Cleaning output directory: ${outDir}`);

        // Remove the directory if it exists
        await fs.remove(outDir);
        console.log('Output directory cleaned.');

    } catch (error) {
        console.error('Error during build process:', error);
    }
})();