import {
  EventType,
  type HeliusTransaction,
  type ParsedData,
  type TransferData,
} from "./types";

export function identifyEventType(transaction: HeliusTransaction): EventType {
  const { type, events, description } = transaction;

  // Check explicit NFT events from events.nft
  if (events?.nft?.type) {
    switch (events.nft.type) {
      case "NFT_SALE":
        return EventType.NFT_SALE;
      case "NFT_BID":
        return EventType.NFT_BID;
      case "NFT_LISTING":
        return EventType.NFT_LISTING;
      // Add more NFT-specific event mappings as needed
    }
  }

  // Fall back to top-level type
  switch (type.toUpperCase()) {
    case "TRANSFER":
      return EventType.TRANSFER;
    case "NFT_SALE":
      return EventType.NFT_SALE;
    case "NFT_BID":
      return EventType.NFT_BID;
    case "NFT_BID_CANCELLED":
      return EventType.NFT_BID_CANCELLED;
    case "NFT_LISTING":
      return EventType.NFT_LISTING;
    case "NFT_CANCEL_LISTING":
      return EventType.NFT_CANCEL_LISTING;
    case "NFT_MINT":
      return EventType.NFT_MINT;
    case "NFT_AUCTION_CREATED":
      return EventType.NFT_AUCTION_CREATED;
    case "NFT_AUCTION_UPDATED":
      return EventType.NFT_AUCTION_UPDATED;
    case "NFT_AUCTION_CANCELLED":
      return EventType.NFT_AUCTION_CANCELLED;
    case "SWAP":
      return EventType.SWAP;
    case "LOAN":
      return EventType.LOAN;
    case "REPAY_LOAN":
      return EventType.REPAY_LOAN;
    // Add more mappings based on your list
    default:
      // Use description as a heuristic for unmapped types
      const desc = description.toLowerCase();
      if (desc.includes("bid")) return EventType.NFT_BID;
      if (desc.includes("sold") || desc.includes("sale"))
        return EventType.NFT_SALE;
      if (desc.includes("listing")) return EventType.NFT_LISTING;
      if (desc.includes("transfer")) return EventType.TRANSFER;
      return EventType.UNKNOWN;
  }
}

export function parseEventData(transaction: HeliusTransaction): ParsedData {
  const eventType = identifyEventType(transaction);

  switch (eventType) {
    case EventType.NFT_BID:
    case EventType.NFT_GLOBAL_BID:
      return {
        eventType,
        nftMint: transaction.events?.nft?.nfts?.[0]?.mint || "",
        bidAmount: transaction.events?.nft?.amount || 0,
        bidder: transaction.events?.nft?.buyer || transaction.feePayer,
        timestamp: transaction.timestamp,
        signature: transaction.signature,
      };

    case EventType.NFT_LISTING:
    case EventType.NFT_SALE:
    case EventType.NFT_CANCEL_LISTING:
      return {
        eventType,
        nftMint:
          transaction.events?.nft?.nfts?.[0]?.mint ||
          transaction.tokenTransfers?.[0]?.mint ||
          "",
        price:
          eventType === EventType.NFT_SALE ||
          eventType === EventType.NFT_LISTING
            ? transaction.events?.nft?.amount
            : undefined,
        seller: transaction.events?.nft?.seller || transaction.feePayer,
        buyer:
          eventType === EventType.NFT_SALE
            ? transaction.events?.nft?.buyer
            : undefined,
        source: transaction.events?.nft?.source,
        timestamp: transaction.timestamp,
        signature: transaction.signature,
      };

    case EventType.LOAN:
    case EventType.REPAY_LOAN:
      return {
        eventType,
        tokenMint: transaction.tokenTransfers?.[0]?.mint || "",
        amount:
          transaction.tokenTransfers?.[0]?.tokenAmount ||
          transaction.nativeTransfers?.[0]?.amount ||
          0,
        borrower: transaction.feePayer,
        timestamp: transaction.timestamp,
        signature: transaction.signature,
      };

    case EventType.TRANSFER:
    case EventType.SWAP:
      const isTokenTransfer =
        transaction.tokenTransfers && transaction.tokenTransfers.length > 0;
      return {
        eventType: EventType.TRANSFER,
        tokenMint: isTokenTransfer
          ? transaction.tokenTransfers?.[0]?.mint
          : undefined,
        amount: isTokenTransfer
          ? transaction.tokenTransfers?.[0]?.tokenAmount
          : transaction.nativeTransfers?.[0]?.amount || 0,
        fromAccount: isTokenTransfer
          ? transaction.tokenTransfers?.[0]?.fromUserAccount
          : transaction.nativeTransfers?.[0]?.fromUserAccount || "",
        toAccount: isTokenTransfer
          ? transaction.tokenTransfers?.[0]?.toUserAccount
          : transaction.nativeTransfers?.[0]?.toUserAccount || "",
        tokenStandard:
          isTokenTransfer && transaction.tokenTransfers?.[0]
            ? transaction.tokenTransfers[0].tokenStandard
            : undefined,
        timestamp: transaction.timestamp,
        signature: transaction.signature,
        fee: transaction.fee,
        feePayer: transaction.feePayer,
        success: transaction.transactionError === null,
      } as TransferData;

    default:
      return {
        eventType,
        rawData: transaction,
        timestamp: transaction.timestamp,
        signature: transaction.signature,
      };
  }
}
