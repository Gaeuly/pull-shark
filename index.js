const { Octokit } = require("@octokit/rest");
const { Buffer } = require("buffer");

const TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "Gaeuly";
const REPO = "pull-request";

const octokit = new Octokit({ auth: TOKEN });

async function main() {
  try {
    const timestamp = Date.now();
    const newBranchName = `automated-branch-${timestamp}`;
    const filePath = "README.md";

    console.log("1. Mengambil info branch 'main'...");
    const mainBranch = await octokit.rest.repos.getBranch({
      owner: OWNER,
      repo: REPO,
      branch: "main",
    });
    const mainSha = mainBranch.data.commit.sha;

    console.log(`2. Membuat branch baru: ${newBranchName}...`);
    await octokit.rest.git.createRef({
      owner: OWNER,
      repo: REPO,
      ref: `refs/heads/${newBranchName}`,
      sha: mainSha,
    });

    console.log(`3. Mengambil konten file: ${filePath}...`);
    const fileContent = await octokit.rest.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: filePath,
      ref: newBranchName,
    });

    console.log("4. Mengupdate file untuk membuat commit...");
    const oldContent = Buffer.from(fileContent.data.content, "base64").toString("utf-8");
    const newContent = oldContent + `\nUpdate otomatis pada ${new Date().toISOString()}`;
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: filePath,
      message: `Commit otomatis dari bot Node.js`,
      content: Buffer.from(newContent).toString("base64"),
      sha: fileContent.data.sha,
      branch: newBranchName,
    });

    console.log("5. Membuat Pull Request...");
    const pullRequest = await octokit.rest.pulls.create({
      owner: OWNER,
      repo: REPO,
      title: `PR Otomatis ${timestamp}`,
      head: newBranchName,
      base: "main",
      body: "PR ini dibuat secara otomatis oleh script Node.js.",
    });

    console.log("Menunggu 5 detik sebelum merge...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("6. Me-merge Pull Request...");
    await octokit.rest.pulls.merge({
      owner: OWNER,
      repo: REPO,
      pull_number: pullRequest.data.number,
    });

    console.log(`7. Menghapus branch: ${newBranchName}...`);
    await octokit.rest.git.deleteRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${newBranchName}`,
    });

    console.log("\n✅ Siklus selesai! Satu Pull Shark berhasil didapatkan.");
  } catch (error) {
    console.error("❌ Terjadi error:", error.message);
  }
}

main();