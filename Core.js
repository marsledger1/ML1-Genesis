// ==========================================
// Core.js - 核心業務邏輯模組 (Core Logic Module)
// ==========================================

// --- 1. 全局狀態與變數 ---
// 預設的幣價緩存 (當 API 斷線時的備用價格)
let livePrices = { BTC: 78226.70, ETH: 2175.83, SOL: 86.69 }; 

// --- 2. 創世計算器邏輯 (Calculator Math) ---
function runPhase1Calc() {
    const asset = document.getElementById('calc-asset');
    const amountInput = document.getElementById('calc-amount');
    
    if(!asset || !amountInput) return;

    const assetType = asset.value;
    const amount = parseFloat(amountInput.value) || 0;
    
    const usdValue = amount * livePrices[assetType];

    const totalGoal = 1000000;
    const genesisTokens = 1000000;

    // 計算進度佔比與代幣數量
    const percent = Math.min((usdValue / totalGoal) * 100, 100).toFixed(4);
    const tokens = (usdValue / totalGoal) * genesisTokens;
    const tgeTokens = tokens * 0.20; 

    document.getElementById('calc-percent').innerText = percent + '%';
    
    const isZh = document.body.classList.contains('lang-zh');
    const tgeText = isZh ? "TGE 首發解鎖 (20%)" : "TGE Release (20%)";
    
    document.getElementById('calc-tokens').innerHTML = `
        ${Math.floor(tokens).toLocaleString()}
        <div style="font-size: 0.85rem; color: #ff0; margin-top: 5px; letter-spacing: 1px;">
            ${tgeText}: ${tgeTokens.toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 2})}
        </div>
    `;
    
    const liveText = isZh ? "實時報價" : "Live";
    document.getElementById('calc-live-usd').innerText = `≈ $${usdValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD (${liveText})`;

    // 數字跳動特效
    const tokensEl = document.getElementById('calc-tokens');
    tokensEl.style.transition = 'transform 0.3s ease';
    tokensEl.style.transform = 'scale(1.12)';
    setTimeout(() => { tokensEl.style.transform = 'scale(1)'; }, 280);
}

// --- 3. 通用金鑰解鎖邏輯 (Pioneer Key Validation) ---
function unlockPioneer() {
    const key = document.getElementById('access-key').value.trim().toUpperCase();
    
    if (key === 'MARS2026' || key === 'ML1-CORE-001' || key.startsWith('ML1-')) {
        window.location.href = 'portal.html?auth=' + encodeURIComponent(key.toLowerCase());
    } else {
        alert('❌ ACCESS DENIED / 無效通用金鑰');
    }
}

// --- 4. 模擬器後台數據跳動 (Telemetry Randomizer) ---
setInterval(() => {
    if(document.getElementById('sys-load')) {
        document.getElementById('sys-load').innerText = Math.floor(Math.random() * 30 + 20);
        document.getElementById('live-latency').innerText = (20 + Math.random() * 2).toFixed(2);
    }
}, 2000);

// --- Web3 錢包連接模組 (WalletConnect) ---
async function connectWallet(inputId, buttonId) {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const btn = document.getElementById(buttonId);
            const isZh = document.body.classList.contains('lang-zh');
            btn.innerText = isZh ? "請求授權中..." : "CONNECTING...";
            
            // 彈出 MetaMask 要求授權
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const userAddress = accounts[0];
            
            // 授權成功：自動填入對應的 input 欄位
            document.getElementById(inputId).value = userAddress;
            
            // 更新按鈕狀態為成功，並顯示縮短後的地址
            const shortAddr = userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
            btn.innerText = `✅ ${shortAddr}`;
            btn.style.background = 'rgba(0, 255, 65, 0.2)';
            btn.style.border = '1px solid #00ff41';
            
        } catch (error) {
            console.error("Wallet connection error:", error);
            alert("❌ 授權失敗或已取消 / Connection Cancelled.");
            const btn = document.getElementById(buttonId);
            btn.innerText = "🦊 CONNECT METAMASK / 連接錢包";
        }
    } else {
        alert("⚠️ 系統偵測不到錢包！請安裝 MetaMask 瀏覽器擴充功能。 / Web3 wallet not found!");
    }
}