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
    const isZh = document.body.classList.contains('lang-zh');
    
    if (key === 'MARS2026' || key === 'ML1-CORE-001' || key.startsWith('ML1-')) {
        
        // 🚀 觸發賽博龐克載入特效
        const lagScreen = document.getElementById('lag-screen');
        const lBar = document.getElementById('l-bar');
        const lagStatus = document.getElementById('lag-status');
        
        if (lagScreen && lBar) {
            if (lagStatus) {
                lagStatus.innerText = isZh ? "VERIFYING PIONEER KEY... / 正在驗證先鋒金鑰..." : "VERIFYING PIONEER KEY...";
            }
            lagScreen.style.display = 'flex';
            let currentProgress = 0;
            
            // 模擬數據加密與傳輸的進度條
            const progressInterval = setInterval(() => {
                currentProgress += Math.random() * 8; 
                if (currentProgress >= 100) {
                    currentProgress = 100;
                    clearInterval(progressInterval);
                    
                    // 滿 100% 後，延遲 0.5 秒正式跳轉
                    setTimeout(() => {
                        window.location.href = 'portal.html?auth=' + encodeURIComponent(key.toLowerCase());
                    }, 500);
                }
                lBar.style.width = currentProgress + '%';
            }, 40);
        } else {
            // 防呆機制
            window.location.href = 'portal.html?auth=' + encodeURIComponent(key.toLowerCase());
        }
        
    } else {
        alert(isZh ? '❌ 拒絕訪問 / 無效的通用金鑰' : '❌ ACCESS DENIED / INVALID KEY');
    }
}

// --- 4. 模擬器後台數據跳動 (Telemetry Randomizer) ---
setInterval(() => {
    if(document.getElementById('sys-load')) {
        document.getElementById('sys-load').innerText = Math.floor(Math.random() * 30 + 20);
        document.getElementById('live-latency').innerText = (20 + Math.random() * 2).toFixed(2);
    }
}, 2000);

// ==========================================
// --- Web3 Solana 錢包連接模組 (終極完美版) ---
// ==========================================
function getSolanaProvider() {
    if ('phantom' in window && window.phantom.solana) return window.phantom.solana;
    if (window.solana && window.solana.isPhantom) return window.solana;
    if (window.backpack) return window.backpack;
    if (window.solflare) return window.solflare;
    return null;
}

function isValidWeb3Wallet(address) {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

async function autoConnectWallet(inputId, buttonId) {
    const provider = getSolanaProvider();
    if (provider) {
        try {
            const resp = await provider.connect({ onlyIfTrusted: true }); // 靜默連線
            const pubKey = resp.publicKey ? resp.publicKey.toString() : provider.publicKey.toString();
            
            const inputField = document.getElementById(inputId);
            const btn = document.getElementById(buttonId);
            
            if (inputField && btn) {
                inputField.value = pubKey;
                inputField.readOnly = true;
                inputField.style.opacity = '0.7';
                inputField.style.cursor = 'not-allowed';
                
                const shortAddr = pubKey.slice(0, 4) + "..." + pubKey.slice(-4);
                btn.innerText = `✅ ${shortAddr}`;
                btn.style.background = 'rgba(0, 255, 65, 0.2)';
                btn.style.border = '1px solid #00ff41';
                btn.style.color = '#00ff41';
            }
        } catch (error) {}
    }
}

async function connectWallet(inputId, buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    const isZh = document.body.classList.contains('lang-zh');
    btn.innerText = isZh ? "請求授權中..." : "VERIFYING...";
    
    const provider = getSolanaProvider();

    if (provider) {
        try {
            const resp = await provider.connect();
            const pubKey = resp.publicKey ? resp.publicKey.toString() : provider.publicKey.toString();
            
            const shortAddr = pubKey.substring(0, 4) + "..." + pubKey.substring(pubKey.length - 4);
            btn.innerText = `✅ ${shortAddr}`;
            btn.style.background = 'rgba(0, 255, 65, 0.2)';
            btn.style.border = '1px solid #00ff41';
            btn.style.color = '#00ff41';
            
            const targetInput = document.getElementById(inputId);
            if (targetInput) {
                targetInput.value = pubKey;
                targetInput.readOnly = true; 
                targetInput.style.color = "var(--tech-green)";
                targetInput.style.borderColor = "var(--tech-green)";
                targetInput.style.background = "rgba(0, 255, 65, 0.05)";
                targetInput.style.cursor = "not-allowed";
            }
        } catch (error) {
            btn.innerText = isZh ? "👻 連接錢包" : "👻 CONNECT WALLET";
            alert(isZh ? "❌ 授權失敗或取消" : "❌ Connection Rejected.");
        }
    } else {
        btn.innerText = isZh ? "👻 找不到錢包" : "👻 NO WALLET";
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            alert(isZh ? "⚠️ 請在 Phantom App 內建瀏覽器打開！" : "⚠️ Open inside Phantom App browser!");
            window.location.href = `https://phantom.app/ul/v1/browse/${encodeURIComponent(window.location.href)}`;
        } else {
            alert(isZh ? "⚠️ 找不到 Solana 錢包！請安裝 Phantom。" : "⚠️ No Solana wallet! Please install Phantom.");
            window.open("https://phantom.app/", "_blank");
        }
    }
}

