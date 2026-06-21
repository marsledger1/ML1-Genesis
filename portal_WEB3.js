// ==========================================
// portal_WEB3.js - Anchor 智能合約橋接與支付引擎 (架構師真・防彈版)
// ==========================================

const { Connection, PublicKey, SystemProgram, Transaction } = solanaWeb3;
const { Program, AnchorProvider, BN } = anchor;
const { getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction, createTransferInstruction, TOKEN_PROGRAM_ID } = splToken;

const PROGRAM_ID = new PublicKey("B6hzYR6fuxdjWmqLmqku8Yw9kmfqfJ1fxX8U88jmuPVf");
const ADMIN_PUBKEY = new PublicKey("DV5rUKjo3ufjyAVNpsQaL19GYtToo5oXJpZ6gjvjhDau");
const utf8 = new TextEncoder(); 

let anchorProgram = null;
let currentProvider = null;
let userLiveStakedMl1 = 0; 

const IDL = {
  "version": "0.1.0",
  "name": "ml1_depin",
  "instructions": [
    { "name": "initUserRecord", "accounts": [ {"name": "owner", "isMut": true, "isSigner": true}, {"name": "userRecord", "isMut": true, "isSigner": false}, {"name": "systemProgram", "isMut": false, "isSigner": false} ], "args": [] },
    { "name": "stakeMl1", "accounts": [ {"name": "owner", "isMut": true, "isSigner": true}, {"name": "userRecord", "isMut": true, "isSigner": false}, {"name": "userMl1Account", "isMut": true, "isSigner": false}, {"name": "globalMl1Vault", "isMut": true, "isSigner": false}, {"name": "tokenProgram", "isMut": false, "isSigner": false} ], "args": [ {"name": "amount", "type": "u64"} ] },
    { "name": "claimO2", "accounts": [ {"name": "owner", "isMut": true, "isSigner": true}, {"name": "userRecord", "isMut": true, "isSigner": false}, {"name": "globalState", "isMut": false, "isSigner": false}, {"name": "o2Mint", "isMut": true, "isSigner": false}, {"name": "userO2Account", "isMut": true, "isSigner": false}, {"name": "tokenProgram", "isMut": false, "isSigner": false} ], "args": [] },
    { "name": "burnO2ForDust", "accounts": [ {"name": "owner", "isMut": true, "isSigner": true}, {"name": "globalState", "isMut": true, "isSigner": false}, {"name": "o2Mint", "isMut": true, "isSigner": false}, {"name": "dustMint", "isMut": true, "isSigner": false}, {"name": "userO2Account", "isMut": true, "isSigner": false}, {"name": "userDustAccount", "isMut": true, "isSigner": false}, {"name": "adminO2Account", "isMut": true, "isSigner": false}, {"name": "tokenProgram", "isMut": false, "isSigner": false} ], "args": [ {"name": "o2Amount", "type": "u64"} ] }
  ],
  "accounts": [
    { "name": "UserRecord", "type": { "kind": "struct", "fields": [ {"name": "owner", "type": "publicKey"}, {"name": "stakedMl1", "type": "u64"}, {"name": "lastClaimTime", "type": "i64"}, {"name": "unclaimedO2", "type": "u64"}, {"name": "bump", "type": "u8"} ] } }
  ]
};

async function initWeb3Engine() {
    const solProvider = getSolanaProvider();
    if (!solProvider || !solProvider.publicKey) return false;

    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    currentProvider = new AnchorProvider(connection, solProvider, { preflightCommitment: "confirmed" });
    anchor.setProvider(currentProvider);
    anchorProgram = new Program(IDL, PROGRAM_ID, currentProvider);
    
    syncHUD();
    setInterval(syncHUD, 1000);
    return true;
}

async function syncHUD() {
    if (!anchorProgram || !currentProvider.wallet.publicKey) return;
    const walletPk = currentProvider.wallet.publicKey;

    const [userRecordPda] = PublicKey.findProgramAddressSync([utf8.encode("user_record"), walletPk.toBytes()], PROGRAM_ID);
    const [dustMint] = PublicKey.findProgramAddressSync([utf8.encode("dust_mint")], PROGRAM_ID);
    const userDustAccount = getAssociatedTokenAddressSync(dustMint, walletPk);

    try {
        const record = await anchorProgram.account.userRecord.fetch(userRecordPda);
        
        // 🛡️ 架構師防護 1：$ML1 是 0 位小數 (不可分割)，直接 toNumber() 安全且正確！
        userLiveStakedMl1 = record.stakedMl1.toNumber();
        document.getElementById('ui-ml1').innerText = userLiveStakedMl1.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        // 🛡️ 架構師防護 2：$O2 是 9 位小數。利用 toString() 防護大數崩潰！
        const nowSec = Math.floor(Date.now() / 1000);
        const timeDiff = Math.max(0, nowSec - record.lastClaimTime.toNumber());
        const rawO2 = Number(record.unclaimedO2.toString()) / 1e9; 
        const livePendingO2 = timeDiff * userLiveStakedMl1; // 1 ML1 = 1 O2/sec
        
        document.getElementById('ui-o2').innerText = (rawO2 + livePendingO2).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    } catch(e) {
        document.getElementById('ui-ml1').innerText = "0.00";
        document.getElementById('ui-o2').innerText = "0.00";
    }

    try {
        const bal = await currentProvider.connection.getTokenAccountBalance(userDustAccount);
        document.getElementById('ui-dust').innerText = bal.value.uiAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    } catch(e) {
        document.getElementById('ui-dust').innerText = "0.00";
    }
}

