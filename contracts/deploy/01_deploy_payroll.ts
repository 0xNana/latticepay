import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedUnderlying = await deploy("MockUSDC", {
    from: deployer,
    log: true,
  });

  const deployedMockToken = await deploy("ConfidentialPayrollToken", {
    from: deployer,
    args: [deployedUnderlying.address],
    log: true,
  });

  const deployedPayrollExecutor = await deploy("PayrollExecutor", {
    from: deployer,
    args: [deployedMockToken.address],
    log: true,
  });

  console.log("MockUSDC contract:", deployedUnderlying.address);
  console.log("ConfidentialPayrollToken (ERC-7984 wrapper) contract:", deployedMockToken.address);
  console.log("PayrollExecutor contract:", deployedPayrollExecutor.address);
};

export default func;
func.id = "deploy_payroll_stack";
func.tags = ["Payroll"];
