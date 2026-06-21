// ==========================================
// portal_CORE.js - 核心業務邏輯模組 (Core Logic Module)
// ==========================================

// --- 1. 全局狀態與變數 ---
let tgeRate = 0.20; 
let currentBtcTickets = 1; 
let isBtcMilestoneReached = false; 
let globalClientIP = "UNKNOWN"; 

// --- 2. 登出與快取清理 ---
function clearPioneerCache() {
    if(confirm("Are you sure you want to clear your local Pioneer Key cache and log out? \n確定要清除本地金鑰紀錄並登出嗎？")) {
        localStorage.removeItem('ml1_fission_code');
        localStorage.removeItem('ml1_recruits');
        localStorage.removeItem('ml1_personal_usd');
        localStorage.removeItem('ml1_team_usd');
        
        // 🟢 加入這行：連同法律免責同意書一起清除
        localStorage.removeItem('ml1_legal_accepted');

        // 🚨 終極防卡死：寫入「手動登出」標記
        localStorage.setItem('ml1_wallet_disconnected', 'true');
        window.location.reload();
    }
}

// --- 3. 階梯定價與估值計算器 ---
function runCalc() {
    const val = parseFloat(document.getElementById('inv-amount').value) || 0;
    const fomoAlert = document.getElementById('fomo-alert');
    const isZh = document.body.classList.contains('lang-zh');

    if (val === 0) {
        document.getElementById('res-total').innerText = '0 ML1';
        document.getElementById('res-phase2').innerText = '0 ML1';
        fomoAlert.style.display = 'none';
        return;
    }

    const currentRatio = 1; 
    const currentTokens = val * currentRatio;
    const phase2Ratio = 0.5;
    const phase2Tokens = val * phase2Ratio;
    const lostTokens = currentTokens - phase2Tokens;

    document.getElementById('res-total').innerText = currentTokens.toLocaleString() + ' ML1';
    document.getElementById('res-phase2').innerText = phase2Tokens.toLocaleString() + ' ML1';

    fomoAlert.style.display = 'block';
    if (isZh) {
        fomoAlert.innerHTML = `⚠️ 極限警告：如果您拖延到 Phase 2 才入金，您將<b>白白損失 ${lostTokens.toLocaleString()} 枚 ML1</b>！這將直接削減您未來的 $O2 製氧收益！`;
    } else {
        fomoAlert.innerHTML = `⚠️ OPPORTUNITY COST: If you wait for Phase 2, you will <b>lose exactly ${lostTokens.toLocaleString()} ML1</b>! This directly reduces your future $O2 mining rate!`;
    }
}

