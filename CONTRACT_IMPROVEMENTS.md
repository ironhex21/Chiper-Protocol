# Contract Improvements - PrivateVault v2

## 📋 Summary of Changes

Based on comprehensive review, **3 critical fixes** and **2 feature enhancements** have been implemented.

---

## 🔧 Critical Fixes

### 1. **Comparator Fix: `FHE.le` → `FHE.lte`**

**Issue:**
```solidity
// ❌ Before: < (less than only)
ebool ok = FHE.le(amt, _balances[msg.sender]);
```

**Fix:**
```solidity
// ✅ After: ≤ (less than or equal)
ebool ok = FHE.lte(amt, _balances[msg.sender]);
```

**Why Critical:**
- `FHE.le` = strictly less than (`<`)
- `FHE.lte` = less than or equal (`<=`)
- **Bug:** User tidak bisa withdraw FULL balance (100% saldo)
- **Impact:** Selalu ada sisa wei yang tidak bisa ditarik

**Example Before Fix:**
```
Balance: 1.0 ETH
Withdraw: 1.0 ETH → Rejected (1.0 NOT < 1.0)
Only can withdraw: 0.999999999 ETH max
```

**Example After Fix:**
```
Balance: 1.0 ETH
Withdraw: 1.0 ETH → Accepted (1.0 <= 1.0) ✅
Can withdraw: Full balance!
```

---

### 2. **Callback Signature: `bytes` → `bytes[]`**

**Issue:**
```solidity
// ❌ Before: Single bytes
function onWithdraw(
    uint256 requestId,
    bytes calldata cleartexts,
    bytes calldata signatures  // ❌ Wrong type
) external
```

**Fix:**
```solidity
// ✅ After: Array of bytes
function onWithdraw(
    uint256 requestId,
    bytes calldata cleartexts,
    bytes[] calldata signatures  // ✅ Correct type
) external
```

**Why Critical:**
- Oracle sends **array of signatures** (multiple ciphertexts can be decrypted)
- `FHE.checkSignatures()` expects `bytes[]`, not `bytes`
- **Bug:** Oracle callback akan revert dengan signature mismatch
- **Impact:** Withdrawal tidak pernah selesai (stuck di oracle)

**Technical:**
```solidity
// Oracle sends:
signatures = [signature1, signature2, ...]  // Array

// Contract expects (before fix):
bytes calldata signatures  // ❌ Type mismatch

// Contract expects (after fix):
bytes[] calldata signatures  // ✅ Correct!
```

---

### 3. **Zero Balance Handling**

**Issue:**
- Tidak ada mekanisme untuk tolak withdrawal saat balance = 0
- Silent fail: txAmt = 0, oracle decrypt & send 0 ETH (wasteful)

**Fix:**
```solidity
// ✅ New Event
event WithdrawRejectedZero(address indexed user, address indexed to, uint256 requestId);

// ✅ New Logic in Callback
if (amount == 0) {
    // Tidak kirim ETH; emit event untuk UI
    emit WithdrawRejectedZero(p.from, p.to, requestId);
    return;
}
```

**Why Important:**
- **On-chain:** Cannot check encrypted balance (privacy!)
- **Solution:** Emit event jika amount = 0 setelah decrypt
- **UI:** Can detect event dan show warning
- **Gas savings:** Tidak execute transfer untuk 0 ETH

---

## ✨ Feature Enhancements

### 1. **UI: Balance Zero Warning**

**Before:**
```
❌ No warning for zero balance
❌ Can try to withdraw (will fail)
❌ Confusing error messages
```

**After:**
```
✅ Yellow warning box if balance = 0
✅ Withdraw button disabled
✅ Clear message: "Please deposit ETH first"
```

**Implementation:**
```tsx
{vault.clearBalance && vault.clearBalance.clear === BigInt(0) && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
    <p className="text-yellow-800">⚠️ Balance is 0 - Cannot withdraw</p>
    <p className="text-yellow-700">Please deposit ETH first</p>
  </div>
)}
```

---

### 2. **UI: Amount Validation**

**Before:**
```
❌ No client-side validation
❌ User can request > balance
❌ Fails on-chain (wastes gas)
```

**After:**
```
✅ Validates amount <= balance before sending
✅ Shows available balance
✅ Prevents wasteful transactions
```

**Implementation:**
```tsx
// Show available balance
{vault.clearBalance && vault.clearBalance.clear !== BigInt(0) && (
  <p className="text-xs text-gray-500">
    Available: {ethers.formatEther(vault.clearBalance.clear)} ETH
  </p>
)}

// Validate before withdraw
if (amount > vault.clearBalance.clear) {
  showToast(`Amount exceeds balance! Available: ${formatted} ETH`, "error");
  return;
}
```

---

## 📊 Before vs After Comparison

| Feature | Before | After |
|---------|--------|-------|
| **Full Balance Withdrawal** | ❌ Cannot (< only) | ✅ Can (≤) |
| **Oracle Callback** | ❌ Revert (wrong signature type) | ✅ Works (bytes[]) |
| **Zero Balance Withdrawal** | ⚠️ Silent fail | ✅ Event + UI warning |
| **UI Balance Warning** | ❌ None | ✅ Yellow warning box |
| **UI Amount Validation** | ❌ None | ✅ Pre-check before tx |
| **Available Balance Display** | ❌ None | ✅ Shows available ETH |
| **Withdraw Button State** | ⚠️ Always enabled | ✅ Disabled if balance = 0 |

---

## 🎯 User Experience Improvements

### Scenario 1: Withdraw Full Balance

