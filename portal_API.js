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
        if(document.getElementById('portal-tabs')) document.getElementById('portal-tabs').style.display = 'flex';
        document.getElementById('logout-btn').style.display = 'block';
        
        document.getElementById('reg-box').innerHTML = `
            <h3 style="color:var(--tech-green);">[ NODE SECURED ]</h3>
            <p style="font-size:11px; color:#aaa;">
                <span lang-content="en" style="display:${document.body.className.includes('lang-en') ? 'inline' : 'none'};">Your node is secured. Share your Universal Key to build your $O2 Oxygen Network.</span>
                <span lang-content="zh" style="display:${document.body.className.includes('lang-zh') ? 'inline' : 'none'};">您的節點已鎖定。分享通用金鑰以打造你的 $O2 氧氣直銷網。</span>
            </p>
        `;
        
        if (savedCode === 'ML1-CORE-001') {
            if(typeof updateTgeTier === 'function') updateTgeTier(100, 100000, 0);
            if(!isLangSwitch) verifyActiveNodes('ML1-CORE-001');
        } else {
            if(!isLangSwitch) verifyActiveNodes(savedCode);
            else {
                let r = parseFloat(localStorage.getItem('ml1_recruits') || 0);
                let m = parseFloat(localStorage.getItem('ml1_personal_usd') || 0);
                let t = parseFloat(localStorage.getItem('ml1_team_usd') || 0);
                if(typeof updateTgeTier === 'function') updateTgeTier(r, m, t); 
            }
        }
    } else {
        // 訪客金鑰進入，強制觸發 API 抓取全網數據來渲染排行榜
        if(!isLangSwitch) verifyActiveNodes('GUEST_MODE');
    }
}