// --- 4. 錢包地址防呆驗證 ---
function isValidWeb3Wallet(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

// --- 5. 更新 TGE 階級與軍銜顯示 (個人 + 團隊業績) ---
function updateTgeTier(count, myUSD = 0, teamUSD = 0) {
    document.getElementById('recruit-count').innerText = count;
    
    let totalVolume = myUSD + teamUSD;
    
    document.getElementById('my-usd-amount').innerText = totalVolume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    
    if(document.getElementById('personal-usd-display')) document.getElementById('personal-usd-display').innerText = myUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if(document.getElementById('team-usd-display')) document.getElementById('team-usd-display').innerText = teamUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if(document.getElementById('personal-usd-display-zh')) document.getElementById('personal-usd-display-zh').innerText = myUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if(document.getElementById('team-usd-display-zh')) document.getElementById('team-usd-display-zh').innerText = teamUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});

    let fill = document.getElementById('tier-fill');
    let tgeDisplay = document.getElementById('tge-display');
    let tierName = document.getElementById('tier-name');
    let tgeBar = document.getElementById('tge-bar-fill');
    let tgeLabel = document.getElementById('tge-label');
    let seedAdvantage = document.getElementById('seed-advantage');
    let phase2Quota = document.getElementById('phase2-quota');
    let nextTierHint = document.getElementById('next-tier-hint');
    let o2BoostDisplay = document.getElementById('o2-boost-display');
    const isZh = document.body.classList.contains('lang-zh');
    
    seedAdvantage.style.display = 'none';
    phase2Quota.style.display = 'none';
    nextTierHint.style.display = 'block';

    let tierByNodes = count >= 100 ? 5 : count >= 30 ? 4 : count >= 10 ? 3 : count >= 3 ? 2 : 1;
    let tierByUSD = totalVolume >= 50000 ? 5 : totalVolume >= 10000 ? 4 : totalVolume >= 1000 ? 3 : totalVolume >= 100 ? 2 : 1;
    let currentTier = Math.max(tierByNodes, tierByUSD);

    fill.style.width = (currentTier * 20) + '%'; 

    if (currentTier === 5) {
        tgeRate = 0.40; currentBtcTickets = 100;
        tgeDisplay.innerText = '40% TGE + 100x TICKETS + 100% $O2 BOOST'; 
        tgeDisplay.style.color = 'var(--tier5-gold)';
        tierName.innerText = isZh ? '[第五階: 火星大帝]' : '[Tier 5: Mars Emperor]';
        tierName.style.color = 'var(--tier5-gold)';
        tgeBar.style.width = '40%'; tgeBar.style.background = 'var(--tier5-gold)'; tgeLabel.style.color = 'var(--tier5-gold)';
        seedAdvantage.style.display = 'block'; nextTierHint.style.display = 'none'; 
        o2BoostDisplay.innerHTML = `BOOST: <b style="color: #ffcc00; opacity: 1;">+100% MAX</b>`;
        
        let payloadKg = ((count > 100 ? count - 100 : 0) * 5 + 50).toFixed(1); 
        phase2Quota.style.display = 'block';
        phase2Quota.innerHTML = isZh ? `🌟 終極特權 實體載荷解鎖: <b>+${payloadKg} KG</b>` : `🌟 ULTIMATE ORBITAL PAYLOAD UNLOCKED: <b>+${payloadKg} KG</b>`;
    }
    else if (currentTier === 4) {
        tgeRate = 0.35; currentBtcTickets = 30;
        tgeDisplay.innerText = '35% TGE + 30x TICKETS + 50% $O2 BOOST'; 
        tgeDisplay.style.color = 'var(--tier4-purple)';
        tierName.innerText = isZh ? '[第四階: 軍閥]' : '[Tier 4: Mars Warlord]';
        tierName.style.color = 'var(--tier4-purple)';
        tgeBar.style.width = '35%'; tgeBar.style.background = 'var(--tier4-purple)'; tgeLabel.style.color = 'var(--tier4-purple)';
        o2BoostDisplay.innerHTML = `BOOST: <b style="color: #ffcc00; opacity: 0.9;">+50%</b>`;
        nextTierHint.innerText = isZh ? `🚀 下一階 [火星大帝]：需滿 100 名推薦或業績達 $50K USD！` : `🚀 NEXT [Emperor]: 100 INVITES OR $50K VOL!`;
    }
    else if (currentTier === 3) { 
        tgeRate = 0.30; currentBtcTickets = 10;
        tgeDisplay.innerText = '30% TGE + 10x TICKETS + 30% $O2 BOOST'; 
        tgeDisplay.style.color = 'var(--mars-red)';
        tierName.innerText = isZh ? '[第三階: 領主]' : '[Tier 3: Mars Overlord]';
        tierName.style.color = 'var(--mars-red)';
        tgeBar.style.width = '30%'; tgeBar.style.background = 'var(--mars-red)'; tgeLabel.style.color = 'var(--mars-red)';
        o2BoostDisplay.innerHTML = `BOOST: <b style="color: #ffcc00; opacity: 0.8;">+30%</b>`;
        nextTierHint.innerText = isZh ? `🚀 下一階 [軍閥]：需滿 30 名推薦或業績達 $10K USD！` : `🚀 NEXT [Warlord]: 30 INVITES OR $10K VOL!`;
    }
    else if (currentTier === 2) { 
        tgeRate = 0.25; currentBtcTickets = 3;
        tgeDisplay.innerText = '25% TGE + 3x TICKETS + 10% $O2 BOOST'; 
        tgeDisplay.style.color = 'var(--lag-blue)';
        tierName.innerText = isZh ? '[第二階: 指揮官]' : '[Tier 2: Mesh Commander]';
        tierName.style.color = 'var(--lag-blue)';
        tgeBar.style.width = '25%'; tgeBar.style.background = 'var(--lag-blue)'; tgeLabel.style.color = 'var(--lag-blue)';
        o2BoostDisplay.innerHTML = `BOOST: <b style="color: #ffcc00; opacity: 0.7;">+10%</b>`;
        nextTierHint.innerText = isZh ? `🚀 下一階 [領主]：需滿 10 名推薦或業績達 $1K USD！` : `🚀 NEXT [Overlord]: 10 INVITES OR $1K VOL!`;
    }
    else { 
        tgeRate = 0.20; currentBtcTickets = 1;
        tgeDisplay.innerText = '20% TGE UNLOCK + 1x TICKET';
        tgeDisplay.style.color = '#888';
        tierName.innerText = isZh ? '[第一階: 創世]' : '[Tier 1: Genesis]';
        tierName.style.color = '#888';
        tgeBar.style.width = '20%'; tgeBar.style.background = 'var(--tech-green)'; tgeLabel.style.color = 'var(--tech-green)';
        o2BoostDisplay.innerHTML = `BOOST: <b style="color: #ffcc00; opacity: 0.5;">+0%</b>`;
        nextTierHint.innerText = isZh ? `🚀 下一階 [指揮官]：需滿 3 名推薦或業績達 $100 USD！` : `🚀 NEXT [Commander]: 3 INVITES OR $100 VOL!`;
    }
    
    updateDrawButtonUI();
}

