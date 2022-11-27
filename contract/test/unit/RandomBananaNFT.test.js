const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { parseEther } = require("ethers/lib/utils")
const { developmentChains, networkConfig } = require("../../helper-hardhat.config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RandomBananaNFT Unit Tests", function () {
          let randomBananaNFTContract, vrfCoordinatorV2Mock, subscriptionId, player // , deployer

          beforeEach(async () => {
              accounts = await ethers.getSigners() // could also do with getNamedAccounts
              deployer = accounts[0]
              player = accounts[1]
              await deployments.fixture(["mocks", "randomBananaNFT"]) // Deploys modules with the tags "mocks" and "randomBananaNFT"
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock") // Returns a new connection to the VRFCoordinatorV2Mock contract
              randomBananaNFTContract = await ethers.getContract("RandomBananaNFT") // Returns a new connection to the contract
          })

          describe("mint", function () {
              it("should mint new NFT", async () => {
                  var currentTokenId = await randomBananaNFTContract.callStatic.getCurrentTokenId()
                  const requestId = await randomBananaNFTContract.callStatic.mint()
                  console.log("requestId", requestId)
                  await expect(randomBananaNFTContract.connect(player).mint())
                      .to.emit(randomBananaNFTContract, `RandomnessRequested`)
                      .withArgs(requestId)

                  await vrfCoordinatorV2Mock.fulfillRandomWords(
                      requestId,
                      randomBananaNFTContract.address
                  )

                  currentTokenId = await randomBananaNFTContract.callStatic.getCurrentTokenId()
                  var getRequestToSender =
                      await randomBananaNFTContract.callStatic.getRequestToSender(1)

                  const playerBalance = await randomBananaNFTContract.callStatic.balanceOf(
                      player.address
                  )
                  expect(playerBalance).to.equal(ethers.constants.One)

                  const ownedTokens = await randomBananaNFTContract.callStatic.getListByOwner(
                      player.address
                  )
                  console.log("player.address", player.address)
                  console.log("playerBalance", playerBalance)
                  console.log("ownedTokens", ownedTokens)
                  expect(ownedTokens).to.have.length(1)

                  const tokenURI = await randomBananaNFTContract.callStatic.tokenURI(0)
                  console.log("tokenURI", tokenURI)
              })
          })
      })
