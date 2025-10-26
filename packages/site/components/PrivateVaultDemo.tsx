"use client";

import { useFhevm } from "@fhevm/react";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { usePrivateVault } from "../hooks/usePrivateVault";
import { errorNotDeployed } from "./ErrorNotDeployed";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

// Loading Spinner Component
const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  }[size];

  return (
    <div className={`${sizeClass} relative`}>
      <div className="absolute inset-0 border-4 border-white/30 rounded-full animate-spin border-t-white"></div>
    </div>
  );
};

// Toast Notification Component
const Toast = ({ 
  message, 
  type = "info", 
  onClose 
}: { 
  message: string; 
  type?: "success" | "error" | "info" | "warning";
  onClose: () => void;
}) => {
  const bgColors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500"
  };

  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠"
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${bgColors[type]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slideIn`}>
      <span className="text-2xl">{icons[type]}</span>
      <p className="font-medium">{message}</p>
      <button onClick={onClose} className="ml-auto text-white/80 hover:text-white">
        ✕
      </button>
    </div>
  );
};

// Progress Steps Component
const ProgressSteps = ({ 
  steps, 
  currentStep 
}: { 
  steps: string[]; 
  currentStep: number;
}) => {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            index < currentStep 
              ? "bg-green-500 text-white scale-110" 
              : index === currentStep
              ? "bg-blue-500 text-white animate-pulse"
              : "bg-gray-300 text-gray-500"
          }`}>
            {index < currentStep ? "✓" : index + 1}
          </div>
          <span className={`text-sm ${
            index <= currentStep ? "text-gray-800 font-medium" : "text-gray-400"
          }`}>
            {step}
          </span>
        </div>
      ))}
    </div>
  );
};

// Helper to safely extract error message
const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.reason) return error.reason;
  if (error?.data?.message) return error.data.message;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error occurred';
  }
};

