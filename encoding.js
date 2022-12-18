export const AddressZero = "0x0000000000000000000000000000000000000000";
import { constants, Contract, ethers, BigNumber, utils } from "./ethers.js"

const hexRegex = /[A-Fa-fx]/g;

const toHex = (n, numBytes = 0) => {
    const asHexString = BigNumber.isBigNumber(n)
        ? n.toHexString().slice(2)
        : typeof n === "string"
            ? hexRegex.test(n)
                ? n.replace(/0x/, "")
                : Number(n).toString(16)
            : Number(n).toString(16);
    return `0x${asHexString.padStart(numBytes * 2, "0")}`;
};

export const toBN = (n) => BigNumber.from(toHex(n));
window.toBN = toBN;

export const toKey = (n) => toHex(n, 32);

export const getOfferOrConsiderationItem = (
    itemType = 0,
    token = AddressZero,
    identifierOrCriteria = 0,
    startAmount = 1,
    endAmount = 1,
    recipient
) => {
    const offerItem = {
        itemType,
        token,
        identifierOrCriteria: toBN(identifierOrCriteria),
        startAmount: toBN(startAmount),
        endAmount: toBN(endAmount),
    };
    if (typeof recipient === "string") {
        return {
            ...offerItem,
            recipient,
        };
    }
    return offerItem;
};

export const getItemETH = (
    startAmount,
    endAmount,
    recipient
) =>
    getOfferOrConsiderationItem(
        0,
        AddressZero,
        0,
        parseEther(String(startAmount)),
        parseEther(String(endAmount)),
        recipient
    );

export const getItem20 = (
    token,
    startAmount,
    endAmount,
    recipient,
) =>
    getOfferOrConsiderationItem(
        1,
        token,
        0,
        parseEther(String(startAmount)),
        parseEther(String(endAmount)),
        recipient
    );

export const getItem721 = (
    token,
    identifierOrCriteria,
    startAmount = 1,
    endAmount = 1,
    recipient
) =>
    getOfferOrConsiderationItem(
        2,
        token,
        identifierOrCriteria,
        startAmount,
        endAmount,
        recipient
    );

export const getItem1155 = (
    token,
    identifierOrCriteria,
    startAmount = 1,
    endAmount = 1,
    recipient
) =>
    getOfferOrConsiderationItem(
        3,
        token,
        identifierOrCriteria,
        startAmount,
        endAmount,
        recipient
    );
