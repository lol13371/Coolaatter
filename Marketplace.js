const seaport = "0x00000000006c3852cbEf3e08E8dF289169EdE581";

const orderType = {
    OrderComponents: [
        { name: "offerer", type: "address" },
        { name: "zone", type: "address" },
        { name: "offer", type: "OfferItem[]" },
        { name: "consideration", type: "ConsiderationItem[]" },
        { name: "orderType", type: "uint8" },
        { name: "startTime", type: "uint256" },
        { name: "endTime", type: "uint256" },
        { name: "zoneHash", type: "bytes32" },
        { name: "salt", type: "uint256" },
        { name: "conduitKey", type: "bytes32" },
        { name: "counter", type: "uint256" },
    ],
    OfferItem: [
        { name: "itemType", type: "uint8" },
        { name: "token", type: "address" },
        { name: "identifierOrCriteria", type: "uint256" },
        { name: "startAmount", type: "uint256" },
        { name: "endAmount", type: "uint256" },
    ],
    ConsiderationItem: [
        { name: "itemType", type: "uint8" },
        { name: "token", type: "address" },
        { name: "identifierOrCriteria", type: "uint256" },
        { name: "startAmount", type: "uint256" },
        { name: "endAmount", type: "uint256" },
        { name: "recipient", type: "address" },
    ],
};

export const calculateOrderHash = (orderComponents) => {
    const offerItemTypeString =
        "OfferItem(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount)";
    const considerationItemTypeString =
        "ConsiderationItem(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount,address recipient)";
    const orderComponentsPartialTypeString =
        "OrderComponents(address offerer,address zone,OfferItem[] offer,ConsiderationItem[] consideration,uint8 orderType,uint256 startTime,uint256 endTime,bytes32 zoneHash,uint256 salt,bytes32 conduitKey,uint256 counter)";
    const orderTypeString = `${orderComponentsPartialTypeString}${considerationItemTypeString}${offerItemTypeString}`;

    const offerItemTypeHash = keccak256(toUtf8Bytes(offerItemTypeString));
    const considerationItemTypeHash = keccak256(
        toUtf8Bytes(considerationItemTypeString)
    );
    const orderTypeHash = keccak256(toUtf8Bytes(orderTypeString));

    const offerHash = keccak256(
        "0x" +
        orderComponents.offer
            .map((offerItem) => {
                return keccak256(
                    "0x" +
                    [
                        offerItemTypeHash.slice(2),
                        offerItem.itemType.toString().padStart(64, "0"),
                        offerItem.token.slice(2).padStart(64, "0"),
                        toBN(offerItem.identifierOrCriteria)
                            .toHexString()
                            .slice(2)
                            .padStart(64, "0"),
                        toBN(offerItem.startAmount)
                            .toHexString()
                            .slice(2)
                            .padStart(64, "0"),
                        toBN(offerItem.endAmount)
                            .toHexString()
                            .slice(2)
                            .padStart(64, "0"),
                    ].join("")
                ).slice(2);
            })
            .join("")
    );

    const considerationHash = keccak256(
        "0x" +
        orderComponents.consideration
            .map((considerationItem) => {
                return keccak256(
                    "0x" +
                    [
                        considerationItemTypeHash.slice(2),
                        considerationItem.itemType.toString().padStart(64, "0"),
                        considerationItem.token.slice(2).padStart(64, "0"),
                        toBN(considerationItem.identifierOrCriteria)
                            .toHexString()
                            .slice(2)
                            .padStart(64, "0"),
                        toBN(considerationItem.startAmount)
                            .toHexString()
                            .slice(2)
                            .padStart(64, "0"),
                        toBN(considerationItem.endAmount)
                            .toHexString()
                            .slice(2)
                            .padStart(64, "0"),
                        considerationItem.recipient.slice(2).padStart(64, "0"),
                    ].join("")
                ).slice(2);
            })
            .join("")
    );

    const derivedOrderHash = keccak256(
        "0x" +
        [
            orderTypeHash.slice(2),
            orderComponents.offerer.slice(2).padStart(64, "0"),
            orderComponents.zone.slice(2).padStart(64, "0"),
            offerHash.slice(2),
            considerationHash.slice(2),
            orderComponents.orderType.toString().padStart(64, "0"),
            toBN(orderComponents.startTime)
                .toHexString()
                .slice(2)
                .padStart(64, "0"),
            toBN(orderComponents.endTime).toHexString().slice(2).padStart(64, "0"),
            orderComponents.zoneHash.slice(2),
            orderComponents.salt.slice(2).padStart(64, "0"),
            orderComponents.conduitKey.slice(2).padStart(64, "0"),
            toBN(orderComponents.counter).toHexString().slice(2).padStart(64, "0"),
        ].join("")
    );

    return derivedOrderHash;
};