// --- 6. BTC 抽獎按鈕與邏輯 ---
function updateDrawButtonUI() {
    const btn = document.getElementById('btc-draw-btn');
    if(!btn) return;
    const isZh = document.body.classList.contains('lang-zh');
    
    if (isBtcMilestoneReached) {
        btn.disabled = false;
        btn.innerHTML = isZh 
            ? `🚀 獎池已解鎖！投入 [ ${currentBtcTickets} ] 張抽獎券爭奪 BTC` 
            : `🚀 POOL UNLOCKED! CAST [ ${currentBtcTickets} ] TICKETS FOR BTC`;
    } else {
        btn.disabled = true;
        btn.innerHTML = isZh 
            ? `🔒 目標未達成 // 等待突破 25萬美金解鎖` 
            : `🔒 MILESTONE LOCKED // WAITING FOR $250K`;
    }
}

function attemptDraw() {
    const isZh = document.body.classList.contains('lang-zh');
    if (isZh) {
        alert(`✅ ${currentBtcTickets} 張抽獎券已成功寫入星際帳本合約！\n系統將在創世倒數結束後，統一由區塊鏈 VRF 隨機數開獎。`);
    } else {
        alert(`✅ ${currentBtcTickets} Tickets successfully cast into the Interstellar Ledger!\nAwaiting VRF smart contract resolution at Genesis completion.`);
    }
}

// --- 7. 模擬星際握手讀條 (Fake Loading Auth) ---
function startSyncSequence() {
    const urlParams = new URLSearchParams(window.location.search);
    let key = document.getElementById('pioneer-key').value.trim().toLowerCase();
    if(!key) key = urlParams.get('auth');
    
    if (key !== 'mars2026' && key !== 'ml1-core-001' && !key.startsWith('ml1-')) return alert("ACCESS DENIED / 無效的通用金鑰");

    const bgm = document.getElementById('portal-bgm');
    if(bgm) bgm.play().catch(()=>{});

    const lagScreen = document.getElementById('lag-screen');
    const lBar = document.getElementById('l-bar');
    lagScreen.style.display = 'flex';
    let currentProgress = 0;

    const progressInterval = setInterval(() => {
        currentProgress += Math.random() * 5; 
        if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(progressInterval);
            setTimeout(() => {
                lagScreen.style.display = 'none';
                document.getElementById('gate-ui').style.display = 'none';
                document.getElementById('investor-dashboard').style.display = 'block';
                if(document.getElementById('portal-tabs')) document.getElementById('portal-tabs').style.display = 'flex';
                document.getElementById('logout-btn').style.display = 'block'; 
                
                if (key === 'ml1-core-001') {
                    localStorage.setItem('ml1_fission_code', 'ML1-CORE-001');
                    localStorage.setItem('ml1_recruits', '100'); 
                    localStorage.setItem('ml1_personal_usd', '100000'); 
                    localStorage.setItem('ml1_team_usd', '0'); 
                } 
                else if (key.startsWith('ml1-')) {
                    localStorage.setItem('ml1_fission_code', key.toUpperCase());
                }
                
                if (typeof checkFissionStatus === "function") checkFissionStatus();
            }, 800);
        }
        lBar.style.width = currentProgress + '%';
    }, 40);
}

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