**Before:**
```
User balance: 1.0 ETH
User tries: Withdraw 1.0 ETH
Result: ❌ Rejected (1.0 NOT < 1.0)
Message: Transaction reverted
```

**After:**
```
User balance: 1.0 ETH
User tries: Withdraw 1.0 ETH
Result: ✅ Success (1.0 <= 1.0)
Message: Withdrawal requested! Oracle processing...
```

---

### Scenario 2: Withdraw with Zero Balance

**Before:**
```
User balance: 0 ETH
UI: No warning, button enabled
User clicks: "Withdraw"
Result: ❌ txAmt = 0, oracle processes 0 ETH (waste)
Message: Withdrawal completed (but no ETH received)
```

**After:**
```
User balance: 0 ETH
UI: ⚠️ "Balance is 0 - Cannot withdraw"
Button: Disabled
Result: ✅ Cannot submit (prevented client-side)

If forced (raw call):
  On-chain: txAmt = 0
  Oracle: Decrypt = 0
  Callback: Emit WithdrawRejectedZero (no ETH sent)
  UI: Shows warning "Withdrawal rejected: Zero balance"
```

---

### Scenario 3: Withdraw More Than Balance

**Before:**
```
User balance: 0.5 ETH
User tries: Withdraw 1.0 ETH
UI: No warning
Submit: Transaction sent
Result: txAmt = 0 (on-chain select), oracle processes 0
```

**After:**
```
User balance: 0.5 ETH
UI: Shows "Available: 0.5 ETH"
User tries: Withdraw 1.0 ETH
UI: ❌ Toast "Amount exceeds balance! Available: 0.5 ETH"
Result: Transaction NOT sent (prevented client-side)
```

---

## 🔐 Security Considerations

### Privacy Maintained ✅

All fixes maintain FHE privacy guarantees:

1. **Balance stays encrypted on-chain**
   - Cannot check if balance > 0 on-chain
   - Validation done in UI after user decrypt

2. **Amount encrypted in request**
   - User encrypt amount client-side
   - Contract never sees plaintext amount

3. **Oracle decrypt needed**
   - Only oracle can decrypt for transfer
   - User cannot fake decryption

### New Event Does Not Leak Info ❌

```solidity
event WithdrawRejectedZero(address user, address to, uint256 requestId);
```

**Question:** Does this leak balance info?  
**Answer:** ❌ No!

**Why:**
- Event emitted AFTER oracle decrypt
- At this point, amount already public (in callback)
- Only tells "this specific request was 0"
- Does NOT reveal current balance (could have deposits after request)

---

## 🧪 Testing Checklist

### Contract Tests

- [ ] Test full balance withdrawal (amount = balance)
- [ ] Test partial withdrawal (amount < balance)
- [ ] Test over-balance withdrawal (amount > balance) → txAmt = 0
- [ ] Test zero balance withdrawal → WithdrawRejectedZero event
- [ ] Test oracle callback with bytes[] signatures
- [ ] Test multiple pending withdrawals

### UI Tests

- [ ] Balance = 0 → Warning shown, button disabled
- [ ] Balance > 0 → Available balance shown
- [ ] Try withdraw > balance → Error toast shown
- [ ] Try withdraw ≤ balance → Transaction sent
- [ ] Decrypt balance → Warning updates accordingly

---

## 🚀 Migration Guide

### For Existing Users

**No action needed!** Improvements are backward compatible.

**What Changes:**
- ✅ Can now withdraw full balance
- ✅ Better UI feedback
- ✅ Clearer error messages

**What Stays Same:**
- ✅ Deposit flow unchanged
- ✅ Encryption unchanged
- ✅ Oracle flow unchanged
- ✅ Balance privacy maintained

### For Developers

**Contract Redeploy Required:**
1. Changes affect contract logic (comparator, signature type)
2. Cannot upgrade (not upgradeable contract)
3. Need new deployment

**Steps:**
```bash
# 1. Deploy new contract
npm run deploy:sepolia

# 2. Update contract address in UI
# Edit: packages/site/abi/PrivateVaultAddresses.ts

# 3. Verify on Etherscan
npm run verify:sepolia

# 4. Test on testnet
# 5. Announce to users (old deposits on old contract!)
```

**Breaking Change:**
- ⚠️ Old contract deposits NOT migrated
- Users need to withdraw from old contract first
- Then deposit to new contract

---

## 📚 Technical References

### FHEVM Comparators

| Function | Operation | Use Case |
|----------|-----------|----------|
| `FHE.lt(a, b)` | a < b | Strictly less than |
| `FHE.lte(a, b)` | a ≤ b | Less than or equal ✅ |
| `FHE.gt(a, b)` | a > b | Strictly greater than |
| `FHE.gte(a, b)` | a ≥ b | Greater than or equal |
| `FHE.eq(a, b)` | a == b | Equal |
| `FHE.ne(a, b)` | a != b | Not equal |

**Documentation:**
https://docs.zama.ai/fhevm/fundamentals/types#comparison-operations

### Oracle Callback Signature

**Correct Signature:**
```solidity
function callback(
    uint256 requestId,
    bytes calldata decryptedValues,
    bytes[] calldata signatures  // ✅ Array!
) external
```

---

## ✅ Verification

**Contract Changes:**
- ✅ Line 68: `FHE.lte` instead of `FHE.le`
- ✅ Line 27: Event `WithdrawRejectedZero` added
- ✅ Line 97: `bytes[]` instead of `bytes`
- ✅ Line 109-113: Zero amount handling

**UI Changes:**
- ✅ Balance zero warning component
- ✅ Available balance display
- ✅ Amount validation before withdraw
- ✅ Button disabled when balance = 0

---
