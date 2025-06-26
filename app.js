document.addEventListener('DOMContentLoaded', () => {
    // Check if the miner client loaded correctly.
    if (typeof CoinImp === 'undefined') {
        console.error("Miner client (CoinImp) not found. The miner.js file may have been blocked or failed to load.");
        document.getElementById('blocker-warning').style.display = 'block';
        document.getElementById('controls-section').classList.add('disabled');
        return; // Halt execution if the miner is not available.
    }

    // --- CONFIGURATION ---
    const COINIMP_PUBLIC_KEY = '233458a2872365313a1728639a585728a50f1574e83c218a5943b355e76a3a49'; // This is a public key for the pool, not your wallet.
    const MONERO_WALLET_ADDRESS = '48TjjUjavn7fjTQTj9uUwwf2WXQD55MRYebih88G4VnTUPy8ivTEwKJFHZx5DREWWF5QZXkUqYbFq6Uvnq7iw7mHC4seyxZ'; // Your wallet for payouts.
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
        miner = new CoinImp();
        miner.init(COINIMP_PUBLIC_KEY, MONERO_WALLET_ADDRESS); // Initialize with public key and your wallet address.
        
        // Configure miner before starting
        miner.setNumThreads(navigator.hardwareConcurrency || 2);
        miner.setThrottle(1 - (parseInt(cpuSlider.value, 10) / 100));

        setupMinerEventListeners();
        miner.start();
        console.log('Mining started.');
        
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

        updatePersonalBest(miner.getTotalHashes());
        
        miner.stop();
        console.log('Mining stopped.');
        
        clearInterval(statsUpdateIntervalId);
        clearTimeout(miningTimeoutId);
        statsUpdateIntervalId = null;
        miningTimeoutId = null;
        miner = null; 

        hashRateSpan.textContent = '0 H/s';
        sessionHashesSpan.textContent = '0';
    }

    function setupMinerEventListeners() {
        if (!miner) return;

        miner.onAccepted = (hashes) => {
            acceptedHashesSpan.textContent = hashes.toLocaleString();
        };

        miner.onError = (error) => {
            console.error('Miner error:', error);
        };
    }

    function updateStats() {
        if (!miner) return;
        
        const hps = miner.getHashesPerSecond();
        const totalHashes = miner.getTotalHashes();
        
        hashRateSpan.textContent = `${parseFloat(hps).toFixed(2)} H/s`;
        sessionHashesSpan.textContent = Math.round(totalHashes).toLocaleString();
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
            miner.setThrottle(1 - (cpuPercentage / 100));
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
