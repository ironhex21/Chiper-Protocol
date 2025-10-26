// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint128, ebool, externalEuint128} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title PrivateVault - Confidential Transfer Protocol
/// @notice Chiper Protocol: Encrypted balance storage with FHE-powered confidential transfers
/// @dev User balances encrypted on-chain; TVL publicly decryptable for transparency
contract PrivateVault is SepoliaConfig {
    // Saldo privat per user
    mapping(address => euint128) private _balances;
    // TVL terenkripsi (dipublikasikan setiap update)
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

    /* ============================== WRITE (FHE) ============================== */

    /// @notice Deposit ETH; jumlah publik di tx, catatan saldo & TVL privat
    function depositETH() external payable {
        require(msg.value > 0, "No ETH");
        require(msg.value <= type(uint128).max, "Too large");

        euint128 amt = FHE.asEuint128(uint128(msg.value));
        _balances[msg.sender] = FHE.add(_balances[msg.sender], amt);
        _tvl                  = FHE.add(_tvl,                  amt);

        // ACL: pemilik boleh userDecrypt; kontrak boleh pakai ulang
        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allowThis(_tvl);

        // TVL wajib publik
        FHE.makePubliclyDecryptable(_tvl);

        emit Deposit(msg.sender, msg.value);
    }

    /// @notice Minta withdraw parsial/penuh (amount terenkripsi dari UI)
    /// @param to alamat tujuan (boleh alamat sendiri)
    /// @param extAmt amount terenkripsi (wei)
    /// @param inputProof bukti dari SDK
    function requestWithdraw(
        address payable to,
        externalEuint128 extAmt,
        bytes calldata inputProof
    ) external returns (uint256 requestId) {
        require(to != address(0), "bad to");

        // Ambil amount terenkripsi dari UI
        euint128 amt = FHE.fromExternal(extAmt, inputProof);
        // Opsional (tergantung versi lib): pastikan handle milik caller
        // require(FHE.isSenderAllowed(amt), "not allowed");

        // if (amt <= balance) txAmt = amt else 0  (privat)
        ebool ok      = FHE.le(amt, _balances[msg.sender]);
        euint128 txAmt = FHE.select(ok, amt, FHE.asEuint128(0));

        // Kurangi saldo & TVL (privat)
        _balances[msg.sender] = FHE.sub(_balances[msg.sender], txAmt);
        _tvl                  = FHE.sub(_tvl,                  txAmt);

        // ACL & TVL publik pasca update
        FHE.allow(_balances[msg.sender], msg.sender);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allowThis(_tvl);
        FHE.makePubliclyDecryptable(_tvl);

        // (opsional) publish txAmt agar bisa diaudit publik
        FHE.makePubliclyDecryptable(txAmt);

        // Minta dekripsi publik asinkron → hasil ke onWithdraw(...)
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(txAmt);
        requestId = FHE.requestDecryption(cts, this.onWithdraw.selector);

        _pending[requestId] = PendingW({ to: to, from: msg.sender, processed: false });
        emit WithdrawRequested(msg.sender, to, requestId);
    }

    /// @notice Callback oracle: verifikasi → decode → kirim ETH
    /// @dev Supports both bytes and bytes[] signature formats for compatibility
    function onWithdraw(
        uint256 requestId,
        bytes calldata cleartexts,
        bytes calldata signatures
    ) external {
        // WAJIB: verifikasi bukti oracle (anti-spoof)
        FHE.checkSignatures(requestId, cleartexts, signatures);

        PendingW storage p = _pending[requestId];
        require(!p.processed, "already");
        require(p.to != address(0) && p.from != address(0), "no pending");
        p.processed = true;

        uint128 amount = abi.decode(cleartexts, (uint128));
        // Ensure vault has enough balance
        require(address(this).balance >= amount, "insufficient vault balance");
        if (amount > 0) {
            (bool ok, ) = p.to.call{ value: uint256(amount) }("");
            require(ok, "ETH send failed");
        }
        emit Withdrawn(p.from, p.to, amount);
    }

    /* =============================== VIEW (HANDLE) ============================== */

    /// @notice Handle saldo privat caller (pakai userDecrypt di UI)
    function myBalance() external view returns (euint128) {
        return _balances[msg.sender];
    }

    /// @notice Handle TVL (bisa publicDecrypt oleh siapa pun)
    function encryptedTVL() external view returns (euint128) {
        return _tvl;
    }

    /* ============================= SAFETY / MISC ============================= */

    /// @dev Hindari ETH masuk tanpa pencatatan: paksa user pakai depositETH()
    receive() external payable { revert("Use depositETH()"); }
}
