// Sample JavaScript file for SyncSphere testing
const fs = require('fs');
const path = require('path');

function scanDirectory(dirPath) {
    const results = [];
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        results.push({
            name: item,
            size: stat.size,
            isDirectory: stat.isDirectory()
        });
    }
    return results;
}

module.exports = { scanDirectory };
