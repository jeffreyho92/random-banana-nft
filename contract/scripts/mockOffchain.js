const { ethers, network } = require("hardhat")

async function mockKeepers() {
    const contract = await ethers.getContract("RandomBananaNFT")
    const tx = await contract.mint()
    const txReceipt = await tx.wait(1)
    const requestId = txReceipt.events[1].args.requestId
    // const requestId = 1
    console.log(`Performed upkeep with RequestId: ${requestId}`)
    if (network.config.chainId == 31337) {
        await mockVrf(requestId, contract)
    }
    var getRequestToSender = await contract.getRequestToSender(requestId)
    console.log("getRequestToSender", getRequestToSender)
    const tx2 = await contract.getListByOwner(getRequestToSender)
    console.log("getListByOwner", tx2)
    const tx3 = await contract.getCurrentTokenId()
    console.log("getCurrentTokenId", tx3)

    //localhost is not working, _setTokenURI no response because SVG too big
}

async function mockVrf(requestId, contract) {
    console.log("We on a local network? Ok let's pretend...")
    const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
    await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, contract.address)
    console.log("Responded!")
}

mockKeepers()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
