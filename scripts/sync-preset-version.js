import fs from 'node:fs';
import path from 'node:path';

const [, , nextVersion] = process.argv;
if (!nextVersion) {
  console.error('nextVersion is required, e.g. 0.1.0');
  process.exit(1);
}

const presetPath = path.resolve('packages/babel-preset-lynjs/package.json');
const presetJson = JSON.parse(fs.readFileSync(presetPath, 'utf8'));

presetJson.version = nextVersion;

// Synchronize lynjs dependencies/peer dependencies as well (only when present)
if (presetJson.dependencies?.lynjs) {
  presetJson.dependencies.lynjs = nextVersion;
}
if (presetJson.peerDependencies?.lynjs) {
  presetJson.peerDependencies.lynjs = `^${nextVersion}`;
}

fs.writeFileSync(presetPath, JSON.stringify(presetJson, null, 2) + '\n');
console.log(`[sync] packages/babel-preset-lynjs -> ${nextVersion}`);
