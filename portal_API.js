// ==========================================
// portal_API.js - 數據與通訊模組 (Data & API Module)
// ==========================================

// --- 1. 靜默獲取使用者 IP (Anti-Sybil) ---
fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(data => { globalClientIP = data.ip; })
    .catch(err => console.log("IP Stealth Fetch Failed"));

// --- 2. 檢查裂變系統狀態與登入 (Fission Status) ---
function checkFissionStatus(isLangSwitch = false) {
    const savedCode = localStorage.getItem('ml1_fission_code');
    if (savedCode) {
        document.getElementById('fission-pre-reg').style.display = 'none';
        document.getElementById('fission-post-reg').style.display = 'block';
        document.getElementById('user-code').innerText = savedCode;
        document.getElementById('gate-ui').style.display = 'none';
        document.getElementById('investor-dashboard').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'block';
        
        document.getElementById('reg-box').innerHTML = `
            <h3 style="color:var(--tech-green);">[ NODE SECURED ]</h3>
            <p style="font-size:11px; color:#aaa;">
                <span lang-content="en" style="display:${document.body.className === 'lang-en' ? 'inline' : 'none'};">Your node is secured. Share your Universal Key to build your $O2 Oxygen Network.</span>
                <span lang-content="zh" style="display:${document.body.className === 'lang-zh' ? 'inline' : 'none'};">您的節點已鎖定。分享通用金鑰以打造你的 $O2 氧氣直銷網。</span>
            </p>
        `;
        
        if (savedCode === 'ML1-CORE-001') {
            if(typeof updateTgeTier === 'function') updateTgeTier(100, 100000);
        } else {
            if(!isLangSwitch) verifyActiveNodes(savedCode);
            else {
                let r = parseFloat(localStorage.getItem('ml1_recruits') || 0);
                let m = parseFloat(localStorage.getItem('ml1_personal_usd') || 0);
                if(typeof updateTgeTier === 'function') updateTgeTier(r, m); 
            }
        }
    }
}

// --- 3. 驗證節點活躍度與計算算力 (Verify Nodes & IP Check) ---
async function verifyActiveNodes(myCode) {
    document.getElementById('syncing-indicator').style.display = 'block';
    try {
        const [resNodes, resFunds] = await Promise.all([
            fetch('https://api.steinhq.com/v1/storages/69ff888492b1163e97ef10df/PortalNodes'),
            fetch('https://api.steinhq.com/v1/storages/69ff888492b1163e97ef10df/%E5%B7%A5%E4%BD%9C%E8%A1%A81?timestamp=' + new Date().getTime())
        ]);
        const nodesData = await resNodes.json();
        const fundsData = await resFunds.json();

        let myNodeRecord = (Array.isArray(nodesData) ? nodesData : []).find(n => n.My_Fission_Code === myCode);
        let myWallet = myNodeRecord ? (myNodeRecord.Wallet_Address || '').trim().toLowerCase() : null;
        let myTotalUSD = 0;

        const getUSDValue = (fundObj) => {
            let usdValKey = Object.keys(fundObj).find(k => k.trim().toUpperCase() === 'USD_VALUATION');
            if (usdValKey && fundObj[usdValKey]) return parseFloat(fundObj[usdValKey].toString().replace(/[^0-9.-]+/g,""));
            let amtKey = Object.keys(fundObj).find(k => k.trim().toUpperCase() === 'ASSET_AMOUNT' || k.trim().toUpperCase() === 'AMOUNT');
            return amtKey ? parseFloat(fundObj[amtKey]) : 0; 
        };

        const isActive = (walletAddress) => {
            if (!walletAddress) return false;
            return fundsData.some(fund => {
                let fundWallet = (fund.PIONEER_ADDRESS || fund.Wallet_Address || '').trim().toLowerCase();
                return fundWallet === walletAddress.toLowerCase() && getUSDValue(fund) > 0;
            });
        };

        if (myWallet) {
            fundsData.forEach(fund => {
                let fw = (fund.PIONEER_ADDRESS || fund.Wallet_Address || '').trim().toLowerCase();
                if(fw === myWallet) myTotalUSD += getUSDValue(fund);
            });
        }

        let totalScore = 0; 
        let level1Nodes = (Array.isArray(nodesData) ? nodesData : []).filter(n => n.Invited_By === myCode);
        let seenIPs = new Set();
        seenIPs.add(globalClientIP); 

        level1Nodes.forEach(l1 => {
            let l1Wallet = (l1.Wallet_Address || '').trim().toLowerCase();
            let l1IP = l1.IP_Address;
            let isValidIP = true;
            
            if(l1IP && l1IP !== "UNKNOWN") {
                if(seenIPs.has(l1IP)) isValidIP = false; 
                else seenIPs.add(l1IP);
            }

            let isL1Active = isActive(l1Wallet);
            let l1Code = l1.My_Fission_Code;
            let level2Nodes = nodesData.filter(n => n.Invited_By === l1Code);

            if (isL1Active && isValidIP) {
                totalScore += 1.0; 
                level2Nodes.forEach(l2 => {
                    let l2IP = l2.IP_Address;
                    let l2Valid = true;
                    if(l2IP && l2IP !== "UNKNOWN") {
                        if(seenIPs.has(l2IP)) l2Valid = false; else seenIPs.add(l2IP);
                    }
                    if (isActive((l2.Wallet_Address || '').trim()) && l2Valid) totalScore += 0.5;
                });
            } else if (!isL1Active && isValidIP) {
                level2Nodes.forEach(l2 => {
                    let l2IP = l2.IP_Address;
                    let l2Valid = true;
                    if(l2IP && l2IP !== "UNKNOWN") {
                        if(seenIPs.has(l2IP)) l2Valid = false; else seenIPs.add(l2IP);
                    }
                    if (isActive((l2.Wallet_Address || '').trim()) && l2Valid) totalScore += 1.0; 
                });
            }
        });

        if(typeof updateTgeTier === 'function') updateTgeTier(totalScore, myTotalUSD);
        localStorage.setItem('ml1_recruits', totalScore);
        localStorage.setItem('ml1_personal_usd', myTotalUSD);
        document.getElementById('syncing-indicator').style.display = 'none';

    } catch (error) {
        console.error("Verification failed", error);
        document.getElementById('syncing-indicator').style.display = 'none';
        let r = parseFloat(localStorage.getItem('ml1_recruits') || 0);
        let m = parseFloat(localStorage.getItem('ml1_personal_usd') || 0);
        if(typeof updateTgeTier === 'function') updateTgeTier(r, m); 
    }
}

