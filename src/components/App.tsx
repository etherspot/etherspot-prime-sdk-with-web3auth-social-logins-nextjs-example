'use client';

import React from 'react';
import styled from 'styled-components';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { CHAIN_NAMESPACES, WALLET_ADAPTERS } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Oval } from 'react-loader-spinner';
import { LOGIN_PROVIDER } from '@toruslabs/base-controllers';
import { PrimeSdk, Web3WalletProvider } from '@etherspot/prime-sdk';

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


const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x13881",
  rpcTarget: "https://rpc.ankr.com/polygon_mumbai",
  displayName: "Polygon Mumbai Testnet",
  blockExplorer: "https://mumbai.polygonscan.com/",
  ticker: "MATIC",
  tickerName: "Matic",
};


const web3auth = new Web3AuthNoModal({
  clientId: "BEglQSgt4cUWcj6SKRdu5QkOXTsePmMcusG5EAoyjyOYKlVRjIF1iCNnMOTfpzCiunHRrMui8TIwQPXdkQ8Yxuk",
  chainConfig,
  web3AuthNetwork: "testnet",
});

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const openloginAdapter = new OpenloginAdapter({
  adapterSettings: {
    whiteLabel: {
      appName: "Etherspot Test",
      appUrl: "https://web3auth.io",
      logoLight: "vercel.svg",
      logoDark: "vercel.svg",
      defaultLanguage: "en", // en, de, ja, ko, zh, es, fr, pt, nl
      mode: "auto", // whether to enable dark mode. defaultValue: false
      theme: {
          primary: "#768729",
      },
      useLogoLoader: false,
  },
    mfaSettings: {
      deviceShareFactor: {
        enable: true,
        priority: 1,
        mandatory: true,
      },
      backUpShareFactor: {
        enable: true,
        priority: 2,
        mandatory: false,
      },
      socialBackupFactor: {
        enable: true,
        priority: 3,
        mandatory: false,
      },
      passwordFactor: {
        enable: true,
        priority: 4,
        mandatory: false,
      },
    },
  },
  loginSettings: {
    mfaLevel: "mandatory",
  },
  privateKeyProvider,
});

web3auth.configureAdapter(openloginAdapter);




const App = () => {
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [walletAddress, setWalletAddress] = React.useState('');

  // TODO fix logout
  const logout = async () => {
    setWalletAddress('');
    try {
      web3auth.clearCache();
      await web3auth.logout({ cleanup: true });
    } catch (e) {
      //
    }
  }

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
      chainId: 80001,
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
