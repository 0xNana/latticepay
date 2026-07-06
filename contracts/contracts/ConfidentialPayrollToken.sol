// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {
    ERC7984ERC20Wrapper
} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";
import {
    ERC7984ObserverAccess
} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ObserverAccess.sol";

contract ConfidentialPayrollToken is ZamaEthereumConfig, ERC7984ERC20Wrapper, ERC7984ObserverAccess {
    constructor(IERC20 underlying_)
        ERC7984("Confidential Payroll USD", "cpUSD", "")
        ERC7984ERC20Wrapper(underlying_)
    {}

    function decimals() public view virtual override(ERC7984, ERC7984ERC20Wrapper) returns (uint8) {
        return ERC7984ERC20Wrapper.decimals();
    }

    function _update(
        address from,
        address to,
        euint64 amount
    ) internal virtual override(ERC7984ERC20Wrapper, ERC7984ObserverAccess) returns (euint64 transferred) {
        return super._update(from, to, amount);
    }
}
