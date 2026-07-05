import type { Address, Hex } from "viem";

export type PayrollIntent = {
  runId: Hex;
  smartAccount: Address;
  token: Address;
  paymentCount: bigint;
  validUntil: number;
  nonce: bigint;
};

export function getPayrollIntentTypedData(chainId: number, verifyingContract: Address, message: PayrollIntent) {
  return {
    domain: {
      name: "Lattice Pay Payroll",
      version: "1",
      chainId,
      verifyingContract
    },
    primaryType: "PayrollIntent" as const,
    types: {
      PayrollIntent: [
        { name: "runId", type: "bytes32" },
        { name: "smartAccount", type: "address" },
        { name: "token", type: "address" },
        { name: "paymentCount", type: "uint256" },
        { name: "validUntil", type: "uint48" },
        { name: "nonce", type: "uint256" }
      ]
    },
    message
  };
}
