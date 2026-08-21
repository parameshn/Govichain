import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { account, chainInfo, connectWallet, disconnectWallet, isWalletAvailable } = useWallet();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(disconnectWallet);
    navigate('/', { replace: true });
  };

  const getRoleBadge = (role) => {
    const badges = {
      GOVERNMENT: 'badge-info',
      CONTRACTOR: 'badge-warning',
      AUDITOR: 'badge-success',
    };
    return badges[role] || 'badge-info';
  };

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
          <h2>GOVI-CHAIN</h2>
          <span className="navbar-subtitle">Transparent Governance System</span>
        </div>

        {user && (
          <div className="navbar-actions">
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              <span className={`badge ${getRoleBadge(user.role)}`}>
                {user.role}
              </span>
            </div>
            {isWalletAvailable ? (
              account ? (
                <div className="wallet-chip">
                  <span className="wallet-label">Wallet</span>
                  <strong>{account.slice(0, 6)}...{account.slice(-4)}</strong>
                  {chainInfo?.networkName && (
                    <span className="wallet-network">{chainInfo.networkName}</span>
                  )}
                </div>
              ) : (
                <button onClick={connectWallet} className="btn btn-wallet">
                  Connect Wallet
                </button>
              )
            ) : (
              <span className="wallet-missing">Wallet unavailable</span>
            )}
            <button onClick={handleLogout} className="btn btn-outline">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
