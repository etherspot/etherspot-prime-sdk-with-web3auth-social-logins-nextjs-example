'use client';

import React from 'react';
import styled from 'styled-components';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { CHAIN_NAMESPACES, WALLET_ADAPTERS } from '@web3auth/base';
import { Oval } from 'react-loader-spinner';
import { LOGIN_PROVIDER } from '@toruslabs/base-controllers';
import { PrimeSdk, Web3WalletProvider } from '@etherspot/prime-sdk';
import { ethers } from 'ethers';

const Wrapper = styled.form`
  display: block;
  width: 550px;
  margin: 0 auto 80px;
  padding: 25px;
  position: relative;
  border-radius: 6px;
  background: rgba(255,255,255,0.05);
`;

const ConnectButton = styled.div`
  text-align: center;
  color: #fff;
  background: #cc29ff;
  cursor: pointer;
  border-radius: 10px;
  user-select: none;
  padding: 15px 20px;
  margin-bottom: 10px;

  &:hover {
    opacity: 0.6;
  }
`;

const LogoutButton = styled.span`
  color: #000;
  border: 1px solid #cc29ff;
  cursor: pointer;
  border-radius: 10px;
  user-select: none;
  padding: 7px 15px;
  text-align: center;
  font-size: 12px;
  display: inline-block;
  margin-top: 25px;
  
  &:hover {
    opacity: 0.6;
  }
`;

const ConnectedWalletTitle = styled.p`
  text-align: center;
`;

const ConnectedWallet = styled.p`
  color: #000;
  font-size: 20px;
  text-align: center;
`;

const ConnectedWalletText = styled.p`
  color: #000;
  font-size: 16px;
  text-align: center;
  margin-bottom: 10px;
  word-break: break-all;
`;

const ErrorMessage = styled.p`
  color: #ff0000;
  font-size: 14px;
  margin-top: 20px;
  text-align: center;
`;

const web3auth = new Web3AuthNoModal({
  chainConfig: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: process.env.NEXT_PUBLIC_WEB3AUTH_CHAIN_ID_HEX,
  },
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID as string,
});

const openloginAdapter = new OpenloginAdapter();

web3auth.configureAdapter(openloginAdapter);

const App = () => {
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [walletAddress, setWalletAddress] = React.useState('');

  const logout = async () => {
    setWalletAddress('');
    try {
      await web3auth.logout({ cleanup: true });
      web3auth.clearCache();
    } catch (e) {
      //
    }
  }

  console.log();

  const loginWithProvider = async (loginProvider: string) => {
    if (isConnecting) return;
    setIsConnecting(true);
    setErrorMessage('');
    setWalletAddress('');

    if ((web3auth.status !== 'connected')) {
      await web3auth.init();
    }

    let newErrorMessage;

    if ((web3auth.status !== 'connected')) {
      try {
        await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
          loginProvider,
          mfaLevel: 'none',
        });
      } catch (e) {
        // @ts-ignore
        newErrorMessage = e?.message;
      }
    }

    if (newErrorMessage) {
      setErrorMessage(newErrorMessage);
      setIsConnecting(false);
      return;
    }

    if (web3auth.status !== 'connected' || !web3auth.provider) {
      setErrorMessage('Something went wrong, please try again later.');
      setIsConnecting(false);
      return;
    }

    const mappedProvider = new Web3WalletProvider(web3auth.provider);
    await mappedProvider.refresh();

    // @ts-ignore
    const etherspotPrimeSdk = new PrimeSdk(mappedProvider, {
      chainId: ethers.BigNumber.from(process.env.NEXT_PUBLIC_WEB3AUTH_CHAIN_ID_HEX as string).toNumber()
    });
    const address = await etherspotPrimeSdk.getCounterFactualAddress();
    if (!address) {
      setErrorMessage('Something went wrong, please try again later.');
      setIsConnecting(false);
      return;
    }

    setWalletAddress(address);
    setIsConnecting(false);
  }

  return (
    <Wrapper>
      {walletAddress && (
        <ConnectedWallet>
          <ConnectedWalletTitle>
            Your address on Ethereum blockchain:
          </ConnectedWalletTitle>
          <ConnectedWalletText>
            <strong>{walletAddress}</strong>
          </ConnectedWalletText>
          <LogoutButton onClick={logout}>Logout</LogoutButton>
        </ConnectedWallet>
      )}
      {isConnecting && (
        <Oval
          height={30}
          width={30}
          color="#fff"
          secondaryColor="#cc29ff"
          strokeWidth={6}
          strokeWidthSecondary={6}
          wrapperStyle={{ display: 'flex', justifyContent: 'center' }}
        />
      )}
      {!isConnecting && !walletAddress && (
        <>
          <ConnectButton onClick={() => loginWithProvider(LOGIN_PROVIDER.GOOGLE)}>
            Login with Google
          </ConnectButton>
          <ConnectButton onClick={() => loginWithProvider(LOGIN_PROVIDER.LINKEDIN)}>
            Login with LinkedIn
          </ConnectButton>
          <ConnectButton onClick={() => loginWithProvider(LOGIN_PROVIDER.GITHUB)}>
            Login with GitHub
          </ConnectButton>
        </>
      )}
      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
    </Wrapper>
  )
}

export default App;
