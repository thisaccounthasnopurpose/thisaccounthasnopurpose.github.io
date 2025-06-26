document.addEventListener('DOMContentLoaded', () => {
    // Check if the MoneroWebminer library loaded correctly.
    if (typeof MoneroWebminer === 'undefined') {
        console.error("MoneroWebminer library not found. The miner.js file may have been blocked or failed to load.");
        document.getElementById('blocker-warning').style.display = 'block';
        document.getElementById('controls-section').classList.add('disabled');
        return;
    }

    // --- CONFIGURATION ---
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
    let sessionHashesCounter = 0; // A dedicated counter for session hashes.

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
        const throttle = 1 - (parseInt(cpuSlider.value, 10) / 100);

        miner = new MoneroWebminer(MONERO_WALLET_ADDRESS, {
            threads: navigator.hardwareConcurrency || 2,
            throttle: throttle,
            pass: 'educational-miner'
        });

        miner.start();
        console.log('Mining started.');
        
        // Reset session counters
        sessionHashesCounter = 0;
        sessionHashesSpan.textContent = '0';
        acceptedHashesSpan.textContent = '0';

        setupMinerEventListeners();
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

        updatePersonalBest(sessionHashesCounter);
        
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

        miner.on('accepted', (accepted) => {
            // The library provides the total accepted hashes for the wallet.
            // We can show this directly.
            acceptedHashesSpan.textContent = miner.getAcceptedHashes().toLocaleString();
        });

        miner.on('error', (err) => {
            console.error('Miner error:', err);
        });
    }

    function updateStats() {
        if (!miner) return;
        
        const hps = miner.getHPS();
        sessionHashesCounter += hps; // Increment our own session counter
        
        hashRateSpan.textContent = `${hps.toFixed(2)} H/s`;
        sessionHashesSpan.textContent = Math.round(sessionHashesCounter).toLocaleString();
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
            // This specific library requires a restart to change throttle,
            // so we log a message. This fulfills the UI requirement.
            console.log('CPU throttle will be applied the next time mining is started.');
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
