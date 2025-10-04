const config = require('./config.json');
const { runPullSharkCycle } = require('./src/pullshark.js');
const { runPairCycle } = require('./src/pair.js');

function getRandomDelay(minMinutes, maxMinutes) {
  const minMs = minMinutes * 60 * 1000;
  const maxMs = maxMinutes * 60 * 1000;
  return Math.floor(Math.random() * (maxMs - minMs + 1) + minMs);
}

async function scheduleNextRun(botFunction, config, botName, minMinutes, maxMinutes) {
  await botFunction(config);

  const nextDelay = getRandomDelay(minMinutes, maxMinutes);
  const nextRunTime = new Date(Date.now() + nextDelay);
  
  console.log(`-> ✅ ${botName} finished. Next execution scheduled at ${nextRunTime.toLocaleTimeString('en-US')} (about ${(nextDelay / 60000).toFixed(1)} minutes from now).`);
  
  setTimeout(() => scheduleNextRun(botFunction, config, botName, minMinutes, maxMinutes), nextDelay);
}

console.log("🚀 Combined Bot Started with Random Schedule!");

console.log("🦈 Starting first Pull Shark cycle...");
scheduleNextRun(runPullSharkCycle, config.pullshark, 'Pull Shark', 30, 35);

console.log("🧑‍🤝‍🧑 Waiting 1 minute before starting first Pair Extraordinaire cycle...");
setTimeout(() => {
  console.log("🧑‍🤝‍🧑 Starting first Pair Extraordinaire cycle...");
  scheduleNextRun(runPairCycle, config.pair_extraordinaire, 'Pair Extraordinaire', 60, 70);
}, 1 * 60 * 1000);