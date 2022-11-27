import React, { useState, useEffect } from 'react';
import Web3 from "web3";
import { contractAddresses, abi } from "../constants"

// import styles from '../styles/Home.module.css'

// Constants
// const CONTRACT_ADDRESS = "0xaC9A3AfFC4D0D797f965FB1412788CCff48b3f7F";
const OPENSEA_COLLECTION = 'https://testnets.opensea.io/collection/randombanananft-v3';

export default function Home() {
  const [contract, setContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState("");
  const [openseaLink, setOpenseaLink] = useState("");
  const [loadingMint, setLoadingMint] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [mintedLink, setMintedLink] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [arrInventory, setArrInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  
  useEffect(async () => {
    if(window.ethereum){
      let w3 = new Web3(window.ethereum);
      let chainId = await w3.eth.getChainId();
      let contractAdd = chainId in contractAddresses ? contractAddresses[chainId][0] : null;
      // console.log('chainId', chainId)
      // console.log('contractAdd', contractAdd)
      setOpenseaLink(`https://testnets.opensea.io/assets/mumbai/${contractAdd}/`);

      let c = new w3.eth.Contract(abi, contractAdd);
      setContract(c);
      checkIfWalletIsConnected();
      
      window.ethereum.on('accountsChanged', function (accounts) {
        window.location.reload();
      });
      window.ethereum.on('networkChanged', function (accounts) {
        window.location.reload();
      });
    }else{
      console.log("Please install MetaMask")
    }
  }, [])
  
  useEffect(() => {
    getListByOwner();
  }, [currentAccount])
  
  useEffect(() => {
    setupEventListener();
  }, [contract])

  
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    }

    ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      const account = accounts[0];
      if(account){
        console.log("Connected", account);
        setCurrentAccount(account); 
      }
    }).catch((err) => console.log(err));
  }
  
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      
      ethereum.request({ method: "eth_requestAccounts" }).then((accounts) => {
        window.location.reload();
      }).catch((err) => console.log(err));
    } catch (error) {
      console.log(error);
    }
  }

  const setupEventListener = async () => {
    try {
      if(!contract) return; 
      
      contract.events.Transfer({}, function(error, event){ 
        if(event && event.returnValues){
          var returnValues = event.returnValues;
          var from = returnValues.sender
          var tokenId = returnValues.tokenId;
          
          console.log(from, tokenId)
          let url = `${openseaLink}${tokenId}`;
          setMintedLink(url);
  
          setLoadingMint(false);
          setLoadingMsg("");
          
          getListByOwner(from);
        }
      });
    } catch (error) {
      console.log(error)
    }
  }
  
  const askContractToMintNft = async () => {
    try {
      setMintedLink("");
      setLoadingMint(true);
      
      console.log("Going to pop wallet now to pay gas...")
      contract.methods.mint().send({from: currentAccount})
      .on('transactionHash', function(hash){
        // console.log("transactionHash: "+transactionHash);
        setLoadingMsg("Mining... please wait.")
      })
      // .on('receipt', function(receipt){
      //    console.log('receipt', receipt)
      // })
      .on('error', function(error){
        setLoadingMint(false);
        console.log(error)
      })
      .then(function(result){
        console.log(result)
      });
    } catch (error) {
      setLoadingMint(false);
      console.log(error)
    }
  }
  
  const getListByOwner = async (account) => {
    account = account || currentAccount;
    try {
      if (contract && account) {
        setLoadingInventory(true);
        setArrInventory([]);
        var list = await contract.methods.getListByOwner(account).call();
        console.log('list', list)
        if(list && list.length > 0){
          var arr = [];
          for (let i = 0; i < list.length; i++) {
            if(list[i]){
              var tokenId = list[i];
      
              var uri = await contract.methods.tokenURI(tokenId).call();
              if(uri){
                uri = JSON.parse(atob(uri.substring(29)));
                arr.push({
                  id: tokenId,
                  image: uri.image,
                });
              }
            }
          }
          setArrInventory(arr);
        }
        setLoadingInventory(false);
      }
    } catch (error) {
      console.log(error)
    }
  }

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>
      Connect to Wallet
    </button>
  );
  
  return (
    // <div className={styles.container}>
    <div className="App">
      <div className="container">
        <div style={{position: 'absolute', right: '1em', top: '2.5em'}}>
          {
            currentAccount &&
            <span>
              (
              {
                currentAccount.substring(0, 6) + 
                '....' + 
                currentAccount.substring(currentAccount.length - 4)
              }
              )
            </span>
          }
          <span className="network-text">Mumbai</span>
        </div>
        <div className="header-container">
          <p className="header gradient-text">Random Banana NFT</p>
          <br/>
          <a href={OPENSEA_COLLECTION} target="_blank">
            <div style={{margin: '5em 4em'}}>
              <img src='/RandomBananaNFT.svg' />
            </div>
          </a>
          <p className="sub-text">
            Each random. Each fun. Discover your NFT today.
          </p>
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : 
            loadingMint ? (
            <div style={{marginLeft: '48%'}}>
              <div className="loader"></div>
            </div>
          ) 
            :
            <>
              <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
                Mint NFT
              </button>
              &emsp;&emsp;&emsp;
              <button onClick={()=>setModalVisible(true)} className="cta-button connect-wallet-button">
              Inventory
              </button>
            </>
          }
          {
            loadingMsg &&
            <p>{loadingMsg}</p>
          }
        </div>
        {
          mintedLink &&
          <p style={{width: '70%'}}>
            Congratulation! You've minted your NFT into your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: 
            {" "}
            <a 
              href={mintedLink}
              target="_blank"
            >
              {mintedLink}
            </a>
          </p>
        }
        <div className="footer-container">
          <span className="footer-text">
            build by 0xJeffrey
          </span>
        </div>
      </div>
      
      {
        modalVisible &&
        <div id="myModal" className="modal">
          <div className="modal-content">
            <span className="close" onClick={()=>setModalVisible(false)}>
              &times;
            </span>
            <div>
              <p className="header gradient-text" style={{fontSize: '2em', marginBottom: '1em'}}>
                Inventory
              </p>
              <br/>
              {
                loadingInventory &&
                <div style={{marginLeft: '48%'}}>
                  <div className="loader"></div>
                </div>
              }
              {
                !loadingInventory && arrInventory.length == 0 &&
                <p>Go mint your FREE NFT now!</p>
              }
              <div style={{display: 'flex', justifyContent: 'space-around', flexDirection: 'row', flexWrap: 'wrap'}}>
                {
                  arrInventory.map((item, index)=>{
                    return (
                      <div key={index} style={{marginBottom: '3em'}}>
                        <a 
                          href={`${openseaLink}${item.id}`}
                          target="_blank"
                        >
                          <img src={item.image} style={{width: '10em', margin: '0 5em'}} />
                          <br/>
                          RandomBananaNFT #{item.id}
                        </a>
                      </div>
                    )
                  })
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  )
}