// ==========================================
// 🚀 網路下拉選單防呆邏輯 (支援所有 Solana 生態代幣)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 同時相容 Index 和 Portal 裡的各種選單 ID
    const networkSelect = document.getElementById('node-network') || document.getElementById('reg-network') || document.getElementById('wallet-network');
    if (networkSelect) {
        networkSelect.addEventListener('change', (e) => {
            const mmBtn = document.getElementById('btn-connect-portal') || document.getElementById('btn-connect-index');
            const walletInput = document.getElementById('node-wallet') || document.getElementById('reg-wallet');
            const isZh = document.body.classList.contains('lang-zh');

            if (!mmBtn || !walletInput) return;
            
            // 重置輸入框狀態
            walletInput.readOnly = false;
            walletInput.value = '';
            walletInput.style.background = 'rgba(0,0,0,0.4)';
            walletInput.style.borderColor = 'rgba(255,255,255,0.3)';
            walletInput.style.color = '#fff';
            walletInput.style.cursor = 'text';
            walletInput.style.opacity = '1';

            // 只要不是 EVM 或 BTC，一律視為 Solana 生態系 (SOL, USDC, JUP等)，顯示 Phantom 按鈕！
            if (e.target.value === 'EVM' || e.target.value === 'BTC') {
                mmBtn.style.display = 'none';
                walletInput.placeholder = isZh ? `請手動貼上您的 ${e.target.value} 錢包地址` : `Please paste your ${e.target.value} address here`;
            } else {
                mmBtn.style.display = 'block';
                mmBtn.innerText = isZh ? "👻 CONNECT SOLANA / 連接錢包" : "👻 CONNECT SOLANA WALLET";
                mmBtn.style.background = 'transparent';
                mmBtn.style.borderColor = '#00ff41';
                mmBtn.style.color = '#00ff41';
                walletInput.placeholder = isZh ? "請點擊上方按鈕連接錢包" : "Click button above to connect";
                autoConnectWallet(walletInput.id, mmBtn.id);
            }
        });
    }
});

// ==========================================
// 🚀 頁面載入時自動執行靜默檢查
// ==========================================
window.addEventListener('load', () => {
    setTimeout(() => {
        const indexNetwork = document.getElementById('reg-network');
        if (document.getElementById('btn-connect-index')) {
            if (!indexNetwork || (indexNetwork.value !== 'EVM' && indexNetwork.value !== 'BTC')) {
                autoConnectWallet('reg-wallet', 'btn-connect-index');
            }
        }
        const portalNetwork = document.getElementById('node-network') || document.getElementById('wallet-network');
        if (document.getElementById('btn-connect-portal')) {
            if (!portalNetwork || (portalNetwork.value !== 'EVM' && portalNetwork.value !== 'BTC')) {
                autoConnectWallet('node-wallet', 'btn-connect-portal');
            }
        }
    }, 300);
});

// ==========================================
// 🚀 Web3 控制台按鈕預備觸發器 (聯動終端機打字特效)
// ==========================================
window.web3StakeML1 = function() {
    const amt = document.getElementById('web3-stake-amount').value;
    const isZh = document.body.classList.contains('lang-zh');
    if(!amt || amt <= 0) return alert(isZh ? "請輸入質押數量！" : "Enter amount to stake!");
    if(typeof typeWriter === 'function') {
        typeWriter(`> INITIATING CRYO-SLEEP FOR ${amt} $ML1...`, `> 正在啟動 ${amt} 顆 $ML1 冷凍休眠程序...`, "var(--tier5-gold)");
        setTimeout(() => typeWriter("> AWAITING WALLET SIGNATURE...", "> 正在等待 Solana 錢包簽名授權..."), 800);
    }
}

window.web3ClaimO2 = function() {
    if(typeof typeWriter === 'function') {
        typeWriter("> EXTRACTING ACCUMULATED $O2 FUEL...", "> 正在提取並結算累積的 $O2 燃料...", "var(--lag-blue)");
        setTimeout(() => typeWriter("> AWAITING WALLET SIGNATURE...", "> 正在等待 Solana 錢包簽名授權..."), 800);
    }
}

window.web3BurnForDust = function() {
    const amt = document.getElementById('web3-burn-amount').value;
    const isZh = document.body.classList.contains('lang-zh');
    if(!amt || amt <= 0) return alert(isZh ? "請輸入燃燒數量！" : "Enter amount to burn!");
    if(typeof typeWriter === 'function') {
        typeWriter(`> IGNITING ${amt} $O2. PREPARING ENTROPY EXTRACTION...`, `> 點燃 ${amt} 顆 $O2 引擎。準備進行熵值盲挖...`, "var(--alert-red)");
        setTimeout(() => typeWriter("> AWAITING WALLET SIGNATURE...", "> 正在等待 Solana 錢包簽名授權..."), 800);
    }
}