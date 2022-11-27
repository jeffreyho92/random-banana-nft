# Random Banana NFT
### Random Banana NFT Powered by Chainlink VRF

## Contract

```bash
yarn install

npx hardhat test test/unit/RandomBananaNFT.test.js

npx hardhat deploy --tags randomBananaNFT --network matic
# or
npx hardhat deploy --tags randomBananaNFT --network goerli

#build frontend
npx hardhat deploy --tags mocks,randomBananaNFT,frontend

# start local blockchain node
npx hardhat node
npx hardhat deploy --tags mocks,randomBananaNFT,frontend --network localhost

# mock VRF
npx hardhat run scripts/mockOffchain.js --network localhost
```

## Frontend

```bash
yarn install

yarn dev
```