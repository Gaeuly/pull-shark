// Import konfigurasi dari file JSON
const config = require('./config.json');

// Import fungsi-fungsi bot dari folder src
const { runPullSharkCycle } = require('./src/pullshark.js');
const { runGalaxyBrainCycle } = require('./src/galaxybrain.js');

// --- PENJADWALAN ---
console.log("🚀 Bot Gabungan Dimulai dengan Struktur Baru!");

// --- Bot Pull Shark ---
const JEDA_PULL_SHARK = 60 * 60 * 1000; // Setiap 1 jam
console.log(`🦈 Bot Pull Shark akan berjalan setiap ${JEDA_PULL_SHARK / 60 / 1000} menit.`);
// Jalankan siklus pertama Pull Shark segera
runPullSharkCycle(config.pullshark); 
// Atur jadwal berulang untuk Pull Shark
setInterval(() => runPullSharkCycle(config.pullshark), JEDA_PULL_SHARK);

// --- Bot Galaxy Brain ---
const JEDA_GALAXY_BRAIN = 30 * 60 * 1000; // Setiap 30 menit
const JEDA_AWAL_GALAXY_BRAIN = 1 * 60 * 1000; // Jeda 1 menit saat startup
console.log(`🧠 Bot Galaxy Brain akan berjalan setiap ${JEDA_GALAXY_BRAIN / 60 / 1000} menit, setelah jeda awal ${JEDA_AWAL_GALAXY_BRAIN / 1000} detik.`);

// Beri jeda 1 menit sebelum menjalankan siklus pertama Galaxy Brain
setTimeout(() => {
    // Jalankan siklus pertama Galaxy Brain setelah jeda
    runGalaxyBrainCycle(config.galaxybrain); 
    // Atur jadwal berulang untuk Galaxy Brain
    setInterval(() => runGalaxyBrainCycle(config.galaxybrain), JEDA_GALAXY_BRAIN);
}, JEDA_AWAL_GALAXY_BRAIN);
