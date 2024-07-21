import { chaseMapping } from "./chaseMapping";
import { TransactionInput } from "../types/Transaction";

export async function getTransactionRecordsFromCSVRecords(
  csvData: unknown[],
  cardName: string,
  bank: string
): Promise<TransactionInput[]> {
  const mappings = new Map([["chase", chaseMapping]]);
  const result: TransactionInput[] = [];
  mappings.forEach((mapping, _bank) => {
    console.log(bank, _bank);
    if (bank === _bank) {
      result.push(
        ...csvData.map((record) => {
          const transaction: TransactionInput = {} as TransactionInput;
          mapping.forEach((value, key) => {
            if (value === "disregard") {
              return;
            }
            if (value === "amount") {
              transaction[value as string] = Number(
                (record as Record<string, unknown>)[key]
              );
              return;
            }
            transaction[value as string] = (record as Record<string, unknown>)[
              key
            ];
            transaction.bank = bank;
            transaction.cardName = cardName;
          });
          return transaction;
        })
      );
    }
  });
  return result;
}
