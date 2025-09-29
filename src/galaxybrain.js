const { Octokit } = require("@octokit/rest");

const qaBank = [
  { question: "Apa bedanya git fetch dan git pull?", answer: "Secara singkat, `git fetch` hanya mengunduh data baru dari remote tanpa menggabungkannya. Sedangkan `git pull` itu sama dengan `git fetch` yang langsung diikuti `git merge`." },
  { question: "Bagaimana cara membuat file .gitignore?", answer: "Tinggal buat file baru di root proyekmu dan beri nama `.gitignore`. Lalu tulis nama file/folder yang mau diabaikan." },
  { question: "Apa fungsi `git revert`?", answer: "`git revert` digunakan untuk membatalkan perubahan dari sebuah commit dengan membuat commit baru yang isinya kebalikan dari commit yang di-revert." }
];

async function getGalaxyBrainIds(octokit, owner, repo) {
    const response = await octokit.graphql(`query getRepo($owner: String!, $repo: String!) { repository(owner: $owner, name: $repo) { id, discussionCategories(first: 10) { nodes { id, name } } } }`, { owner, repo });
    const repoId = response.repository.id;
    const qaCategory = response.repository.discussionCategories.nodes.find(c => c.name === "Q&A");
    if (!qaCategory) throw new Error("Kategori 'Q&A' tidak ditemukan.");
    return { repoId, qaCategoryId: qaCategory.id };
}

async function runGalaxyBrainCycle(config) {
  try {
    const octokitA = new Octokit({ auth: config.token_a });
    const octokitB = new Octokit({ auth: config.token_b });

    console.log(`[${new Date().toLocaleString()}] 🧠 Memulai siklus Galaxy Brain...`);

    const { repoId, qaCategoryId } = await getGalaxyBrainIds(octokitA, config.owner, config.repo);
    const randomQA = qaBank[Math.floor(Math.random() * qaBank.length)];
    const questionTitle = randomQA.question;
    const questionBody = `Halo semua, ada yang bisa bantu jelaskan ini: ${randomQA.question}? Terima kasih!`;
    const answerBody = randomQA.answer + " Semoga membantu ya!";

    const discussionResponse = await octokitB.graphql(
      `
      mutation createDiscussion($repoId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
        createDiscussion(input: { 
          repositoryId: $repoId, 
          categoryId: $categoryId, 
          title: $title, 
          body: $body 
        }) {
          discussion { id }
        }
      }
      `,
      { repoId, categoryId: qaCategoryId, title: questionTitle, body: questionBody }
    );
    const discussionId = discussionResponse.createDiscussion.discussion.id;

    const commentResponse = await octokitA.graphql(`mutation addComment($discussionId: ID!, $body: String!) { addDiscussionComment(input: { discussionId: $discussionId, body: $body }) { comment { id } } }`, { discussionId, body: answerBody });
    const commentId = commentResponse.addDiscussionComment.comment.id;
    
    await octokitB.graphql(`mutation markAsAnswer($commentId: ID!) { markDiscussionCommentAsAnswer(input: { id: $commentId }) { clientMutationId } }`, { commentId });

    console.log(`[${new Date().toLocaleString()}] ✅ Siklus Galaxy Brain berhasil!`);
  } catch (error) {
    console.error(`[${new Date().toLocaleString()}] ❌ Error di Galaxy Brain:`, error.message);
  }
}

module.exports = { runGalaxyBrainCycle };