// --- 3. 全局數據映射與算力計算 (防彈級 Leaderboard) ---
async function verifyActiveNodes(myCode) {
    const syncInd = document.getElementById('syncing-indicator');
    if (syncInd) syncInd.style.display = 'block';
    
    try {
        const [resNodes, resFunds] = await Promise.all([
            fetch('https://api.steinhq.com/v1/storages/69ff888492b1163e97ef10df/PortalNodes'),
            fetch('https://api.steinhq.com/v1/storages/69ff888492b1163e97ef10df/%E5%B7%A5%E4%BD%9C%E8%A1%A81?timestamp=' + new Date().getTime())
        ]);
        
        const nodesData = await resNodes.json();
        const fundsData = await resFunds.json();

        let walletToUSD = {};
        
        // 🛡️ 防彈處理：確保 fundsData 是陣列才執行
        if (Array.isArray(fundsData)) {
            fundsData.forEach(f => {
                if (!f) return; // 略過空物件
                
                let usdValue = 0;
                let w = '';
                let status = '';

                for (let key in f) {
                    const upperKey = key.toUpperCase();
                    if (upperKey.includes('USD_VALUATION')) {
                        let val = parseFloat(f[key]);
                        if (!isNaN(val)) usdValue = val;
                    }
                    if (upperKey.includes('ADDRESS') || upperKey.includes('WALLET')) {
                        w = f[key] ? f[key].toString().trim().toLowerCase() : '';
                    }
                    if (upperKey.includes('STATUS')) {
                        status = (f[key] || '').toUpperCase();
                    }
                }
                
                // 只有 APPROVED 才計入有效業績
                if (usdValue > 0 && status.includes('APPROVED') && w) {
                    walletToUSD[w] = (walletToUSD[w] || 0) + usdValue;
                }
            });
        }

        let nodeStats = {};
        let validNodes = Array.isArray(nodesData) ? nodesData : [];
        
        // 映射 PortalNodes 的上下線關係 (防當機版)
        validNodes.forEach(n => {
            if (!n) return; // 🛡️ 略過 Google Sheet 裡的空行，防止當機！

            let codeKey = Object.keys(n).find(k => k.toUpperCase().includes('FISSION_CODE'));
            let code = codeKey ? n[codeKey] : n.My_Fission_Code;
            if (!code) return; // 如果沒有金鑰，略過此行
            code = String(code).trim(); 

            let wKey = Object.keys(n).find(k => k.toUpperCase().includes('ADDRESS') || k.toUpperCase().includes('WALLET'));
            let w = wKey && n[wKey] ? String(n[wKey]).trim().toLowerCase() : '';

            let inviterKey = Object.keys(n).find(k => k.toUpperCase().includes('INVIT'));
            let inviter = inviterKey ? String(n[inviterKey]).trim() : (n.Invited_By || "NONE");

            let ipKey = Object.keys(n).find(k => k.toUpperCase().includes('IP'));
            let ip = ipKey && n[ipKey] ? String(n[ipKey]).trim() : (n.IP_Address || "UNKNOWN");

            nodeStats[code] = { 
                code: code, 
                wallet: w, 
                inviter: inviter, 
                pUSD: walletToUSD[w] || 0,
                tUSD: 0, 
                score: 0,
                ip: ip
            };
        });

        // 結算團隊算力與防女巫 (IP檢查)
        Object.values(nodeStats).forEach(node => {
            let l1 = Object.values(nodeStats).filter(n => n.inviter === node.code);
            let seenIPs = new Set();
            if(node.ip !== "UNKNOWN") seenIPs.add(node.ip);

            l1.forEach(child => {
                let validL1 = true;
                if(child.ip !== "UNKNOWN") {
                    if(seenIPs.has(child.ip)) validL1 = false;
                    else seenIPs.add(child.ip);
                }
                
                if(child.pUSD > 0) node.tUSD += child.pUSD;
                
                // 🟢 戰略降級：測試階段，只要有註冊就給直推算力，不強制要求 pUSD > 0！
                if(validL1) node.score += 1; 

                let l2 = Object.values(nodeStats).filter(n => n.inviter === child.code);
                l2.forEach(gchild => {
                    let validL2 = true;
                    if(gchild.ip !== "UNKNOWN") {
                        if(seenIPs.has(gchild.ip)) validL2 = false;
                        else seenIPs.add(gchild.ip);
                    }
                    if(gchild.pUSD > 0) node.tUSD += gchild.pUSD; 
                    if(validL2) node.score += 0.5; // 第二代也有分數
                });
            });
        });

        let myData = nodeStats[myCode] || { pUSD: 0, tUSD: 0, score: 0 };
        if(typeof updateTgeTier === 'function') updateTgeTier(myData.score, myData.pUSD, myData.tUSD);
        
        localStorage.setItem('ml1_recruits', myData.score);
        localStorage.setItem('ml1_personal_usd', myData.pUSD);
        localStorage.setItem('ml1_team_usd', myData.tUSD);
        
        if (syncInd) syncInd.style.display = 'none';

        // 顯示在排行榜上的條件：有業績 或 有拉到人
        let activeNodes = Object.values(nodeStats).filter(n => (n.pUSD + n.tUSD) > 0 || n.score > 0);
        activeNodes.sort((a,b) => (b.pUSD + b.tUSD) - (a.pUSD + a.tUSD));

        let lbHtml = '';
        let myRank = -1;
        
        let myActiveNode = activeNodes.find((n, idx) => {
            if(n.code === myCode) {
                myRank = idx + 1;
                return true;
            }
            return false;
        });

        activeNodes.slice(0, 10).forEach((n, idx) => {
            let currentRank = idx + 1;
            let totalVol = n.pUSD + n.tUSD;
            
            // 🛡️ 防彈字串處理，防止 n.code 為空時長度檢查當機
            let codeStr = n.code || "UNKNOWN";
            let maskCode = codeStr.length > 5 ? codeStr.substring(0, codeStr.length - 2) + "**" : codeStr;
            
            let isMe = (n.code === myCode);
            let rowStyle = isMe ? 'background: rgba(0,255,65,0.1); border-left: 3px solid var(--tech-green);' : '';
            let meTag = isMe ? ' <span style="color:var(--tech-green); font-size:9px; font-weight:bold;">[YOU]</span>' : '';
            
            lbHtml += `<tr style="${rowStyle}">
                <td>#${currentRank}</td>
                <td>${maskCode}${meTag}</td>
                <td>${n.score}</td>
                <td>$${totalVol.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
            </tr>`;
        });

        if (myRank > 10 && myActiveNode) {
            let totalVol = myActiveNode.pUSD + myActiveNode.tUSD;
            let codeStr = myActiveNode.code || "UNKNOWN";
            let maskCode = codeStr.length > 5 ? codeStr.substring(0, codeStr.length - 2) + "**" : codeStr;
            
            lbHtml += `<tr><td colspan="4" style="text-align:center; color:#555; padding: 4px; letter-spacing: 2px;">• • •</td></tr>`;
            lbHtml += `<tr style="background: rgba(0,255,65,0.1); border-left: 3px solid var(--tech-green);">
                <td style="color:var(--tech-green); font-weight:bold;">#${myRank}</td>
                <td>${maskCode} <span style="color:var(--tech-green); font-size:9px; font-weight:bold;">[YOU]</span></td>
                <td>${myActiveNode.score}</td>
                <td>$${totalVol.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
            </tr>`;
        }
        
        const lbBody = document.getElementById('lb-body');
        if(lbBody) {
            if(!lbHtml) {
                lbHtml = `<tr><td colspan="4" style="text-align:center;">
                    <span lang-content="en">NO DATA YET</span>
                    <span lang-content="zh">目前尚無節點數據</span>
                </td></tr>`;
            }
            lbBody.innerHTML = lbHtml;
            // 重新切換語言確保顯示正確
            if(typeof setLanguage === 'function') setLanguage(document.body.className.replace('lang-', ''));
        }

    } catch (error) {
        console.error("Verification failed", error);
        if (syncInd) syncInd.style.display = 'none';
        let r = parseFloat(localStorage.getItem('ml1_recruits') || 0);
        let m = parseFloat(localStorage.getItem('ml1_personal_usd') || 0);
        let t = parseFloat(localStorage.getItem('ml1_team_usd') || 0);
        if(typeof updateTgeTier === 'function') updateTgeTier(r, m, t); 
        
        const lbBody = document.getElementById('lb-body');
        if(lbBody) {
            lbBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--alert-red);">API SYNC ERROR</td></tr>`;
        }
    }
}

