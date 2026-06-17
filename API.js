// ==========================================
// API.js - 數據通訊模組 (Data & API Module)
// ==========================================

// 讀取同寫入全部統一使用「工作表1」
const API_URL = 'https://api.steinhq.com/v1/storages/69ff888492b1163e97ef10df/工作表1';
const GOAL = 1000000;

// --- 1. 獲取並更新創世資金進度 (Fetch Progress) ---
async function updateProgress() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        let totalUSD = 0;
        let eligibleWallets = new Set();
        
        if (Array.isArray(data)) {
            data.forEach(item => {
                let usdValue = 0;
                let wallet = '';
                let status = '';

                // 精準抓取，杜絕誤抓 ASSET_AMOUNT
                for (let key in item) {
                    const upperKey = key.toUpperCase();
                    if (upperKey.includes('USD_VALUATION')) {
                        let val = parseFloat(item[key]);
                        if (!isNaN(val)) usdValue = val;
                    }
                    if (upperKey.includes('ADDRESS') || upperKey.includes('WALLET')) {
                        wallet = item[key];
                    }
                    if (upperKey.includes('STATUS')) {
                        status = (item[key] || '').toUpperCase();
                    }
                }
                
                // 🛡️ 核心防護機制：必須有 USD 數值，且手動標記了 "APPROVED"，才會計入！
                if (usdValue > 0 && status.includes('APPROVED')) {
                    totalUSD += usdValue;
                    if (wallet) eligibleWallets.add(wallet.trim().toLowerCase());
                }
            });
        }
        
        let percent = Math.min((totalUSD / GOAL) * 100, 100).toFixed(2);
        document.getElementById('sync-percent').innerText = percent + '%';
        document.getElementById('sync-bar').style.width = percent + '%';
        document.getElementById('sync-progress-text').innerText = `SYNCED: $${totalUSD.toLocaleString()} / $${GOAL.toLocaleString()}`;
        
        const syncNodes = document.getElementById('sync-nodes');
        if (syncNodes) syncNodes.innerText = eligibleWallets.size;
        const syncNodesZh = document.getElementById('sync-nodes-zh');
        if (syncNodesZh) syncNodesZh.innerText = eligibleWallets.size;
        
    } catch (error) {
        console.error("Failed to fetch progress:", error);
        document.getElementById('sync-progress-text').innerText = "SYNC FAILED. RETRYING...";
    }
}

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
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
        if (!response.ok) throw new Error("API fetch failed");

        const data = await response.json();

        if (data.bitcoin && data.bitcoin.usd) livePrices.BTC = data.bitcoin.usd;
        if (data.ethereum && data.ethereum.usd) livePrices.ETH = data.ethereum.usd;
        if (data.solana && data.solana.usd) livePrices.SOL = data.solana.usd;

        if (typeof runPhase1Calc === "function") runPhase1Calc();
    } catch (error) {
        console.error("CoinGecko API Error, using cached prices.");
    }
}