window.web3StakeML1 = async function() {
    if (!(await initWeb3Engine())) return alert("⚠️ 請先連接 Solana 錢包！");
    const amt = parseFloat(document.getElementById('web3-stake-amount').value);
    if (!amt || amt <= 0) return alert("⚠️ 請輸入大於 0 的質押數量！");

    const walletPk = currentProvider.wallet.publicKey;
    
    // 🛡️ 架構師防護 3：$ML1 精度為 0！絕對不能乘以 1e9，直接傳入整數 BN！
    const rawAmount = new BN(Math.floor(amt).toString());

    const [globalState] = PublicKey.findProgramAddressSync([utf8.encode("global_state")], PROGRAM_ID);
    const [ml1Mint] = PublicKey.findProgramAddressSync([utf8.encode("ml1_mint")], PROGRAM_ID);
    const [globalMl1Vault] = PublicKey.findProgramAddressSync([utf8.encode("global_ml1_vault")], PROGRAM_ID);
    const [userRecordPda] = PublicKey.findProgramAddressSync([utf8.encode("user_record"), walletPk.toBytes()], PROGRAM_ID);
    const userMl1Account = getAssociatedTokenAddressSync(ml1Mint, walletPk);

    if (typeof typeWriter === 'function') {
        typeWriter(`> INITIATING CRYO-SLEEP FOR ${Math.floor(amt)} $ML1...`, `> 正在啟動 ${Math.floor(amt)} 台礦機冷凍休眠...`, "var(--tier5-gold)");
        setTimeout(() => typeWriter("> AWAITING WALLET SIGNATURE...", "> 正在等待錢包安全簽名...", "var(--tier5-gold)"), 800);
    }

    try {
        const tx = new Transaction();
        try {
            await anchorProgram.account.userRecord.fetch(userRecordPda);
        } catch (e) {
            tx.add(await anchorProgram.methods.initUserRecord().accounts({ owner: walletPk, userRecord: userRecordPda, systemProgram: SystemProgram.programId }).instruction());
        }

        tx.add(await anchorProgram.methods.stakeMl1(rawAmount).accounts({
            owner: walletPk, userRecord: userRecordPda, userMl1Account: userMl1Account, globalMl1Vault: globalMl1Vault, tokenProgram: TOKEN_PROGRAM_ID
        }).instruction());

        const txHash = await currentProvider.sendAndConfirm(tx);
        document.getElementById('web3-stake-amount').value = '';
        if (typeof typeWriter === 'function') typeWriter(`> [SUCCESS] TX: ${txHash.slice(0,10)}...`, `> [成功] 節點已休眠! TX: ${txHash.slice(0,10)}...`, "#00ff41");
    } catch (err) {
        if (typeof typeWriter === 'function') typeWriter(`> ERROR: ${err.message.slice(0, 30)}`, `> 錯誤: 操作遭拒絕`, "var(--alert-red)");
    }
};

window.web3ClaimO2 = async function() {
    if (!(await initWeb3Engine())) return alert("⚠️ 請先連接 Solana 錢包！");
    const walletPk = currentProvider.wallet.publicKey;

    const [globalState] = PublicKey.findProgramAddressSync([utf8.encode("global_state")], PROGRAM_ID);
    const [o2Mint] = PublicKey.findProgramAddressSync([utf8.encode("o2_mint")], PROGRAM_ID);
    const [userRecordPda] = PublicKey.findProgramAddressSync([utf8.encode("user_record"), walletPk.toBytes()], PROGRAM_ID);
    const userO2Account = getAssociatedTokenAddressSync(o2Mint, walletPk);

    if (typeof typeWriter === 'function') typeWriter("> EXTRACTING ACCUMULATED $O2 FUEL...", "> 正在提取並結算累積的 $O2 燃料...", "var(--lag-blue)");

    try {
        const tx = new Transaction();
        tx.add(createAssociatedTokenAccountIdempotentInstruction(walletPk, userO2Account, walletPk, o2Mint));
        tx.add(await anchorProgram.methods.claimO2().accounts({
            owner: walletPk, userRecord: userRecordPda, globalState: globalState, o2Mint: o2Mint, userO2Account: userO2Account, tokenProgram: TOKEN_PROGRAM_ID
        }).instruction());

        const txHash = await currentProvider.sendAndConfirm(tx);
        if (typeof typeWriter === 'function') typeWriter(`> [SUCCESS] O2 SECURED! TX: ${txHash.slice(0,10)}...`, `> [成功] 燃料已入庫! TX: ${txHash.slice(0,10)}...`, "var(--lag-blue)");
    } catch (err) {
        if (typeof typeWriter === 'function') typeWriter(`> CLAIM FAILED: NO O2?`, `> 提取失敗: 可能尚無產出`, "var(--alert-red)");
    }
};

