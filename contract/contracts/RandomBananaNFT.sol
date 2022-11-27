// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract RandomBananaNFT is ERC721URIStorage, VRFConsumerBaseV2 {
    using Counters for Counters.Counter;
    Counters.Counter private tokenIds;

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 3;

    mapping(uint256 => address) requestToSender;
    mapping(address => uint256[]) internal ownedTokens;

    event RandomnessRequested(uint256 indexed requestId);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("RandomBananaNFT", "RBN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
    }

    function mint() public returns (uint256 requestId) {
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        requestToSender[requestId] = msg.sender;

        emit RandomnessRequested(requestId);
    }

    function pickRandomColor(
        uint256 firstRandomNumber,
        uint256 secondRandomNumber,
        uint256 thirdRandomNumber
    ) internal pure returns (string[2] memory color) {
        uint256 r = firstRandomNumber % 256;
        uint256 g = secondRandomNumber % 256;
        uint256 b = thirdRandomNumber % 256;

        color = [
            string(
                abi.encodePacked(
                    "rgb(",
                    Strings.toString(r + 50),
                    ", ",
                    Strings.toString(g + 50),
                    ", ",
                    Strings.toString(b + 50),
                    ")"
                )
            ),
            string(
                abi.encodePacked(
                    "rgb(",
                    Strings.toString(r),
                    ", ",
                    Strings.toString(g),
                    ", ",
                    Strings.toString(b),
                    ")"
                )
            )
        ];
    }

    function createOnChainSvg(string[2] memory color) internal pure returns (string memory svg) {
        string
            memory baseSvg1 = "<svg xmlns='http://www.w3.org/2000/svg' width='150' height='169'><path d='M46.875 168H18.75v-18.668H0v-18.664h18.75V112h37.5V93.332H75V74.668h18.75V37.332h18.75V0h18.75v37.332H150v56h-18.75v37.336H112.5v18.664H75V168zm0 0' fill='";
        string
            memory baseSvg2 = "'/><path d='M46.875 168H18.75v-18.668H0v-18.664h18.75V112h37.5V93.332H75V74.668h18.75V37.332h18.75V0h18.75v37.332H150v56h-18.75v37.336H112.5v18.664H75V168zm0-18.668H75v-18.664h37.5V93.332h18.75v-56H112.5v37.336H93.75v18.664H75V112H56.25v18.668h-37.5v18.664zm0 0' fill='";
        string memory baseSvg3 = "'/></svg>";
        svg = string(abi.encodePacked(baseSvg1, color[0], baseSvg2, color[1], baseSvg3));
    }

    function createTokenUri(
        string memory svg,
        string[2] memory color,
        uint256 tokenId
    ) internal pure returns (string memory tokenUri) {
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "RandomBananaNFT #',
                        Strings.toString(tokenId),
                        '","attributes":[{"trait_type":"Color1","value":"',
                        color[0],
                        '"},{"trait_type":"Color2","value":"',
                        color[1],
                        '"}],"description": "Random Banana NFT Powered by Chainlink VRF", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '"}'
                    )
                )
            )
        );

        tokenUri = string(abi.encodePacked("data:application/json;base64,", json));
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 tokenId = tokenIds.current();
        tokenIds.increment();

        string[2] memory color = pickRandomColor(randomWords[0], randomWords[1], randomWords[2]);
        string memory svg = createOnChainSvg(color);
        string memory tokenUri = createTokenUri(svg, color, tokenId);
        address sender = requestToSender[requestId];

        ownedTokens[sender].push(tokenId);
        _safeMint(sender, tokenId);
        _setTokenURI(tokenId, tokenUri);
    }

    function getCurrentTokenId() public view returns (uint256) {
        return tokenIds.current();
    }

    function getRequestToSender(uint256 requestId) public view returns (address) {
        return requestToSender[requestId];
    }
  
    function getListByOwner(address owner) public view returns (uint256[] memory) {
        return ownedTokens[owner];
    }
}
