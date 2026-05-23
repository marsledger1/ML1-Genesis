// ==========================================
// API.js - 數據通訊模組 (Data & API Module)
// ==========================================

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
                let amount = 0;
                let wallet = '';
                for (let key in item) {
                    if (key.toUpperCase().includes('USD') || key.toUpperCase().includes('AMOUNT')) {
                        let val = parseFloat(item[key]);
                        if (!isNaN(val)) amount = val;
                    }
                    if (key.toUpperCase().includes('ADDRESS') || key.toUpperCase().includes('WALLET')) {
                        wallet = item[key];
                    }
                }
                if (amount > 0) {
                    totalUSD += amount;
                    if (wallet) eligibleWallets.add(wallet.trim().toLowerCase());
                }
            });
        }
        
        let percent = Math.min((totalUSD / GOAL) * 100, 100).toFixed(1);
        document.getElementById('sync-bar').style.width = percent + '%';
        document.getElementById('sync-percent').innerText = percent + '%';
        
        let actualNodes = eligibleWallets.size;
        document.getElementById('sync-progress-text').innerText = `CURRENT PROGRESS: (${totalUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} / 1,000,000 USD)`;
        if(document.getElementById('sync-nodes')) document.getElementById('sync-nodes').innerText = actualNodes;
        if(document.getElementById('sync-nodes-zh')) document.getElementById('sync-nodes-zh').innerText = actualNodes;

    } catch (e) { console.error('Telemetry Interrupted:', e); }
}

// --- 2. 提交節點入金資料至資料庫 (Commit to Ledger) ---
async function submitToLedger() {
    const btn = document.getElementById('t-btn');
    const network = document.getElementById('reg-network').value;
    const amount = document.getElementById('reg-amount').value;
    const wallet = document.getElementById('reg-wallet').value.trim();
    const hash = document.getElementById('reg-hash').value.trim();
    
    if(!amount || !hash || !wallet) { 
        alert("DATA INCOMPLETE / 數據不完整，請填寫錢包與 TXID"); 
        return; 
    }
    
    const originalBtnText = btn.innerText;
    btn.innerText = "SYNCHRONIZING...";
    btn.disabled = true;
    
    const payload = [{
        "TIMESTAMP (UTC)": new Date().toISOString(), 
        "NETWORK": network, 
        "ASSET_AMOUNT": amount, 
        "PIONEER_ADDRESS": wallet,
        "TXID": hash,
        "VALIDATION_STATUS": "PENDING"
    }];
    try {
        const response = await fetch(API_URL, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(payload) 
        });
        if(response.ok) { 
            alert("SUCCESS: DATA COMMITTED / 提交成功！裂變系統將自動核對您的地址。"); 
            document.getElementById('reg-amount').value = '';
            document.getElementById('reg-wallet').value = '';
            document.getElementById('reg-hash').value = '';
            updateProgress(); 
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

        // 這裡會自動去更新 Core.js 裡面的 livePrices 變數
        if (data.bitcoin && data.bitcoin.usd) livePrices.BTC = data.bitcoin.usd;
        if (data.ethereum && data.ethereum.usd) livePrices.ETH = data.ethereum.usd;
        if (data.solana && data.solana.usd) livePrices.SOL = data.solana.usd;
        
    } catch(e) { 
        console.log('❌ API 連線失敗，啟用本地緩存價格', e); 
    } finally {
        if (typeof runPhase1Calc === "function") {
            runPhase1Calc(); 
        }
    }
}