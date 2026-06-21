// ==========================================
// API.js - 數據通訊模組 (Data & API Module)
// ==========================================

const API_URL = 'https://api.steinhq.com/v1/storages/69ff888492b1163e97ef10df/工作表1';
const GOAL = 1000000;

// --- 1. 獲取並更新創世資金進度 (Hybrid Floating TVL) ---
async function updateProgress() {
    try {
        const syncText = document.getElementById('sync-progress-text');
        if (syncText) syncText.innerText = "SYNCING LIVE TVL...";

        // 🚀 雙軌並行抓取：Google Sheet 數據 + CoinGecko 即時幣價
        const [sheetRes, priceRes] = await Promise.all([
            fetch(API_URL).catch(() => null),
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd').catch(() => null)
        ]);

        // 取得最新幣價 (若 API 失敗則使用 Core.js 的安全緩存)
        let currentPrices = typeof livePrices !== 'undefined' ? livePrices : { BTC: 65000, ETH: 3500, SOL: 150 };
        if (priceRes && priceRes.ok) {
            const pData = await priceRes.json();
            if (pData.bitcoin) currentPrices.BTC = pData.bitcoin.usd;
            if (pData.ethereum) currentPrices.ETH = pData.ethereum.usd;
            if (pData.solana) currentPrices.SOL = pData.solana.usd;
        }

        const data = await sheetRes.json();
        let totalUSD = 0;
        let eligibleWallets = new Set();
        
        if (Array.isArray(data)) {
            data.forEach(item => {
                let amount = 0;
                let network = '';
                let staticUsd = 0;
                let status = '';
                let wallet = '';

                // 抓取 Sheet 各個欄位
                for (let key in item) {
                    const upperKey = key.toUpperCase();
                    if (upperKey.includes('ASSET_AMOUNT') || upperKey === 'AMOUNT') amount = parseFloat(item[key]) || 0;
                    else if (upperKey.includes('NETWORK')) network = (item[key] || '').toUpperCase();
                    else if (upperKey.includes('USD_VALUATION')) staticUsd = parseFloat(item[key]) || 0;
                    else if (upperKey.includes('STATUS')) status = (item[key] || '').toUpperCase();
                    else if (upperKey.includes('ADDRESS') || upperKey.includes('WALLET')) wallet = item[key];
                }
                
                // 🛡️ 核心防護：必須是 APPROVED 才計入
                if (status.includes('APPROVED')) {
                    if (wallet) eligibleWallets.add(wallet.trim().toLowerCase());
                    
                    // 📈 動態浮動計算邏輯：真實數量 x 即時市價
                    if (amount > 0 && network) {
    if (network.includes('SOL')) totalUSD += amount * currentPrices.SOL;
    else if (network.includes('JUP')) totalUSD += amount * currentPrices.JUP;
    else if (network.includes('JTO')) totalUSD += amount * currentPrices.JTO;
    else if (network.includes('PYTH')) totalUSD += amount * currentPrices.PYTH;
    else if (network.includes('BONK')) totalUSD += amount * currentPrices.BONK;
    else if (network.includes('BOME')) totalUSD += amount * currentPrices.BOME;
    else if (network.includes('USDC') || network.includes('USDT') || network.includes('USD')) totalUSD += amount; 
    else totalUSD += staticUsd;
} else if (staticUsd > 0) {
    totalUSD += staticUsd; 
}
                }
            });
        }
        
        let percent = Math.min((totalUSD / GOAL) * 100, 100).toFixed(2);
        
        const uiPercent = document.getElementById('sync-percent');
        const uiBar = document.getElementById('sync-bar');
        const syncNodes = document.getElementById('sync-nodes');
        const syncNodesZh = document.getElementById('sync-nodes-zh');

        // 更新 UI
        if (uiPercent) uiPercent.innerText = percent + '%';
        if (uiBar) uiBar.style.width = percent + '%';
        if (syncText) syncText.innerText = `SYNCED: $${totalUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} / $${GOAL.toLocaleString()}`;
        
        if (syncNodes) syncNodes.innerText = eligibleWallets.size;
        if (syncNodesZh) syncNodesZh.innerText = eligibleWallets.size;
        
    } catch (error) {
        console.error("Failed to fetch progress:", error);
        const syncText = document.getElementById('sync-progress-text');
        if (syncText) syncText.innerText = "SYNC FAILED. RETRYING...";
    }
}

window.updateProgress = updateProgress;

// --- 2. 提交地址到星際帳本 (Submit to Ledger) ---
async function submitToLedger() {
    const network = document.getElementById('reg-network').value;
    const amount = document.getElementById('reg-amount').value;
    const wallet = document.getElementById('reg-wallet').value;
    const hash = document.getElementById('reg-hash').value;
    
    if(!amount || !wallet || !hash) {
        alert("REQUIRED FIELDS MISSING / 請填寫完整打款資訊 (數量、錢包、TXID)");
        return;
    }

    const btn = document.getElementById('t-btn');
    const originalBtnText = btn.innerText;
    btn.innerText = "COMMITTING... / 提交中...";
    btn.disabled = true;

    // 🚀 將資料完美對齊「工作表1」嘅標題，並自動標記為 PENDING
    const payload = [{
        "TIMESTAMP (UTC)": new Date().toLocaleString(),
        "PIONEER_ADDRESS": wallet,
        "NETWORK": network,
        "ASSET_AMOUNT": amount,
        "TXID_HASH": hash,
        "VALIDATION_STATUS": "PENDING"
    }];

    try {
        // 直接寫入 API_URL (即係工作表1)
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(payload) 
        });
        
        if(response.ok) { 
            alert("SUCCESS: DATA COMMITTED / 提交成功！即將為您開啟先鋒樞紐..."); 
            
            document.getElementById('reg-amount').value = '';
            document.getElementById('reg-wallet').value = '';
            document.getElementById('reg-hash').value = '';
            updateProgress(); 
            
            // 🚀 終極跳轉魔法
            window.location.href = 'portal.html?auth=mars2026';
            
        } else {
            alert("SERVER ERROR / 伺服器錯誤: " + response.status);
        }
    } catch (e) { 
        alert("SIGNAL LOSS / 信號中斷"); 
    } finally {
        btn.innerText = originalBtnText;
        btn.disabled = false;
    }
}

// --- 3. 獲取即時幣價 (Fetch Live Prices) ---
async function fetchLivePrices() {
    try {
        const ids = 'solana,usd-coin,tether,jupiter-exchange-solana,jito-governance-token,pyth-network,bonk,book-of-meme';
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
        if (!response.ok) throw new Error("API fetch failed");

        const data = await response.json();
        if (data['solana']) livePrices.SOL = data['solana'].usd;
        if (data['usd-coin']) livePrices.USDC = data['usd-coin'].usd;
        if (data['tether']) livePrices.USDT = data['tether'].usd;
        if (data['jupiter-exchange-solana']) livePrices.JUP = data['jupiter-exchange-solana'].usd;
        if (data['jito-governance-token']) livePrices.JTO = data['jito-governance-token'].usd;
        if (data['pyth-network']) livePrices.PYTH = data['pyth-network'].usd;
        if (data['bonk']) livePrices.BONK = data['bonk'].usd;
        if (data['book-of-meme']) livePrices.BOME = data['book-of-meme'].usd;

        if (typeof runPhase1Calc === "function") runPhase1Calc();
    } catch (error) {
        console.error("CoinGecko API Error, using cached prices.");
    }
}
