const { Octokit } = require("@octokit/rest");
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs').promises;
const path = require('path');

const commitTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci', 'build', 'revert'];
const commitSubjects = [
  'User data synchronization',
  'Update API documentation',
  'Fix minor logging bug',
  'Refactor UI components',
  'Add authentication unit tests',
  'Update dependencies',
  'Automate build process',
  'Improve query performance',
  'Reconfigure CI workflow',
  'Implement pairing feature',
  'Fix typo in contribution',
  'Update database schema',
  'Add input validation',
  'Revise team workflow',
  'Integrate notification module',
  'Remove unused code',
  'Update configuration files',
  'Optimize image assets',
  'Implement caching',
  'Fix security issue'
];
const fileNames = [
  'sync-session.log',
  'user-data.json',
  'api-docs.md',
  'styles/main.css',
  'auth-module.js',
  'tests/login.test.js',
  'package-lock.json',
  'db-query.sql',
  'ci-pipeline.yml',
  'README.md'
];

async function runPairCycle(config) {
  const collaborators = config.collaborators;
  if (!collaborators || collaborators.length === 0) {
    console.error(`[${new Date().toLocaleString()}] ❌ Error in Pair: 'collaborators' list in config.json is empty or missing.`);
    return;
  }
  const randomCollaborator = collaborators[Math.floor(Math.random() * collaborators.length)];
  
  const authorName = randomCollaborator.name;
  const authorEmail = randomCollaborator.email_noreply;
  const tokenB = randomCollaborator.token_classic;

  const repoUrl = `https://${authorName}:${tokenB}@github.com/${config.owner_repo}/${config.repo_name}.git`;
  const cloneDir = path.join(__dirname, '..', 'temp-pair-repo');
  const timestamp = Date.now();
  const newBranchName = `dev-${authorName}-${timestamp}`;
  const octokitA = new Octokit({ auth: config.token_a });

  try {
    console.log(`[${new Date().toLocaleString()}] 🧑‍🤝‍🧑 Starting Pair cycle (Author: ${authorName})...`);

    await fs.rm(cloneDir, { recursive: true, force: true });
    await exec(`git clone ${repoUrl} ${cloneDir}`);
    const gitExecOptions = { cwd: cloneDir };
    await exec(`git config user.name "${authorName}"`, gitExecOptions);
    await exec(`git config user.email "${authorEmail}"`, gitExecOptions);
    await exec(`git checkout -b ${newBranchName}`, gitExecOptions);
    
    const randomFileName = fileNames[Math.floor(Math.random() * fileNames.length)];
    const filePath = path.join(cloneDir, randomFileName);
    const fileContent = `# Session Log ${timestamp} by ${authorName}\nChanges at ${new Date().toISOString()}`;
    const dirName = path.dirname(filePath);
    try { await fs.access(dirName); } catch (e) { await fs.mkdir(dirName, { recursive: true }); }
    await fs.writeFile(filePath, fileContent);
    
    const randomType = commitTypes[Math.floor(Math.random() * commitTypes.length)];
    const randomSubject = commitSubjects[Math.floor(Math.random() * commitSubjects.length)];
    const commitMessage = `${randomType}: ${randomSubject}\n\nThis pairing session involved ${authorName} and ${config.coauthor_name}.\nSession ID: ${timestamp}\n\nCo-authored-by: ${config.coauthor_name} <${config.coauthor_email_noreply}>`;
    
    await exec(`git add .`, gitExecOptions);
    await exec(`git commit -m "${commitMessage}"`, gitExecOptions);
    console.log(`-> Commit created by ${authorName} with co-author ${config.coauthor_name}.`);
    await exec(`git push origin ${newBranchName}`, gitExecOptions);
    
    const pr = await octokitA.pulls.create({
      owner: config.owner_repo,
      repo: config.repo_name,
      title: `[${authorName}] ${randomSubject}`,
      head: newBranchName,
      base: 'main'
    });
    console.log(`-> PR #${pr.data.number} created.`);
    await octokitA.pulls.merge({
      owner: config.owner_repo,
      repo: config.repo_name,
      pull_number: pr.data.number
    });
    console.log(`-> PR #${pr.data.number} merged.`);
    
    console.log(`[${new Date().toLocaleString()}] ✅ Pair cycle (Author: ${authorName}) completed successfully!`);
  } catch (error) {
    console.error(`[${new Date().toLocaleString()}] ❌ Error in Pair (Author: ${authorName}):`, error.message);
    if (error.stderr) {
      console.error('Stderr:', error.stderr);
    }
  } finally {
    await fs.rm(cloneDir, { recursive: true, force: true });
  }
}

module.exports = { runPairCycle };