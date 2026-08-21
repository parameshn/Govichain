import React, { createContext, useContext, useEffect, useState } from 'react';
import { getChainInfo, getIsContractConfigured, initWeb3 } from '../services/web3Service';

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainInfo, setChainInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncWalletState = async (requestAccess = false) => {
    if (!window.ethereum) {
      setAccount(null);
      setChainInfo(null);
      setLoading(false);
      return false;
    }

    try {
      const method = requestAccess ? 'eth_requestAccounts' : 'eth_accounts';
      const accounts = await window.ethereum.request({ method });
      const activeAccount = accounts?.[0] || null;
      setAccount(activeAccount);

      if (activeAccount) {
        await initWeb3();
        setChainInfo(await getChainInfo());
      } else {
        setChainInfo(null);
      }

      return Boolean(activeAccount);
    } catch (error) {
      console.error('Wallet sync failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => syncWalletState(true);

  const disconnectWallet = () => {
    setAccount(null);
    setChainInfo(null);
  };

  useEffect(() => {
    syncWalletState(false);

    if (!window.ethereum) {
      return undefined;
    }

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts?.[0] || null);
    };

    const handleChainChanged = () => {
      syncWalletState(false);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        account,
        chainInfo,
        connectWallet,
        disconnectWallet,
        loading,
        isWalletAvailable: Boolean(window.ethereum),
        isContractConfigured: getIsContractConfigured(),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
