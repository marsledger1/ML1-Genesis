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

// --- Web3 錢包連接模組 (WalletConnect - 智能防劫持 & 防呆版) ---
async function connectWallet(inputId, buttonId) {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const btn = document.getElementById(buttonId);
            const isZh = document.body.classList.contains('lang-zh');
            btn.innerText = isZh ? "請求授權中..." : "CONNECTING...";
            
            // 🚀 核心防劫持邏輯：強制找出正牌的 MetaMask
            let provider = window.ethereum;
            if (window.ethereum.providers) {
                provider = window.ethereum.providers.find(p => p.isMetaMask) || provider;
            }
            
            // 彈出 MetaMask 要求授權
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            const userAddress = accounts[0];
            
            // 🚀 授權成功：自動填入對應的 input 欄位
            const inputField = document.getElementById(inputId);
            inputField.value = userAddress;
            
            // 🔒 終極防呆：鎖死輸入框，變成半透明，不允許手動修改！
            inputField.readOnly = true;
            inputField.style.opacity = '0.7'; 
            inputField.style.cursor = 'not-allowed';
            
            // 更新按鈕狀態為成功，並顯示縮短後的地址
            const shortAddr = userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
            btn.innerText = `✅ ${shortAddr}`;
            btn.style.background = 'rgba(0, 255, 65, 0.2)';
            btn.style.border = '1px solid #00ff41';
            
        } catch (error) {
            console.error("Wallet connection error:", error);
            const btn = document.getElementById(buttonId);
            btn.innerText = "🦊 CONNECT METAMASK / 連接錢包";

            // 精準判斷錯誤類型，並給予跨平台提示
            if (error.code === 4001) {
                alert("❌ 授權失敗：您拒絕了連接請求。 / Connection Rejected.");
            } else if (error.code === -32002) {
                alert("⚠️ 授權請求已發送！\n請點擊瀏覽器右上角的「MetaMask 狐狸圖標」解鎖並確認連接。");
            } else {
                alert("❌ 發生未知錯誤 / Error: " + error.message + "\n\n💡 排除故障指南：\n💻 【電腦用戶】請暫時去擴充功能關閉 (Disable) 其他錢包 (如 Trust/OKX/Phantom)，只保留 MetaMask！\n📱 【手機用戶】請在錢包 App 內的「發現 / DApp 瀏覽器」中開啟本網站！");
            }
        }
    } else {
        // 系統完全找不到錢包 (例如在普通手機 Safari 打開)
        alert("⚠️ 系統偵測不到 Web3 錢包！\n\n💻 【電腦用戶】請安裝 MetaMask 擴充功能。\n📱 【手機用戶】請務必在您的錢包 App (如 MetaMask/Trust) 內的「DApp 瀏覽器」中輸入本網址開啟！\n\n您也可以直接在下方手動輸入錢包地址。");
    }
}
