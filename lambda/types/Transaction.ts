export interface TransactionInput {
  [index: string]: unknown;
  id?: string;
  description: string;
  date: string;
  amount: number;
  bank: string;
  cardName: string;
}

export interface Transaction {
  PK: string;
  SK: string;
  id: string;
  description: string;
  date: string;
  amount: number;
  dateAdded: string;
  bank: string;
  cardName: string;
}
