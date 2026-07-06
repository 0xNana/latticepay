// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";

/// @title PayrollExecutor
/// @notice Executes confidential payroll runs against an ERC-7984 token.
contract PayrollExecutor is ZamaEthereumConfig {
    uint256 public constant MAX_BATCH_SIZE = 100;
    address public immutable PAYROLL_TOKEN;

    error InvalidToken();
    error UnexpectedToken(address provided, address expected);
    error UnauthorizedSubmitter(address caller, address expectedFrom);
    error InvalidSourceAccount();
    error RunAlreadyExecuted(bytes32 runId);
    error RunExpired(uint48 validUntil);
    error EmptyBatch();
    error BatchTooLarge(uint256 provided, uint256 maxAllowed);
    error InvalidArrayLengths();
    error InvalidRecipient(uint256 index);
    error EmptyInputProof(uint256 index);
    error InvalidNonce(uint256 expected, uint256 provided);
    error NoSuccessfulPayments();

    event PayrollRunExecuted(bytes32 runId, address smartAccount, address token, uint256 paymentCount);
    event PayrollPaymentProcessed(bytes32 runId, uint256 index, address recipient, bool success);

    mapping(bytes32 => bool) public executedRunId;
    mapping(address => uint256) public nonces;

    constructor(address payrollToken) {
        if (payrollToken == address(0)) revert InvalidToken();
        if (!IERC165(payrollToken).supportsInterface(type(IERC7984).interfaceId)) revert InvalidToken();
        PAYROLL_TOKEN = payrollToken;
    }

    /// @notice Execute one payroll run as a confidential transfer batch.
    /// @dev `inputProofs` must be aligned with `encryptedAmounts` and non-empty for each payment.
    function executePayroll(
        bytes32 runId,
        address token,
        address from,
        address[] calldata recipients,
        externalEuint64[] calldata encryptedAmounts,
        bytes[] calldata inputProofs,
        uint48 validUntil,
        uint256 nonce
    ) external {
        _validateExecutionInputs(runId, token, from, recipients, encryptedAmounts, inputProofs, validUntil, nonce);

        uint256 successCount =
            _processPayments(runId, IERC7984(PAYROLL_TOKEN), from, recipients, encryptedAmounts, inputProofs);
        if (successCount == 0) revert NoSuccessfulPayments();

        nonces[from] = nonce + 1;
        executedRunId[runId] = true;

        emit PayrollRunExecuted(runId, from, PAYROLL_TOKEN, recipients.length);
    }

    function _validateExecutionInputs(
        bytes32 runId,
        address token,
        address from,
        address[] calldata recipients,
        externalEuint64[] calldata encryptedAmounts,
        bytes[] calldata inputProofs,
        uint48 validUntil,
        uint256 nonce
    ) private view {
        _validateAuthorizationAndTiming(runId, token, from, validUntil);
        _validateBatchShape(recipients, encryptedAmounts, inputProofs);
        _validateNonce(from, nonce);
    }

    function _validateAuthorizationAndTiming(
        bytes32 runId,
        address token,
        address from,
        uint48 validUntil
    ) private view {
        if (msg.sender != from) revert UnauthorizedSubmitter(msg.sender, from);
        if (token != PAYROLL_TOKEN) revert UnexpectedToken(token, PAYROLL_TOKEN);
        if (from == address(0)) revert InvalidSourceAccount();
        if (block.timestamp > validUntil) revert RunExpired(validUntil);
        if (executedRunId[runId]) revert RunAlreadyExecuted(runId);
    }

    function _validateBatchShape(
        address[] calldata recipients,
        externalEuint64[] calldata encryptedAmounts,
        bytes[] calldata inputProofs
    ) private pure {
        if (recipients.length == 0) revert EmptyBatch();
        if (recipients.length > MAX_BATCH_SIZE) revert BatchTooLarge(recipients.length, MAX_BATCH_SIZE);
        if (recipients.length != encryptedAmounts.length || recipients.length != inputProofs.length) {
            revert InvalidArrayLengths();
        }
        for (uint256 i = 0; i < recipients.length; ++i) {
            if (recipients[i] == address(0)) revert InvalidRecipient(i);
        }
    }

    function _validateNonce(address from, uint256 nonce) private view {
        if (nonce != nonces[from]) revert InvalidNonce(nonces[from], nonce);
    }

    function _processPayments(
        bytes32 runId,
        IERC7984 payrollToken,
        address from,
        address[] calldata recipients,
        externalEuint64[] calldata encryptedAmounts,
        bytes[] calldata inputProofs
    ) private returns (uint256 successCount) {
        for (uint256 i = 0; i < recipients.length; ++i) {
            if (inputProofs[i].length == 0) revert EmptyInputProof(i);

            bool success;
            // Delegate proof verification to the token via IERC7984 external input overload.
            try payrollToken.confidentialTransferFrom(from, recipients[i], encryptedAmounts[i], inputProofs[i]) {
                success = true;
                ++successCount;
            } catch {
                success = false;
            }

            emit PayrollPaymentProcessed(runId, i, recipients[i], success);
        }
    }
}
