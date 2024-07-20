import { Transaction, TransactionInput } from "../../types/Transaction";
import axios, { AxiosInstance } from "axios";

export type TxnerApiEnvs = "Dev" | "Prod";

export const TxnerApiUrls: { [key in TxnerApiEnvs]: string } = {
  Dev: "https://sdnnpdt3o1.execute-api.us-east-1.amazonaws.com/dev",
  Prod: "",
};

export type TxnerApiOptions = {
  env?: TxnerApiEnvs;
};

export class TxnerApi {
  public env: TxnerApiEnvs;
  public axiosInstance: AxiosInstance;

  constructor(options?: TxnerApiOptions) {
    this.env = options?.env ?? "Dev";
    this.axiosInstance = axios.create({
      baseURL: TxnerApiUrls[this.env],
    });
  }

  async createTx(tx: TransactionInput) {
    const response = await this.axiosInstance.post("/transaction", tx);
    if (response.status === 201) {
      return response.data as unknown as Transaction;
    }
    if (response.status !== 201) {
      console.log(`Problem creating Transaction: ${JSON.stringify(tx)}`);
      console.log(`Response recieved: ${JSON.stringify(response)}`);
    }
  }
}
