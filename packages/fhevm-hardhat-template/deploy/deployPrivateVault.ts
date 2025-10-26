import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { postDeploy } from "postdeploy";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const chainId = await hre.getChainId();
  const chainName = hre.network.name;

  console.log(`Deploying to ${chainName} (chainId: ${chainId})`);

  // Deploy PrivateVault (no constructor args - uses SepoliaConfig)
  const vaultContract = await deploy("PrivateVault", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log(`PrivateVault deployed at: ${vaultContract.address}`);

  // Generate ABI files for frontend
  postDeploy(chainName, "PrivateVault");

  console.log("\n=== Deployment Summary ===");
  console.log(`Network: ${chainName}`);
  console.log(`ChainId: ${chainId}`);
  console.log(`PrivateVault: ${vaultContract.address}`);
};

export default func;

func.id = "deploy_privateVault";
func.tags = ["PrivateVault"];
