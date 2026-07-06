// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";

contract MockERC7984 is IERC7984 {
    bool public shouldRevertTransfer;
    uint256 public transferCount;
    mapping(address => uint256) public faucetBalances;

    event FaucetMint(address indexed to, uint256 amount);

    function setShouldRevertTransfer(bool value) external {
        shouldRevertTransfer = value;
    }

    function faucetMint(address to, uint256 amount) external {
        faucetBalances[to] += amount;
        emit FaucetMint(to, amount);
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IERC165).interfaceId || interfaceId == type(IERC7984).interfaceId;
    }

    function name() external pure returns (string memory) {
        return "Mock Confidential";
    }

    function symbol() external pure returns (string memory) {
        return "MCONF";
    }

    function decimals() external pure returns (uint8) {
        return 6;
    }

    function contractURI() external pure returns (string memory) {
        return "";
    }

    function confidentialTotalSupply() external pure returns (euint64) {
        return euint64.wrap(bytes32(uint256(0)));
    }

    function confidentialBalanceOf(address) external pure returns (euint64) {
        return euint64.wrap(bytes32(uint256(0)));
    }

    function isOperator(address, address) external pure returns (bool) {
        return false;
    }

    function setOperator(address operator, uint48 until) external {
        emit OperatorSet(msg.sender, operator, until);
    }

    function confidentialTransfer(
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external returns (euint64) {
        if (shouldRevertTransfer) revert("mock transfer revert");
        transferCount += 1;
        emit ConfidentialTransfer(msg.sender, to, euint64.wrap(externalEuint64.unwrap(encryptedAmount)));
        inputProof;
        return euint64.wrap(externalEuint64.unwrap(encryptedAmount));
    }

    function confidentialTransfer(address to, euint64 amount) external returns (euint64 transferred) {
        if (shouldRevertTransfer) revert("mock transfer revert");
        transferCount += 1;
        emit ConfidentialTransfer(msg.sender, to, amount);
        return amount;
    }

    function confidentialTransferFrom(
        address from,
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external returns (euint64) {
        if (shouldRevertTransfer) revert("mock transfer revert");
        transferCount += 1;
        emit ConfidentialTransfer(from, to, euint64.wrap(externalEuint64.unwrap(encryptedAmount)));
        inputProof;
        return euint64.wrap(externalEuint64.unwrap(encryptedAmount));
    }

    function confidentialTransferFrom(address from, address to, euint64 amount) external returns (euint64 transferred) {
        if (shouldRevertTransfer) revert("mock transfer revert");
        transferCount += 1;
        emit ConfidentialTransfer(from, to, amount);
        return amount;
    }

    function confidentialTransferAndCall(
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof,
        bytes calldata data
    ) external returns (euint64 transferred) {
        inputProof;
        data;
        return this.confidentialTransfer(to, encryptedAmount, "");
    }

    function confidentialTransferAndCall(
        address to,
        euint64 amount,
        bytes calldata data
    ) external returns (euint64 transferred) {
        data;
        return this.confidentialTransfer(to, amount);
    }

    function confidentialTransferFromAndCall(
        address from,
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof,
        bytes calldata data
    ) external returns (euint64 transferred) {
        inputProof;
        data;
        return this.confidentialTransferFrom(from, to, encryptedAmount, "");
    }

    function confidentialTransferFromAndCall(
        address from,
        address to,
        euint64 amount,
        bytes calldata data
    ) external returns (euint64 transferred) {
        data;
        return this.confidentialTransferFrom(from, to, amount);
    }
}