function getSalt() {
    var saltRes = '';
    for (var i = 0; i < 13; i++) {
        var ran = parseInt(Math.random() * 1000);
        saltRes += ran.toString(10).padStart(3, '0');
    }
    return saltRes.replace(/^0+/, '');;
}

const getOrderHash = async (
    marketplaceContract,
    orderComponents
) => {

    const orderHash = await marketplaceContract.getOrderHash(orderComponents);
    const derivedOrderHash = calculateOrderHash(orderComponents);
    console.log(marketplaceContract.getOrderHash.toString());
    console.log(orderHash + " " + derivedOrderHash);
    // expect(orderHash).to.equal(derivedOrderHash);
    return orderHash;
};

export const signOrder = async (
    marketplaceContract,
    chainId,
    orderComponents,
    signer,
) => {
    // Required for EIP712 signing
    const domainData = {
        name: "Seaport",
        version: "1.1",
        chainId,
        verifyingContract: seaport,
    };

    console.log(orderComponents)
    const signature = await signer._signTypedData(
        domainData,
        orderType,
        orderComponents
    );

    // const {signature} = await this.signer._signTypedData({
    //     types: orderType,
    //     domain: domainData,
    //     primaryType: orderType,
    //     message: orderComponents,
    // });
    // console.log(signature);
    // console.log(signature1);
    const orderHash = await getOrderHash(marketplaceContract, orderComponents);

    const { domainSeparator } = await marketplaceContract.information();
    const digest = keccak256(
        `0x1901${domainSeparator.slice(2)}${orderHash.slice(2)}`
    );
    const recoveredAddress = recoverAddress(digest, signature);
    console.log(recoveredAddress);
    // expect(recoveredAddress).to.equal(signer.address);
    // 0x8ABd47DDE5dAd52aF2EADdc58e39D94E6254CcBE
    // 0x8ABd47DDE5dAd52aF2EADdc58e39D94E6254CcBE
    return signature;
};


export const convertSignatureToEIP2098 = (signature) => {
    if (signature.length === 130) {
        return signature;
    }

    if (signature.length !== 132) {
        throw Error("invalid signature length (must be 64 or 65 bytes)");
    }

    return splitSignature(signature).compact;
};

export const createOrder = async (
    marketplaceContract,
    chainId,
    offerer,
    zone = undefined,
    offer,
    consideration,
    orderType,
    criteriaResolvers,
    timeFlag,
    zoneHash = constants.HashZero,
    conduitKey = "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
    extraCheap = true
) => {
    const offerAddress = await offerer.getAddress()
    const counter = await marketplaceContract.getCounter(offerAddress);
    console.log(counter);
    // const salt = !extraCheap ? randomHex() : constants.HashZero;
    // const salt = randomHex();
    const salt = getSalt();
    // console.log(salt);
    // const startTime =
    //   timeFlag !== "NOT_STARTED" ? 0 : toBN("0xee00000000000000000000000000");
    // const endTime =
    //   timeFlag !== "EXPIRED" ? toBN("0xff00000000000000000000000000") : 1;
    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + 2678400;
    const orderParameters = {
        offerer: offerAddress,
        // zone: !extraCheap
        //   ? zone.address ?? zone
        //   : constants.AddressZero,
        zone: zone,
        offer,
        consideration,
        totalOriginalConsiderationItems: consideration.length,
        orderType,
        zoneHash,
        salt,
        conduitKey,
        startTime,
        endTime,
    };

    const orderComponents = {
        ...orderParameters,
        counter,
    };

    const orderHash = await getOrderHash(marketplaceContract, orderComponents);

    const { isValidated, isCancelled, totalFilled, totalSize } =
        await marketplaceContract.getOrderStatus(orderHash);

    // expect(isCancelled).to.equal(false);

    const orderStatus = {
        isValidated,
        isCancelled,
        totalFilled,
        totalSize,
    };

    const flatSig = await signOrder(marketplaceContract, chainId, orderComponents, offerer);
    const order = {
        parameters: orderParameters,
        signature: convertSignatureToEIP2098(flatSig),
        numerator: 1, // only used for advanced orders
        denominator: 1, // only used for advanced orders
        extraData: "0x", // only used for advanced orders
    };

    // How much ether (at most) needs to be supplied when fulfilling the order
    const value = offer
        .map((x) =>
            x.itemType === 0
                ? x.endAmount.gt(x.startAmount)
                    ? x.endAmount
                    : x.startAmount
                : toBN(0)
        )
        .reduce((a, b) => a.add(b), toBN(0))
        .add(
            consideration
                .map((x) =>
                    x.itemType === 0
                        ? x.endAmount.gt(x.startAmount)
                            ? x.endAmount
                            : x.startAmount
                        : toBN(0)
                )
                .reduce((a, b) => a.add(b), toBN(0))
        );

    return {
        order,
        orderHash,
        value,
        orderStatus,
        orderComponents,
    };
};
