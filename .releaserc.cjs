const isCI = !!process.env.CI; // Default is true in GitHub Actions

module.exports = {
  repositoryUrl: 'git@github.com:lynjs-dev/lynjs.git',
  branches: ['main', { name: 'next', prerelease: true }],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { breaking: true, release: 'major' },
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'docs', release: false },
          { type: 'docs', scope: 'release', release: 'patch' },
          { type: 'chore', release: false },
          { type: 'chore', scope: 'release', release: 'patch' },
        ],
      },
    ],
    ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],

    // === The following 4 plugins only run in CI ===
    isCI && ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    isCI && ['@semantic-release/npm', { tarballDir: 'dist-tarball' }],
    isCI && ['@semantic-release/github', { assets: 'dist-tarball/*.tgz' }],
    isCI && [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ].filter(Boolean),
};
