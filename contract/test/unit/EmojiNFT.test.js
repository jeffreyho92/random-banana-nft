const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { parseEther } = require("ethers/lib/utils")
const { developmentChains, networkConfig } = require("../../helper-hardhat.config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("EmojiNFT Unit Tests", function () {
          let emojiNFTContract, vrfCoordinatorV2Mock, subscriptionId, player // , deployer

          beforeEach(async () => {
              accounts = await ethers.getSigners() // could also do with getNamedAccounts
              deployer = accounts[0]
              player = accounts[1]
              await deployments.fixture(["mocks", "emojiNFT"]) // Deploys modules with the tags "mocks" and "emojiNFT"
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock") // Returns a new connection to the VRFCoordinatorV2Mock contract
              emojiNFTContract = await ethers.getContract("EmojiNFT") // Returns a new connection to the contract
          })

          describe("mint", function () {
              it("should mint new NFT", async () => {
                  //   var currentTokenId = await emojiNFTContract.callStatic.getCurrentTokenId()
                  const requestId = await emojiNFTContract.callStatic.mint()

                  await expect(emojiNFTContract.connect(player).mint())
                      .to.emit(emojiNFTContract, `RandomnessRequested`)
                      .withArgs(requestId)

                  await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, emojiNFTContract.address)

                  //   currentTokenId = await emojiNFTContract.callStatic.getCurrentTokenId()
                  //   var getRequestToSender = await emojiNFTContract.callStatic.getRequestToSender(1)

                  const playerBalance = await emojiNFTContract.callStatic.balanceOf(player.address)
                  expect(playerBalance).to.equal(ethers.constants.One)

                  const tokenURI = await emojiNFTContract.callStatic.tokenURI(0)
                  console.log("tokenURI", tokenURI)
              })
          })
      })
