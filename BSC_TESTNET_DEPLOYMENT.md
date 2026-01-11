# BSC Testnet Deployment - Quick Reference

## 🎉 Deployment Complete!

**Date**: 2026-01-06  
**Network**: BSC Testnet (Chain ID: 97)

---

## 📋 Contract Addresses

```
Main Contract:    0x2A6E31141D1f4F029A65E1493C9A7ed9B6d99b27
Royalty Contract: 0x9F4fE3F3dD5B79B7729145023A7F66E654237505
```

**Explorers:**
- Main: https://testnet.bscscan.com/address/0x2A6E31141D1f4F029A65E1493C9A7ed9B6d99b27
- Royalty: https://testnet.bscscan.com/address/0x9F4fE3F3dD5B79B7729145023A7F66E654237505

---

## ⚡ Quick Setup (3 Steps)

### 1. Verify Contracts

```bash
# Main Contract
npx hardhat verify --network bscTestnet \
  0x2A6E31141D1f4F029A65E1493C9A7ed9B6d99b27 \
  "0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0" \
  "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526" \
  "0x9F4fE3F3dD5B79B7729145023A7F66E654237505" \
  "0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0" \
  100000

# Royalty Contract  
npx hardhat verify --network bscTestnet \
  0x9F4fE3F3dD5B79B7729145023A7F66E654237505 \
  "0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0" \
  "0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0" \
  "0x0000000000000000000000000000000000000000"
```

### 2. Link Contracts (BSCScan)

**Royalty Contract → Write Contract → setMainContract:**
```
_mainContract: 0x2A6E31141D1f4F029A65E1493C9A7ed9B6d99b27
```

### 3. Initialize Royalty (BSCScan)

**Main Contract → Write Contract → initializeRoyalty:**
```
(Click Write - no parameters)
```

---

## 🧪 Quick Test

**Check Registration Cost:**
```
Read Contract → getRegistrationCost
```

**Register:**
```
Write Contract → registerMe
_referrerAddress: 0x0000000000000000000000000000000000000000
msg.value: (use BNB amount from getRegistrationCost)
```

---

## 📊 Configuration

- Chainlink Feed: `0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526`
- Fee Receiver: `0x018B5411F0FDBC989bCa41115F6124c2FBaa0DB0`
- Root ID: `100000`
- Price Bounds: $100 - $10,000

---

## ✅ Status

- [x] Contracts deployed
- [ ] Contracts verified  
- [ ] Contracts linked
- [ ] Royalty initialized
- [ ] Ready for testing

**Next**: Complete steps 1-3 above to activate!