window.web3BurnForDust = async function() {
    if (!(await initWeb3Engine())) return alert("⚠️ 請先連接 Solana 錢包！");
    const amt = parseFloat(document.getElementById('web3-burn-amount').value);
    if (!amt || amt < 100000) return alert("⚠️ Base Cost requires at least 100,000 $O2!");

    const walletPk = currentProvider.wallet.publicKey;
    
    // 🛡️ 架構師防護 4：$O2 是 9 位小數。巨鯨燃燒千萬顆 O2 時，乘以 1e9 會讓 JS 崩潰。我們使用純 BN 乘法！
    const amtBn = new BN(Math.floor(amt).toString());
    const decimalsBn = new BN("1000000000"); // 1e9
    const rawAmount = amtBn.mul(decimalsBn); 

    const [globalState] = PublicKey.findProgramAddressSync([utf8.encode("global_state")], PROGRAM_ID);
    const [o2Mint] = PublicKey.findProgramAddressSync([utf8.encode("o2_mint")], PROGRAM_ID);
    const [dustMint] = PublicKey.findProgramAddressSync([utf8.encode("dust_mint")], PROGRAM_ID);
    
    const userO2Account = getAssociatedTokenAddressSync(o2Mint, walletPk);
    const userDustAccount = getAssociatedTokenAddressSync(dustMint, walletPk);
    const adminO2Account = getAssociatedTokenAddressSync(o2Mint, ADMIN_PUBKEY);

    if (typeof typeWriter === 'function') typeWriter(`> IGNITING ${Math.floor(amt)} $O2. PREPARING ENTROPY EXTRACTION...`, `> 點燃 ${Math.floor(amt)} 顆 $O2 引擎。準備進行熵值盲挖...`, "var(--tech-green)");

    try {
        const tx = new Transaction();
        tx.add(createAssociatedTokenAccountIdempotentInstruction(walletPk, userDustAccount, walletPk, dustMint));
        tx.add(await anchorProgram.methods.burnO2ForDust(rawAmount).accounts({
            owner: walletPk, globalState: globalState, o2Mint: o2Mint, dustMint: dustMint, userO2Account: userO2Account, userDustAccount: userDustAccount, adminO2Account: adminO2Account, tokenProgram: TOKEN_PROGRAM_ID
        }).instruction());

        const txHash = await currentProvider.sendAndConfirm(tx);
        document.getElementById('web3-burn-amount').value = '';
        if (typeof typeWriter === 'function') typeWriter(`> [JACKPOT] DUST MINED! TX: ${txHash.slice(0,10)}...`, `> [大滿貫] 成功挖出 DUST! TX: ${txHash.slice(0,10)}...`, "var(--tech-green)");
    } catch (err) {
        if (typeof typeWriter === 'function') typeWriter(`> BURN REJECTED. CHECK O2 BAL.`, `> 點火遭拒: 檢查餘額或稅金`, "var(--alert-red)");
    }
};