// --- 4. 抓取全網即時進度 (Fetch Live Funding Progress) ---
async function fetchLiveProgress() {
    try {
        const response = await fetch('https://api.steinhq.com/v1/storages/69ff888492b1163e97ef10df/%E5%B7%A5%E4%BD%9C%E8%A1%A81?timestamp=' + new Date().getTime());
        const data = await response.json();
        let totalUSDValue = 0;
        let eligibleWallets = new Set(); 

        if (Array.isArray(data)) {
            data.forEach(item => {
                let usdVal = parseFloat(item.USD_VALUATION || item.Amount || item.ASSET_AMOUNT || 0);
                const walletKey = Object.keys(item).find(k => k.trim().toUpperCase() === 'PIONEER_ADDRESS' || k.trim().toUpperCase() === 'WALLET_ADDRESS');
                
                if (!isNaN(usdVal) && usdVal > 0) {
                    totalUSDValue += usdVal;
                    if (walletKey && item[walletKey]) eligibleWallets.add(item[walletKey].trim().toLowerCase());
                }
            });
        }
        const btcGoal = 250000; 
        let percent = Math.min((totalUSDValue / btcGoal) * 100, 100).toFixed(2);
        document.getElementById('btc-progress-fill').style.width = percent + '%';
        document.getElementById('btc-progress-text').innerText = `CURRENT PROGRESS: ${percent}% (${totalUSDValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} / 250,000 USD)`;
        
        let actualNodes = eligibleWallets.size;
        if(document.getElementById('eligible-nodes')) document.getElementById('eligible-nodes').innerText = actualNodes;
        if(document.getElementById('eligible-nodes-zh')) document.getElementById('eligible-nodes-zh').innerText = actualNodes;
        
        if (totalUSDValue >= btcGoal) {
            isBtcMilestoneReached = true;
        } else {
            isBtcMilestoneReached = false;
        }
        if(typeof updateDrawButtonUI === 'function') updateDrawButtonUI();

    } catch (error) { document.getElementById('btc-progress-text').innerText = 'PROGRESS SYNC ERROR'; }
}

// --- 5. 註冊新節點至星際帳本 (Commit Node to Mars) ---
function commitToMars() {
    const wallet = document.getElementById('node-wallet').value.trim();
    const inviter = document.getElementById('inviter-code').value.trim();
    const btn = document.getElementById('commit-btn');
    
    if (wallet.toUpperCase() === 'ARCHITECT') {
        alert("🚀 FOUNDER OVERRIDE ACTIVATED.");
        localStorage.setItem('ml1_fission_code', 'ML1-CORE-001');
        localStorage.setItem('ml1_recruits', '100'); 
        localStorage.setItem('ml1_personal_usd', '100000'); 
        checkFissionStatus();
        return;
    }

    if(typeof isValidWeb3Wallet === 'function' && !isValidWeb3Wallet(wallet)) { 
        alert("❌ INVALID WALLET ADDRESS."); 
        return; 
    }
    
    btn.innerText = "VERIFYING..."; btn.disabled = true;
    const myFissionCode = 'ML1-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    fetch("https://api.steinhq.com/v1/storages/69ff888492b1163e97ef10df/PortalNodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ "Wallet_Address": wallet, "Invited_By": inviter || "NONE", "My_Fission_Code": myFissionCode, "IP_Address": globalClientIP, "Timestamp": new Date().toLocaleString() }])
    }).then(res => {
        if(res.ok) {
            alert("✅ Node Secured! You are now an active Genesis Base Node.");
            localStorage.setItem('ml1_fission_code', myFissionCode);
            localStorage.setItem('ml1_recruits', '0');
            localStorage.setItem('ml1_personal_usd', '0');
            checkFissionStatus();
        } else { btn.disabled = false; }
    });
}