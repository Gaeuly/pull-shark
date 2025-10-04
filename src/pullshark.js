const { Octokit } = require("@octokit/rest");
const { Buffer } = require("buffer");

async function runPullSharkCycle(config) {
  try {
    const octokit = new Octokit({ auth: config.token });
    const timestamp = Date.now();
    const newBranchName = `automated-branch-${timestamp}`;

    console.log(`[${new Date().toLocaleString()}] 🦈 Starting Pull Shark cycle...`);

    const mainBranch = await octokit.rest.repos.getBranch({
      owner: config.owner,
      repo: config.repo,
      branch: "main"
    });

    await octokit.rest.git.createRef({
      owner: config.owner,
      repo: config.repo,
      ref: `refs/heads/${newBranchName}`,
      sha: mainBranch.data.commit.sha
    });
    
    const fileContent = await octokit.rest.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path: "README.md",
      ref: newBranchName
    });

    const newContent =
      Buffer.from(fileContent.data.content, "base64").toString("utf-8") +
      `\nAutomated update at ${new Date().toISOString()}`;
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: config.owner,
      repo: config.repo,
      path: "README.md",
      message: "Automated commit from bot",
      content: Buffer.from(newContent).toString("base64"),
      sha: fileContent.data.sha,
      branch: newBranchName
    });
    
    const pullRequest = await octokit.rest.pulls.create({
      owner: config.owner,
      repo: config.repo,
      title: `Automated PR ${timestamp}`,
      head: newBranchName,
      base: "main",
      body: "This PR was automatically created by the bot."
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await octokit.rest.pulls.merge({
      owner: config.owner,
      repo: config.repo,
      pull_number: pullRequest.data.number
    });
    
    await octokit.rest.git.deleteRef({
      owner: config.owner,
      repo: config.repo,
      ref: `heads/${newBranchName}`
    });
    
    console.log(`[${new Date().toLocaleString()}] ✅ Pull Shark cycle completed successfully!`);
  } catch (error) {
    console.error(`[${new Date().toLocaleString()}] ❌ Error in Pull Shark:`, error.message);
  }
}

module.exports = { runPullSharkCycle };