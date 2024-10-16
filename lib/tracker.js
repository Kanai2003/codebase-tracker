const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { parseFile } = require('./utils');

// Recursively scans the codebase and calculates project stats
function scanCodebase(directory) {
  const files = glob.sync(path.join(directory, '**/*.{js,jsx,ts,tsx}'), { absolute: true, ignore: '**/node_modules/**' });
  const usageData = { functions: {}, totalLines: 0, totalFiles: files.length, totalDirectories: new Set(), fileTree: {} };

  files.forEach((file) => {
    if (fs.statSync(file).isFile()) {
      const fileDirectory = path.dirname(file);
      usageData.totalDirectories.add(fileDirectory);

      const relativeFilePath = path.relative(directory, file);

      // Populate the directory tree
      const dirs = relativeFilePath.split(path.sep);
      let currentLevel = usageData.fileTree;
      dirs.forEach((part, idx) => {
        if (!currentLevel[part]) {
          currentLevel[part] = idx === dirs.length - 1 ? { lines: 0 } : {};
        }
        currentLevel = currentLevel[part];
      });

      try {
        const fileUsage = parseFile(file);
        currentLevel.lines = fileUsage.totalLines;

        // Update project-wide total lines of code
        usageData.totalLines += fileUsage.totalLines;

        // Aggregate function usage
        Object.keys(fileUsage.functions).forEach((func) => {
          if (!usageData.functions[func]) {
            usageData.functions[func] = [];
          }
          usageData.functions[func].push({
            file: relativeFilePath,
            ...fileUsage.functions[func]
          });
        });
      } catch (error) {
        console.error(`Error parsing file ${file}: ${error.message}`);
      }
    }
  });

  usageData.totalDirectories = usageData.totalDirectories.size;
  return usageData;
}

module.exports = { scanCodebase };
