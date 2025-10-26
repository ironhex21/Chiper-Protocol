export function errorNotDeployed(chainId: number | undefined) {
  const isSupported = chainId === 11155111; // Only Sepolia supported

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-8 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-5xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Wrong Network</h2>
            <p className="text-white/90 text-sm">Please switch to Sepolia</p>
          </div>

          {/* Content */}
          {isSupported ? (
            <div className="p-8 space-y-4">
              <p className="text-gray-700 text-center">
                Contract not deployed. Run:
              </p>
              <div className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-xs">
                <div className="text-gray-500 mb-1"># from packages/fhevm-hardhat-template</div>
                <div>npm run deploy:sepolia</div>
              </div>
            </div>
          ) : (
            <div className="p-8">
              {/* Main Message */}
              <div className="text-center mb-6">
                <p className="text-gray-800 font-semibold text-lg">
                  Chiper Protocol
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Only available on <span className="text-purple-600 font-semibold">Sepolia Testnet</span>
                </p>
              </div>

              {/* Network Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600 text-sm">Network</span>
                  <span className="text-gray-900 font-medium text-sm">Sepolia Testnet</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600 text-sm">Chain ID</span>
                  <span className="text-gray-900 font-mono font-medium text-sm">11155111</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600 text-sm">RPC URL</span>
                  <span className="text-gray-900 font-mono text-xs">rpc.sepolia.org</span>
                </div>
              </div>

              {/* Action */}
              <div className="text-center">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Open <strong>MetaMask</strong>, switch to <strong>Sepolia</strong>, then refresh
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <p className="text-center text-gray-400 text-xs mt-4">
          Need Sepolia ETH? Visit <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:text-purple-600 underline">sepoliafaucet.com</a>
        </p>
      </div>
    </div>
  );
}
