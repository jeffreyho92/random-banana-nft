const { frontEndContractsFile, frontEndAbiFile } = require("../helper-hardhat.config")
const fs = require("fs")
const { network } = require("hardhat")

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Writing to front end...")
        await updateContractAddresses()
        await updateAbi()
        console.log("Front end written!")
    }
}

async function updateAbi() {
    // const randomBananaNFT = await ethers.getContract("RandomBananaNFT")
    // const abi = randomBananaNFT.interface.format(ethers.utils.FormatTypes.json);
    const file = fs.readFileSync(
        "./artifacts/contracts/RandomBananaNFT.sol/RandomBananaNFT.json",
        "utf8"
    )
    const json = JSON.parse(file)
    const abi = JSON.stringify(json.abi)
    fs.writeFileSync(frontEndAbiFile, abi)
}

async function updateContractAddresses() {
    const randomBananaNFT = await ethers.getContract("RandomBananaNFT")
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    contractAddresses[network.config.chainId.toString()] = [randomBananaNFT.address]
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}
module.exports.tags = ["frontend"]
