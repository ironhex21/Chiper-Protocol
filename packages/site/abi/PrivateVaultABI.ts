
/*
  This file is auto-generated.
  By commands: 'npx hardhat deploy' or 'npx hardhat node'
*/
export const PrivateVaultABI = {
  "abi": [
    {
      "inputs": [],
      "name": "HandlesAlreadySavedForRequestID",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidKMSSignatures",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NoHandleFoundForRequestID",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "requestID",
          "type": "uint256"
        }
      ],
      "name": "DecryptionFulfilled",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "Deposit",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "requestId",
          "type": "uint256"
        }
      ],
      "name": "WithdrawRejectedZero",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "requestId",
          "type": "uint256"
        }
      ],
      "name": "WithdrawRequested",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint128",
          "name": "amount",
          "type": "uint128"
        }
      ],
      "name": "Withdrawn",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "depositETH",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "encryptedTVL",
      "outputs": [
        {
          "internalType": "euint128",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "myBalance",
      "outputs": [
        {
          "internalType": "euint128",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "requestId",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "cleartexts",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "signatures",
          "type": "bytes"
        }
      ],
      "name": "onWithdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address payable",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "externalEuint128",
          "name": "extAmt",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "requestWithdraw",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "requestId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ]
} as const;

