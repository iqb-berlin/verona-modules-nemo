import { defineConfig } from 'cypress';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Register the deleteFile task
      on('task', {
        deleteFile(filePath) {
          try {
            const fullPath = path.resolve(filePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              return `File deleted: ${filePath}`;
            }
            return `File not found: ${filePath}`;
          } catch (error) {
            throw new Error(`Failed to delete file: ${error.message}`);
          }
        }
      });
    },
    fixturesFolder: 'cypress/fixtures'
  }
});
