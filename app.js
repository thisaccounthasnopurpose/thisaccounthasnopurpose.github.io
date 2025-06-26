document.addEventListener('DOMContentLoaded', () => {
    // Check if the miner client loaded correctly.
    if (typeof CryptoNoter === 'undefined' || typeof CryptoNoter.User !== 'function') {
        console.error("Miner client (CryptoNoter) not found. The cryptonight.js file may have been blocked or failed to load.");
        document.getElementById('blocker-warning').style.display = 'block';
        document.getElementById('controls-section').classList.add('disabled');
        return; // Halt execution if the miner is not available.
    }

    // --- CONFIGURATION ---
    // NOTE: This miner uses a pool that requires a site key. Your Monero address is used as the 'user' for payouts.
    const POOL_API_KEY = '8454b02562475a3a79d2a3f01b1b1f81a7b483863a3e46c751e1837c7f3b8a1c'; // Public key for supportxmr.com pool
    const MONERO_WALLET_ADDRESS = '48TjjUjavn7fjTQTj9uUwwf2WXQD55MRYebih88G4VnTUPy8ivTEwKJFHZx5DREWWF5QZXkUqYbFq6Uvnq7iw7mHC4seyxZ';
    const MINING_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

    // --- DOM ELEMENT REFERENCES ---
    const miningToggle = document.getElementById('miningToggle');
    const timeoutOverrideToggle = document.getElementById('timeoutOverrideToggle');
    const cpuSlider = document.getElementById('cpuSlider');
    const cpuValueSpan = document.getElementById('cpuValue');
    const moneroPriceSpan = document.getElementById('moneroPrice');
    const hashRateSpan = document.getElementById('hashRate');
    const sessionHashesSpan = document.getElementById('sessionHashes');
    const acceptedHashesSpan = document.getElementById('acceptedHashes');
    const personalBestSpan = document.getElementById('personalBest');

    // --- STATE VARIABLES ---
    let miner = null;
    let miningTimeoutId = null;
    let statsUpdateIntervalId = null;
    let lastTotalHashes = 0;

    // --- INITIALIZATION ---
    const personalBest = localStorage.getItem('personalBestHashes') || '0';
    personalBestSpan.textContent = parseInt(personalBest).toLocaleString();
    fetchMoneroPrice();
    setInterval(fetchMoneroPrice, 5 * 60 * 1000);

    // --- CORE FUNCTIONS ---
    async function fetchMoneroPrice() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=monero&vs_currencies=usd');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            moneroPriceSpan.textContent = `$${data.monero.usd.toFixed(2)}`;
        } catch (error) {
            console.error('Failed to fetch Monero price:', error);
            moneroPriceSpan.textContent = '$--.--';
        }
    }
    
    function startMining() {
        const threads = navigator.hardwareConcurrency || 2;
        const throttle = 1 - (parseInt(cpuSlider.value, 10) / 100);

        miner = new CryptoNoter.User(POOL_API_KEY, MONERO_WALLET_ADDRESS, {
            threads: threads,
            throttle: throttle,
        });

        setupMinerEventListeners();
        miner.start(CryptoNoter.User.Token.EVENT_JOB); // Start mining
        console.log('Mining started.');
        
        lastTotalHashes = 0;
        statsUpdateIntervalId = setInterval(updateStats, 1000);

        if (!timeoutOverrideToggle.checked) {
            miningTimeoutId = setTimeout(() => {
                console.log('Automatic 1-hour timeout reached.');
                miningToggle.checked = false;
                stopMining();
            }, MINING_TIMEOUT_MS);
        }
    }

    function stopMining() {
        if (!miner) return;

        updatePersonalBest(miner.hashes);
        
        miner.stop();
        console.log('Mining stopped.');
        
        clearInterval(statsUpdateIntervalId);
        clearTimeout(miningTimeoutId);
        statsUpdateIntervalId = null;
        miningTimeoutId = null;
        miner = null; 

        hashRateSpan.textContent = '0 H/s';
    }

    function setupMinerEventListeners() {
        if (!miner) return;

        miner.on('accepted', (data) => {
            acceptedHashesSpan.textContent = miner.acceptedHashes.toLocaleString();
        });

        miner.on('error', (err) => {
            console.error('Miner error:', err.error);
        });
    }

    function updateStats() {
        if (!miner) return;
        
        const currentTotalHashes = miner.hashes || 0;
        const hps = currentTotalHashes - lastTotalHashes;
        lastTotalHashes = currentTotalHashes;
        
        hashRateSpan.textContent = `${hps.toFixed(2)} H/s`;
        sessionHashesSpan.textContent = Math.round(currentTotalHashes).toLocaleString();
    }
    
    function updatePersonalBest(currentSessionHashes) {
        const oldBest = parseInt(localStorage.getItem('personalBestHashes') || '0', 10);
        const roundedHashes = Math.round(currentSessionHashes);
        if (roundedHashes > oldBest) {
            console.log(`New personal best: ${roundedHashes} hashes!`);
            localStorage.setItem('personalBestHashes', roundedHashes);
            personalBestSpan.textContent = roundedHashes.toLocaleString();
        }
    }

    // --- EVENT LISTENERS ---
    miningToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            startMining();
        } else {
            stopMining();
        }
    });

    cpuSlider.addEventListener('input', (e) => {
        const cpuPercentage = parseInt(e.target.value, 10);
        cpuValueSpan.textContent = `${cpuPercentage}%`;
        
        if (miner) {
            miner.throttle = 1 - (cpuPercentage / 100);
        }
    });

    timeoutOverrideToggle.addEventListener('change', (e) => {
        if (miningToggle.checked) {
            clearTimeout(miningTimeoutId);
            miningTimeoutId = null;
            if (!e.target.checked) {
                miningTimeoutId = setTimeout(() => {
                    console.log('Automatic 1-hour timeout re-enabled and reached.');
                    miningToggle.checked = false;
                    stopMining();
                }, MINING_TIMEOUT_MS);
            }
        }
    });
});