// ==========================================
// 🚀 終極更新：一鍵智能支付閘道 (自動發送 8 大神幣)
// ==========================================
window.submitToLedger = async function() {
    const network = document.getElementById('reg-network').value;
    const amountStr = document.getElementById('reg-amount').value;
    const isZh = document.body.classList.contains('lang-zh');

    if (!amountStr || parseFloat(amountStr) <= 0) return alert(isZh ? "請輸入有效的打款數量！" : "Please enter a valid amount!");
    
    const solProvider = getSolanaProvider();
    if (!solProvider || !solProvider.publicKey) return alert(isZh ? "請先連接 Solana 錢包！" : "Please connect your Solana wallet first!");

    const userPubkey = solProvider.publicKey;
    const btn = document.getElementById('t-btn');
    const originalBtnText = btn.innerText;
    btn.innerText = isZh ? "請求錢包簽名中..." : "AWAITING SIGNATURE...";
    btn.disabled = true;

    try {
        // ⚠️ 開發階段設為 false，這樣可以先在 Devnet 測試 SOL。
        // 上線時改成 true，JUP / BONK 等 8 大神幣就會全自動打通！
        const isMainnet = false; 
        const connection = new Connection(isMainnet ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com", "confirmed");
        let tx = new Transaction();
        const amount = parseFloat(amountStr);
        let signature = "";

        if (network === "SOL") {
            const lamports = Math.floor(amount * 1e9); 
            tx.add(SystemProgram.transfer({ fromPubkey: userPubkey, toPubkey: ADMIN_PUBKEY, lamports: lamports }));
        } else {
            if (!isMainnet) throw new Error(isZh ? "Devnet 測試網僅支援 SOL 支付！請於主網上線後測試 SPL 代幣。" : "Devnet only supports SOL! Switch to Mainnet for SPL tokens.");

            // 真實 Mainnet 8 大神幣 Mint 地址
            const MINT_ADDRESSES = {
                "USDC": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "USDT": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
                "JUP":  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", "JTO":  "jtojtomepa8beP8AuQc6eP9tWbnRZAexgqAEMQ6QZtw",
                "PYTH": "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3AkT4Z1c16J1iR", "BONK": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
                "BOME": "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82"
            };
            const TOKEN_DECIMALS = { "USDC": 6, "USDT": 6, "JUP": 6, "JTO": 9, "PYTH": 6, "BONK": 5, "BOME": 6 };

            const mintPubkey = new PublicKey(MINT_ADDRESSES[network]);
            const decimals = TOKEN_DECIMALS[network];
            
            // 安全的大數計算 (避免浮點數溢位)
            const amtBn = new BN(Math.floor(amount).toString());
            const fraction = amount - Math.floor(amount);
            const fractionBn = new BN(Math.floor(fraction * Math.pow(10, decimals)).toString());
            const multiplier = new BN(Math.pow(10, decimals).toString());
            const rawAmount = amtBn.mul(multiplier).add(fractionBn);

            const userTokenAccount = getAssociatedTokenAddressSync(mintPubkey, userPubkey);
            const adminTokenAccount = getAssociatedTokenAddressSync(mintPubkey, ADMIN_PUBKEY);

            tx.add(createTransferInstruction(userTokenAccount, adminTokenAccount, userPubkey, BigInt(rawAmount.toString())));
        }

        const latestBlockhash = await connection.getLatestBlockhash();
        tx.recentBlockhash = latestBlockhash.blockhash;
        tx.feePayer = userPubkey;

        // 喚醒 Phantom 簽名
        const signedTx = await solProvider.signTransaction(tx);
        signature = await connection.sendRawTransaction(signedTx.serialize());

        btn.innerText = isZh ? "區塊鏈確認中..." : "CONFIRMING ON-CHAIN...";
        await connection.confirmTransaction({ signature: signature, blockhash: latestBlockhash.blockhash, lastValidBlockHeight: latestBlockhash.lastValidBlockHeight });

        // ==========================================
        // 交易成功，將 TXID 自動寫入星際帳本 (取代玩家手動填寫)
        // ==========================================
        btn.innerText = isZh ? "寫入星際帳本..." : "WRITING TO LEDGER...";
        const payload = [{
            "TIMESTAMP (UTC)": new Date().toLocaleString(),
            "PIONEER_ADDRESS": userPubkey.toString(),
            "NETWORK": network,
            "ASSET_AMOUNT": amount,
            "TXID_HASH": signature, 
            "VALIDATION_STATUS": "PENDING"
        }];

        const response = await fetch('https://api.steinhq.com/v1/storages/69ff888492b1163e97ef10df/工作表1', {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });

        if (response.ok) {
            document.getElementById('reg-amount').value = '';
            document.getElementById('reg-hash').value = signature; // 自動展示 TXID 讓玩家安心
            document.getElementById('reg-hash').readOnly = true;
            if (typeof updateProgress === 'function') updateProgress();

            const lagScreen = document.getElementById('lag-screen');
            const lBar = document.getElementById('l-bar');
            if (lagScreen && lBar) {
                lagScreen.style.display = 'flex';
                let currentProgress = 0;
                const progressInterval = setInterval(() => {
                    currentProgress += Math.random() * 6;
                    if (currentProgress >= 100) {
                        currentProgress = 100;
                        clearInterval(progressInterval);
                        setTimeout(() => window.location.href = 'portal.html?auth=mars2026', 500);
                    }
                    lBar.style.width = currentProgress + '%';
                }, 40);
            } else {
                window.location.href = 'portal.html?auth=mars2026';
            }
        } else throw new Error("Database write failed");

    } catch (error) {
        console.error(error);
        alert(isZh ? `❌ 交易失敗或取消\n${error.message}` : `❌ Transaction Failed\n${error.message}`);
        btn.innerText = originalBtnText;
        btn.disabled = false;
    }
};

window.addEventListener('load', () => {
    setTimeout(() => { initWeb3Engine(); }, 1000);
});