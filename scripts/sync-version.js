import fs from 'node:fs';
import path from 'node:path';

const packages = ['packages/babel-preset-lynjs', 'packages/lynjs'];

const [, , nextVersion] = process.argv;
if (!nextVersion) {
  console.error('nextVersion is required, e.g. 0.1.0');
  process.exit(1);
}

packages.forEach((pkg) => {
  const packagePath = path.resolve(pkg, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  packageJson.version = nextVersion;

  // Synchronize lynjs dependencies/peer dependencies as well (only when present)
  if (packageJson.dependencies?.lynjs) {
    packageJson.dependencies.lynjs = `^${nextVersion}`;
  }

  if (packageJson.peerDependencies?.lynjs) {
    packageJson.peerDependencies.lynjs = `^${nextVersion}`;
  }

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`[sync] ${pkg} -> ${nextVersion}`);
});
