export const payrollExecutorAbi = [
  {
    type: "event",
    name: "PayrollPaymentProcessed",
    anonymous: false,
    inputs: [
      { indexed: false, name: "runId", type: "bytes32" },
      { indexed: false, name: "index", type: "uint256" },
      { indexed: false, name: "recipient", type: "address" },
      { indexed: false, name: "success", type: "bool" }
    ]
  },
  {
    type: "event",
    name: "PayrollRunExecuted",
    anonymous: false,
    inputs: [
      { indexed: false, name: "runId", type: "bytes32" },
      { indexed: false, name: "smartAccount", type: "address" },
      { indexed: false, name: "token", type: "address" },
      { indexed: false, name: "paymentCount", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "executePayroll",
    stateMutability: "nonpayable",
    inputs: [
      { name: "runId", type: "bytes32" },
      { name: "token", type: "address" },
      { name: "from", type: "address" },
      { name: "recipients", type: "address[]" },
      { name: "encryptedAmounts", type: "bytes32[]" },
      { name: "inputProofs", type: "bytes[]" },
      { name: "validUntil", type: "uint48" },
      { name: "nonce", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "nonces",
    stateMutability: "view",
    inputs: [{ name: "smartAccount", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;
