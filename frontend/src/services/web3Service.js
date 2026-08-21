import { ethers } from 'ethers';
import govChainAbi from '../config/govChainAbi.json';
import contractAddressConfig from '../config/contractAddress.json';

const CONTRACT_ADDRESS = contractAddressConfig.contractAddress || '';

let provider;
let signer;
let contract;

const ensureWalletAvailable = () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not available in this browser.');
  }
};

const ensureContractConfigured = () => {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address is not configured yet.');
  }
};

const toNumber = (value) => {
  if (value == null) return null;
  return Number(value.toString());
};

const toStringValue = (value) => {
  if (value == null) return null;
  return value.toString();
};

const getReceiptHash = (receipt) => receipt?.hash || receipt?.transactionHash || '';

const parseEventArgs = (receipt, eventName) => {
  if (!receipt?.logs || !contract) {
    return null;
  }

  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === eventName) {
        return parsed.args;
      }
    } catch (error) {
      continue;
    }
  }

  return null;
};

export const getIsContractConfigured = () => Boolean(CONTRACT_ADDRESS);

export const getContractAddress = () => CONTRACT_ADDRESS;

export const initWeb3 = async () => {
  ensureWalletAvailable();
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  contract = CONTRACT_ADDRESS
    ? new ethers.Contract(CONTRACT_ADDRESS, govChainAbi, signer)
    : null;
  return { provider, signer, contract };
};

const ensureContract = async () => {
  ensureContractConfigured();
  if (!provider || !signer || !contract) {
    await initWeb3();
  }
  return contract;
};

export const getSignerAddress = async () => {
  if (!signer) {
    await initWeb3();
  }
  return await signer.getAddress();
};

export const getChainInfo = async () => {
  if (!provider) {
    await initWeb3();
  }
  const network = await provider.getNetwork();
  return {
    chainId: toNumber(network.chainId),
    networkName: network.name || 'unknown',
  };
};

const createCommonChainMeta = async (receipt) => {
  const chainInfo = await getChainInfo();
  return {
    walletAddress: await getSignerAddress(),
    contractAddress: CONTRACT_ADDRESS,
    chainId: chainInfo.chainId,
    chainNetwork: chainInfo.networkName,
    txHash: getReceiptHash(receipt),
  };
};

export const createProjectOnChain = async (name, budgetRupees) => {
  const activeContract = await ensureContract();
  const roundedBudget = Math.round(budgetRupees);
  const escrowWei = await activeContract.quoteProjectEscrowWei(roundedBudget);
  const tx = await activeContract.createProject(name, roundedBudget, {
    value: escrowWei,
  });
  const receipt = await tx.wait();
  const args = parseEventArgs(receipt, 'ProjectRecorded');
  const meta = await createCommonChainMeta(receipt);

  return {
    ...meta,
    chainProjectId: toNumber(args?.projectId),
    escrowWei: toStringValue(args?.escrowWei ?? escrowWei),
  };
};

export const submitMilestoneOnChain = async (
  projectId,
  title,
  descriptionHash,
  requestedAmount,
  aiScore
) => {
  const activeContract = await ensureContract();
  const roundedRequestedAmount = Math.round(requestedAmount);
  const payoutWeiQuote = await activeContract.quoteMilestonePayoutWei(roundedRequestedAmount);
  const tx = await activeContract.submitMilestone(
    Number(projectId),
    title,
    descriptionHash,
    roundedRequestedAmount,
    Math.max(0, Math.min(100, Math.round(aiScore || 0)))
  );
  const receipt = await tx.wait();
  const args = parseEventArgs(receipt, 'MilestoneRecorded');
  const meta = await createCommonChainMeta(receipt);

  return {
    ...meta,
    chainProjectId: toNumber(args?.projectId) ?? Number(projectId),
    chainMilestoneId: toNumber(args?.milestoneId),
    payoutWeiQuote: toStringValue(args?.payoutWeiQuote ?? payoutWeiQuote),
  };
};

const executeMilestoneReviewAction = async (methodName, eventName, milestoneId) => {
  const activeContract = await ensureContract();
  const tx = await activeContract[methodName](Number(milestoneId));
  const receipt = await tx.wait();
  const meta = await createCommonChainMeta(receipt);
  const args = parseEventArgs(receipt, eventName);

  return {
    ...meta,
    chainMilestoneId: Number(milestoneId),
    payoutWei: toStringValue(args?.payoutWei),
  };
};

export const approveMilestoneOnChain = async (milestoneId) =>
  executeMilestoneReviewAction('approveMilestone', 'MilestoneApproved', milestoneId);

export const flagMilestoneOnChain = async (milestoneId) =>
  executeMilestoneReviewAction('flagMilestone', 'MilestoneFlagged', milestoneId);

export const rejectMilestoneOnChain = async (milestoneId) =>
  executeMilestoneReviewAction('rejectMilestone', 'MilestoneRejected', milestoneId);
