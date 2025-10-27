// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint128, ebool, externalEuint128} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title PrivateVault - Confidential Transfer Protocol
/// @notice Chiper Protocol: Encrypted balance storage with FHE-powered confidential transfers
/// @dev User balances encrypted on-chain; TVL publicly decryptable for transparency
contract PrivateVault is SepoliaConfig {
    // Private balance per user
    mapping(address => euint128) private _balances;
    // Encrypted TVL (publicly decryptable on every update)
    euint128 private _tvl;

    struct PendingW {
        address payable to;
        address from;
        bool processed;
    }
    mapping(uint256 => PendingW) private _pending;

    /* ============================== EVENTS ============================== */
    event Deposit(address indexed user, uint256 amount);
    event WithdrawRequested(address indexed user, address indexed to, uint256 requestId);
    event Withdrawn(address indexed user, address indexed to, uint128 amount);
    event WithdrawRejectedZero(address indexed user, address indexed to, uint256 requestId);

    /* ============================== WRITE (FHE) ============================== */

    /// @notice Deposit ETH; amount public in tx, balance & TVL recorded privately
    function depositETH() external payable {
        require(msg.value > 0, "No ETH");
        require(msg.value <= type(uint128).max, "Too large");

        euint128 amt = FHE.asEuint128(uint128(msg.value));
        _balances[msg.sender] = FHE.add(_balances[msg.sender], amt);
        _tvl                  = FHE.add(_tvl,                  amt);

        // ACL: owner can userDecrypt; contract can reuse
        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allowThis(_tvl);

        // TVL must be public
        FHE.makePubliclyDecryptable(_tvl);

        emit Deposit(msg.sender, msg.value);
    }

    /// @notice Request partial/full withdrawal (encrypted amount from UI)
    /// @param to Destination address (can be self)
    /// @param extAmt Encrypted amount (wei)
    /// @param inputProof Proof from SDK
    function requestWithdraw(
        address payable to,
        externalEuint128 extAmt,
        bytes calldata inputProof
    ) external returns (uint256 requestId) {
        require(to != address(0), "bad to");

        // Get encrypted amount from UI
        euint128 amt = FHE.fromExternal(extAmt, inputProof);
        // Optional (depends on lib version): ensure handle belongs to caller
        // require(FHE.isSenderAllowed(amt), "not allowed");

        // if (amt <= balance) txAmt = amt else 0  (private)
        // Note: lte not available, use: (amt < balance) OR (amt == balance)
        ebool lessThan = FHE.lt(amt, _balances[msg.sender]);
        ebool equalTo  = FHE.eq(amt, _balances[msg.sender]);
        ebool ok       = FHE.or(lessThan, equalTo);
        euint128 txAmt = FHE.select(ok, amt, FHE.asEuint128(0));

        // Deduct balance & TVL (private)
        _balances[msg.sender] = FHE.sub(_balances[msg.sender], txAmt);
        _tvl                  = FHE.sub(_tvl,                  txAmt);

        // ACL & TVL public post-update
        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allowThis(_tvl);
        FHE.makePubliclyDecryptable(_tvl);

        // (optional) publish txAmt for public audit
        FHE.makePubliclyDecryptable(txAmt);

        // Request async public decryption → result to onWithdraw(...)
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(txAmt);
        requestId = FHE.requestDecryption(cts, this.onWithdraw.selector);

        _pending[requestId] = PendingW({ to: to, from: msg.sender, processed: false });
        emit WithdrawRequested(msg.sender, to, requestId);
    }

    /// @notice Oracle callback: verify → decode → send ETH / reject if 0
    function onWithdraw(
        uint256 requestId,
        bytes calldata cleartexts,
        bytes calldata signatures
    ) external {
        // REQUIRED: verify oracle proof (anti-spoof)
        FHE.checkSignatures(requestId, cleartexts, signatures);

        PendingW storage p = _pending[requestId];
        require(!p.processed, "already");
        require(p.to != address(0) && p.from != address(0), "no pending");
        p.processed = true;

        uint128 amount = abi.decode(cleartexts, (uint128));

        if (amount == 0) {
            // Don't send ETH; emit clear signal to UI
            emit WithdrawRejectedZero(p.from, p.to, requestId);
            return;
        }

        // Ensure vault has enough balance
        require(address(this).balance >= amount, "insufficient vault balance");
        (bool ok, ) = p.to.call{ value: uint256(amount) }("");
        require(ok, "ETH send failed");

        emit Withdrawn(p.from, p.to, amount);
    }

    /* =============================== VIEW (HANDLE) ============================== */

    /// @notice Handle caller's private balance (use userDecrypt in UI)
    function myBalance() external view returns (euint128) {
        return _balances[msg.sender];
    }

    /// @notice Handle TVL (can be publicDecrypt by anyone)
    function encryptedTVL() external view returns (euint128) {
        return _tvl;
    }

    /* ============================= SAFETY / MISC ============================= */

    /// @dev Prevent ETH entry without recording: force users to use depositETH()
    receive() external payable { revert("Use depositETH()"); }
}
