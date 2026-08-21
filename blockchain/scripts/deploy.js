const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying GovChain with account:", deployer.address);

  const GovChain = await ethers.getContractFactory("GovChain");
  const govChain = await GovChain.deploy();
  await govChain.waitForDeployment();

  const contractAddress = await govChain.getAddress();
  console.log("GovChain deployed to:", contractAddress);

  const frontendConfigPath = path.join(__dirname, "../../frontend/src/config/contractAddress.json");
  const frontendAbiPath = path.join(__dirname, "../../frontend/src/config/govChainAbi.json");
  const artifactPath = path.join(__dirname, "../artifacts/contracts/GovChain.sol/GovChain.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  fs.mkdirSync(path.dirname(frontendConfigPath), { recursive: true });
  fs.writeFileSync(
    frontendConfigPath,
    JSON.stringify({ contractAddress }, null, 2)
  );
  console.log(`Contract address written to ${frontendConfigPath}`);

  fs.writeFileSync(frontendAbiPath, JSON.stringify(artifact.abi, null, 2));
  console.log(`Contract ABI written to ${frontendAbiPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