export const PrivateVaultDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const vault = usePrivateVault({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  // Form states
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawTo, setWithdrawTo] = useState("");
  
  // Toast notification state
  const [toast, setToast] = useState<{message: string; type: "success" | "error" | "info" | "warning"} | null>(null);
  
  // Progress tracking
  const [depositProgress, setDepositProgress] = useState(0);
  const [withdrawProgress, setWithdrawProgress] = useState(0);
  
  // Show toast helper
  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setToast({ message, type });
  };
  
  // Deposit steps
  const depositSteps = ["Confirm transaction", "Processing deposit", "Updating balance"];
  const withdrawSteps = ["Encrypt amount", "Request withdrawal", "Oracle processing", "Transfer complete"];

  // Styles
  const buttonClass =
    "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg " +
    "transition-all duration-200 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl active:scale-95 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";

  const cardClass =
    "bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow duration-200";

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all";

  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className={cardClass + " text-center"}>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Confidential Transfer
          </h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to access your encrypted balance
          </p>
          <button className={buttonClass} onClick={connect}>
            <span className="text-lg">Connect to MetaMask</span>
          </button>
        </div>
      </div>
    );
  }

  if (vault.isDeployed === false) {
    return errorNotDeployed(chainId);
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Chiper Protocol
        </h1>
        <p className="text-gray-600">
          Confidential Transfer with Fully Homomorphic Encryption
        </p>
      </div>

      {/* Status Message */}
      {vault.message && (
        <div
          className={`${cardClass} ${
            vault.message.includes("failed") || vault.message.includes("error")
              ? "border-red-300 bg-red-50"
              : "border-green-300 bg-green-50"
          }`}
        >
          <p
            className={
              vault.message.includes("failed") || vault.message.includes("error")
                ? "text-red-700"
                : "text-green-700"
            }
          >
            {vault.message}
          </p>
        </div>
      )}

      {/* Balance Card */}
      <div className={cardClass}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Your Private Balance
        </h2>

        {/* Decryption Progress */}
        {vault.isDecrypting && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Decrypting cached handles...</span>
              <span>
                {vault.decryptProgress.done} / {vault.decryptProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    vault.decryptProgress.total > 0
                      ? (vault.decryptProgress.done /
                          vault.decryptProgress.total) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Balance Display */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 mb-4">
          {vault.isDecrypted && vault.clearBalance ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Decrypted Balance</p>
              <p className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {ethers.formatEther(BigInt(vault.clearBalance.clear))}
              </p>
              <p className="text-xs text-gray-500 mt-2">ETH</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Balance is encrypted
              </p>
              <p className="text-2xl font-mono text-gray-400 truncate">
                {vault.balanceHandle || "0x0..."}
              </p>
            </div>
          )}
        </div>

        {/* Decrypt Button */}
        <button
          className={buttonClass + " w-full"}
          disabled={!vault.canDecrypt || vault.isDecrypting}
          onClick={() => {
            vault.decryptBalance();
            showToast("Decrypting balance...", "info");
          }}
        >
          {vault.isDecrypting ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Decrypting...</span>
            </>
          ) : "Decrypt Balance"}
        </button>
      </div>

      {/* Actions Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Deposit Card */}
        <div className={cardClass}>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Deposit</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Amount (ETH)</label>
              <input
                type="number"
                className={inputClass}
                placeholder="Enter amount to deposit"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={vault.isProcessing}
              />
            </div>
            {vault.isProcessing && depositProgress > 0 ? (
              <div className="bg-purple-50 rounded-lg p-4">
                <ProgressSteps steps={depositSteps} currentStep={depositProgress} />
              </div>
            ) : null}
            <button
              className={buttonClass + " w-full"}
              disabled={
                !depositAmount ||
                parseFloat(depositAmount) <= 0 ||
                vault.isProcessing
              }
              onClick={async () => {
                try {
                  setDepositProgress(0);
                  showToast("Starting deposit...", "info");
                  setDepositProgress(1);
                  
                  const amount = ethers.parseEther(depositAmount);
                  await vault.deposit(amount);
                  
                  setDepositProgress(2);
                  setTimeout(() => {
                    setDepositProgress(3);
                    showToast("Deposit successful! Balance updated.", "success");
                    setDepositAmount("");
                    setTimeout(() => setDepositProgress(0), 1000);
                  }, 500);
                } catch (e: any) {
                  console.error("Deposit error:", e);
                  setDepositProgress(0);
                  showToast(`Deposit failed: ${getErrorMessage(e)}`, "error");
                }
              }}
            >
              {vault.isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Processing Deposit...</span>
                </>
              ) : "Deposit ETH"}
            </button>
            <p className="text-xs text-gray-500">
              Your balance is encrypted and stored privately on-chain
            </p>
          </div>
        </div>

        {/* Withdraw Card */}
        <div className={cardClass}>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Withdraw</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Amount (ETH)</label>
              <input
                type="number"
                className={inputClass}
                placeholder="Enter amount to withdraw"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={vault.isProcessing}
              />
            </div>
            <div>
              <label className={labelClass}>To Address</label>
              <input
                type="text"
                className={inputClass}
                placeholder="0x..."
                value={withdrawTo}
                onChange={(e) => setWithdrawTo(e.target.value)}
                disabled={vault.isProcessing}
              />
            </div>
            {vault.isProcessing && withdrawProgress > 0 ? (
              <div className="bg-blue-50 rounded-lg p-4">
                <ProgressSteps steps={withdrawSteps} currentStep={withdrawProgress} />
              </div>
            ) : null}
            <button
              className={buttonClass + " w-full"}
              disabled={
                !withdrawAmount ||
                !withdrawTo ||
                parseFloat(withdrawAmount) <= 0 ||
                vault.isProcessing ||
                !fhevmInstance
              }
              onClick={async () => {
                try {
                  setWithdrawProgress(1);
                  showToast("Encrypting withdrawal amount...", "info");
                  
                  const amount = ethers.parseEther(withdrawAmount);
                  setWithdrawProgress(2);
                  
                  await vault.withdraw(withdrawTo, amount);
                  
                  setWithdrawProgress(3);
                  showToast("Withdrawal requested! Oracle is processing...", "warning");
                  
                  // Note: Step 4 will be set when oracle completes (via event listener)
                  setWithdrawAmount("");
                  setWithdrawTo("");
                  
                  // Reset after some time
                  setTimeout(() => setWithdrawProgress(0), 10000);
                } catch (e: any) {
                  console.error("Withdrawal error:", e);
                  setWithdrawProgress(0);
                  showToast(`Withdrawal failed: ${getErrorMessage(e)}`, "error");
                }
              }}
            >
              {vault.isProcessing ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Processing Withdrawal...</span>
                </>
              ) : "Withdraw (Encrypted)"}
            </button>
            <p className="text-xs text-gray-500">
              Withdrawal requests are processed by the oracle with public decryption
            </p>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <details className="bg-gray-50 rounded-lg p-4">
        <summary className="cursor-pointer font-semibold text-gray-700">
          Debug Info
        </summary>
        <div className="mt-4 space-y-2 text-sm font-mono">
          <p>
            <span className="font-semibold">Chain ID:</span> {chainId}
          </p>
          <p>
            <span className="font-semibold">Vault Address:</span>{" "}
            {vault.vault.address || "Not deployed"}
          </p>
          <p>
            <span className="font-semibold">Balance Handle:</span>{" "}
            {vault.balanceHandle || "None"}
          </p>
          <p>
            <span className="font-semibold">FHEVM Status:</span> {fhevmStatus}
          </p>
          {fhevmError && (
            <p className="text-red-600">
              <span className="font-semibold">FHEVM Error:</span>{" "}
              {fhevmError.message}
            </p>
          )}
        </div>
      </details>
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        </div>
      )}
    </div>
  );
};
