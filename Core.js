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

// ==========================================
// --- Web3 錢包連接與自動恢復模組 (終極完美版) ---
// ==========================================

// 1. 靜默檢查並自動恢復連線 (跨頁面保持登入，大戶免再撳)
async function autoConnectWallet(inputId, buttonId) {
    if (typeof window.ethereum !== 'undefined') {
        try {
            let provider = window.ethereum;
            if (window.ethereum.providers) {
                provider = window.ethereum.providers.find(p => p.isMetaMask) || provider;
            }
            
            // eth_accounts 不會彈出授權視窗，只會靜默讀取「已授權」的帳號
            const accounts = await provider.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                const userAddress = accounts[0];
                const inputField = document.getElementById(inputId);
                const btn = document.getElementById(buttonId);
                
                if (inputField && btn) {
                    // 自動填寫並鎖死防呆
                    inputField.value = userAddress;
                    inputField.readOnly = true;
                    inputField.style.opacity = '0.7';
                    inputField.style.cursor = 'not-allowed';
                    
                    // 按鈕直接變綠色成功狀態
                    const shortAddr = userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
                    btn.innerText = `✅ ${shortAddr}`;
                    btn.style.background = 'rgba(0, 255, 65, 0.2)';
                    btn.style.border = '1px solid #00ff41';
                }
            }
        } catch (error) {
            console.log("Silent auto-connect failed:", error);
        }
    }
}

// 2. 點擊按鈕主動連線 (防劫持 + 跨平台提示)
async function connectWallet(inputId, buttonId) {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const btn = document.getElementById(buttonId);
            const isZh = document.body.classList.contains('lang-zh');
            btn.innerText = isZh ? "請求授權中..." : "CONNECTING...";
            
            // 強制找出正牌的 MetaMask，無視其他錢包劫持
            let provider = window.ethereum;
            if (window.ethereum.providers) {
                provider = window.ethereum.providers.find(p => p.isMetaMask) || provider;
            }
            
            // 彈出 MetaMask 要求授權
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            const userAddress = accounts[0];
            
            // 授權成功：自動填入對應的 input 欄位
            const inputField = document.getElementById(inputId);
            inputField.value = userAddress;
            
            // 🔒 終極防呆：鎖死輸入框，變成半透明，不允許手動修改！
            inputField.readOnly = true;
            inputField.style.opacity = '0.7'; 
            inputField.style.cursor = 'not-allowed';
            
            // 更新按鈕狀態
            const shortAddr = userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
            btn.innerText = `✅ ${shortAddr}`;
            btn.style.background = 'rgba(0, 255, 65, 0.2)';
            btn.style.border = '1px solid #00ff41';
            
        } catch (error) {
            console.error("Wallet connection error:", error);
            const btn = document.getElementById(buttonId);
            const isZh = document.body.classList.contains('lang-zh'); // 判斷當前語言
            
            btn.innerText = isZh ? "🦊 連接 METAMASK 失敗" : "🦊 CONNECTION FAILED";

            // 精準判斷錯誤類型，給予完美的雙語提示
            if (error.code === 4001) {
                alert(isZh 
                    ? "❌ 授權失敗：您拒絕了連接請求。" 
                    : "❌ Connection Rejected: You denied the connection request.");
            } else if (error.code === -32002) {
                alert(isZh 
                    ? "⚠️ 授權請求已發送！\n請點擊瀏覽器右上角的「MetaMask 狐狸圖標」解鎖並確認連接。" 
                    : "⚠️ Request already sent!\nPlease click the MetaMask fox icon in your browser extension to unlock and confirm.");
            } else {
                alert(isZh 
                    ? "❌ 發生未知錯誤: " + error.message + "\n\n💡 排除故障指南：\n💻 【電腦用戶】請關閉其他錢包擴充功能 (如 Trust/OKX)，只保留 MetaMask！\n📱 【手機用戶】請在錢包 App 內的「發現 / DApp 瀏覽器」中開啟本網站！" 
                    : "❌ Unknown Error: " + error.message + "\n\n💡 Troubleshooting Guide:\n💻 [Desktop] Disable other wallet extensions (e.g., Trust/OKX) and keep ONLY MetaMask active!\n📱 [Mobile] Open this website INSIDE your Wallet App's built-in DApp Browser!");
            }
        }
    } else {
        // 系統完全找不到錢包 (例如普通手機 Safari)
        const isZh = document.body.classList.contains('lang-zh'); // 判斷當前語言
        alert(isZh 
            ? "⚠️ 系統偵測不到 Web3 錢包！\n\n💻 【電腦用戶】請先安裝 MetaMask 擴充功能。\n📱 【手機用戶】請複製本站網址，到 MetaMask / Trust Wallet 內建的瀏覽器中開啟！" 
            : "⚠️ No Web3 Wallet Detected!\n\n💻 [Desktop] Please install the MetaMask extension.\n📱 [Mobile] Please copy this URL and open it INSIDE your MetaMask or Trust Wallet app's built-in browser!");
    }

// 3. 頁面載入時自動執行靜默檢查
window.addEventListener('load', () => {
    setTimeout(() => {
        if (document.getElementById('btn-connect-index')) {
            autoConnectWallet('reg-wallet', 'btn-connect-index');
        }
        if (document.getElementById('btn-connect-portal')) {
            autoConnectWallet('node-wallet', 'btn-connect-portal');
        }
    }, 300);
});
