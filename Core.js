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