// --- 4. 抓取全網即時進度 (Hybrid Floating TVL for Portal) ---
async function fetchLiveProgress() {
    try {
        const syncText = document.getElementById('sync-progress-text');
        const btcText = document.getElementById('btc-progress-text');
        if (syncText) syncText.innerText = "SYNCING LIVE TVL...";
        if (btcText) btcText.innerText = "SYNCING LIVE TVL...";

        const [sheetRes, priceRes] = await Promise.all([
            fetch('https://api.steinhq.com/v1/storages/69ff888492b1163e97ef10df/工作表1').catch(() => null),
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd').catch(() => null)
        ]);

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

                for (let key in item) {
                    const upperKey = key.toUpperCase();
                    if (upperKey.includes('ASSET_AMOUNT') || upperKey === 'AMOUNT') amount = parseFloat(item[key]) || 0;
                    else if (upperKey.includes('NETWORK')) network = (item[key] || '').toUpperCase();
                    else if (upperKey.includes('USD_VALUATION')) staticUsd = parseFloat(item[key]) || 0;
                    else if (upperKey.includes('STATUS')) status = (item[key] || '').toUpperCase();
                    else if (upperKey.includes('ADDRESS') || upperKey.includes('WALLET')) wallet = item[key];
                }
                
                // 必須是 APPROVED 才計入全球進度
                if (status.includes('APPROVED')) {
                    if (wallet) eligibleWallets.add(wallet.trim().toLowerCase()); 
                    
                    if (amount > 0 && network) {
                        if (network.includes('BTC') || network.includes('BITCOIN')) totalUSD += amount * currentPrices.BTC;
                        else if (network.includes('ETH') || network.includes('BASE')) totalUSD += amount * currentPrices.ETH;
                        else if (network.includes('SOL')) totalUSD += amount * currentPrices.SOL;
                        else if (network.includes('USD')) totalUSD += amount;
                        else totalUSD += staticUsd;
                    } else if (staticUsd > 0) {
                        totalUSD += staticUsd;
                    }
                }
            });
        }

        const MAIN_GOAL = 1000000;
        let mainPercent = Math.min((totalUSD / MAIN_GOAL) * 100, 100).toFixed(2);
        
        const uiPercent = document.getElementById('sync-percent');
        const uiBar = document.getElementById('sync-bar');
        const syncNodes = document.getElementById('sync-nodes');
        const syncNodesZh = document.getElementById('sync-nodes-zh');

        if (uiPercent) uiPercent.innerText = mainPercent + '%';
        if (uiBar) uiBar.style.width = mainPercent + '%';
        if (syncText) syncText.innerText = `SYNCED: $${totalUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} / $${MAIN_GOAL.toLocaleString()}`;
        if (syncNodes) syncNodes.innerText = eligibleWallets.size;
        if (syncNodesZh) syncNodesZh.innerText = eligibleWallets.size;

        const BTC_GOAL = 250000;
        let btcPercent = Math.min((totalUSD / BTC_GOAL) * 100, 100).toFixed(2);
        
        const btcBar = document.getElementById('btc-progress-fill');
        const nodesEn = document.getElementById('eligible-nodes');
        const nodesZh = document.getElementById('eligible-nodes-zh');
        const drawBtn = document.getElementById('btc-draw-btn');
        
        if (btcText) btcText.innerText = `SYNCED: $${totalUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} / $${BTC_GOAL.toLocaleString()}`;
        if (btcBar) btcBar.style.width = btcPercent + '%';
        if (nodesEn) nodesEn.innerText = eligibleWallets.size;
        if (nodesZh) nodesZh.innerText = eligibleWallets.size;

        if (drawBtn) {
            const isZh = document.body.classList.contains('lang-zh');
            if (totalUSD >= BTC_GOAL) {
                isBtcMilestoneReached = true; 
                drawBtn.disabled = false;
                drawBtn.innerHTML = isZh ? `🚀 獎池已解鎖！投入 [ ${currentBtcTickets} ] 張抽獎券爭奪 BTC` : `🚀 POOL UNLOCKED! CAST [ ${currentBtcTickets} ] TICKETS FOR BTC`;
            } else {
                isBtcMilestoneReached = false;
                drawBtn.disabled = true;
                drawBtn.innerHTML = isZh ? `🔒 目標未達成 // 等待突破 25萬美金解鎖` : `🔒 MILESTONE LOCKED // WAITING FOR $250K`;
            }
        }

    } catch (error) {
        console.error("Portal progress fetch failed:", error);
        const syncText = document.getElementById('sync-progress-text');
        const btcText = document.getElementById('btc-progress-text');
        if (syncText) syncText.innerText = "SYNC FAILED. RETRYING...";
        if (btcText) btcText.innerText = "SYNC FAILED. RETRYING...";
    }
}

window.fetchLiveProgress = fetchLiveProgress;

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
        localStorage.setItem('ml1_team_usd', '0'); 
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
            localStorage.setItem('ml1_team_usd', '0');
            checkFissionStatus();
        } else { btn.disabled = false; }
    });
}