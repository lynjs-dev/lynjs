const isCI = !!process.env.CI; // GitHub Actions에선 기본 true

module.exports = {
  repositoryUrl: "git@github.com:mogiya/test-project.git", 
  branches: [
    "main",
    { name: "next", prerelease: true },
  ],
  plugins: [
    ["@semantic-release/commit-analyzer", { preset: "conventionalcommits" }],
    ["@semantic-release/release-notes-generator", { preset: "conventionalcommits" }],

    // === 아래 4개는 CI에서만 실행 ===
    isCI && ["@semantic-release/changelog", { changelogFile: "CHANGELOG.md" }],
    isCI && ["@semantic-release/npm", { tarballDir: "dist-tarball" }],
    isCI && ["@semantic-release/github", { assets: "dist-tarball/*.tgz" }],
    isCI && ["@semantic-release/git", {
      assets: ["CHANGELOG.md", "package.json"],
      message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
    }],
  ].filter(Boolean),
};
