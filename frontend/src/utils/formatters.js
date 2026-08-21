export const formatCurrency = (amount) => {
  const numeric = Number(amount ?? 0);
  const rounded = Number.isFinite(numeric) ? Math.round(numeric) : 0;
  return `Rs. ${rounded.toLocaleString('en-IN')}`;
};

export const formatCompactCurrency = (amount) => {
  const numeric = Number(amount ?? 0);
  if (!Number.isFinite(numeric)) {
    return 'Rs 0';
  }

  const absolute = Math.abs(numeric);
  const sign = numeric < 0 ? '-' : '';
  const formatValue = (value) => {
    const fixed = value >= 100 ? value.toFixed(0) : value.toFixed(2);
    return fixed.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  };

  if (absolute >= 10000000) {
    return `${sign}Rs ${formatValue(absolute / 10000000)} cr`;
  }
  if (absolute >= 100000) {
    return `${sign}Rs ${formatValue(absolute / 100000)} L`;
  }
  if (absolute >= 1000) {
    return `${sign}Rs ${formatValue(absolute / 1000)} K`;
  }

  return `${sign}Rs ${Math.round(absolute).toLocaleString('en-IN')}`;
};

const DEMO_INR_PER_ETH = Number(process.env.REACT_APP_DEMO_INR_PER_ETH || 5000000);

export const formatEthEstimateFromInr = (amount) => {
  const numeric = Number(amount ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0 || !Number.isFinite(DEMO_INR_PER_ETH) || DEMO_INR_PER_ETH <= 0) {
    return '--';
  }

  const ethValue = numeric / DEMO_INR_PER_ETH;
  const formatted = ethValue >= 1 ? ethValue.toFixed(4) : ethValue.toFixed(6);
  return `~${formatted} ETH`;
};

export const getEthEstimateLabel = () => {
  if (!Number.isFinite(DEMO_INR_PER_ETH) || DEMO_INR_PER_ETH <= 0) {
    return 'Demo estimate unavailable';
  }

  return `Demo reference: 1 ETH ~= Rs. ${Math.round(DEMO_INR_PER_ETH).toLocaleString('en-IN')}`;
};

export const parseRuleList = (rules) => {
  if (!rules) return [];

  return rules
    .split('\n')
    .map((rule) => rule.trim())
    .map((rule) => rule.replace(/^[-*]\s+/, '').trim())
    .map((rule) => rule.replace(/^\d+[.)]\s+/, '').trim())
    .filter(Boolean);
};

export const shortenHash = (hash, start = 6, end = 4) => {
  if (!hash) return '--';
  if (hash.length <= start + end + 3) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

export const getExplorerUrl = (hash, chainId, type = 'tx') => {
  if (!hash || !chainId) return null;

  const baseUrls = {
    11155111: 'https://sepolia.etherscan.io',
    1: 'https://etherscan.io',
  };

  const baseUrl = baseUrls[chainId];
  if (!baseUrl) return null;

  return `${baseUrl}/${type}/${hash}`;
};

export const getChainLabel = (networkName, chainId) => {
  if (networkName === 'localhost' || chainId === 31337) {
    return 'Local chain';
  }
  if (networkName === 'sepolia' || chainId === 11155111) {
    return 'Sepolia';
  }
  if (networkName === 'homestead' || chainId === 1) {
    return 'Ethereum';
  }
  if (networkName) {
    return networkName;
  }
  return chainId ? `Chain ${chainId}` : 'On-chain';
};
