import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB, PutItemInput } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";
import { Transaction, TransactionInput } from "../types/Transaction";

export class TransactionController {
  private event: APIGatewayProxyEvent;
  constructor(event: APIGatewayProxyEvent) {
    this.event = event;
  }

  async createTransaction(): Promise<APIGatewayProxyResult> {
    const { body } = this.event;
    if (!body) return this.sendFail("invalid request");
    const parsedBody = JSON.parse(body);
    const transactionInputs: TransactionInput[] = parsedBody.transactions
      ? parsedBody.transactions
      : [parsedBody];

    const successfulPuts: Transaction[] = [];
    const failures: string[] = [];
    transactionInputs.map(async (transactionInput) => {
      const { id, description, amount, date, bank, cardName } =
        transactionInput;

      const dynamoClient = new DynamoDB({
        region: "us-east-1",
      });

      const newTransaction: Transaction = {
        PK: `DESCRIPTION#${description}`,
        SK: `DATE#${date}`,
        id: id ?? randomUUID(),
        description,
        amount,
        date,
        bank,
        cardName,
        dateAdded: Date.now().toString(),
      };

      const transactionParams: PutItemInput = {
        Item: marshall(newTransaction),
        TableName: process.env.TABLE_NAME,
      };

      try {
        await dynamoClient.putItem(transactionParams);
        successfulPuts.push(newTransaction);
      } catch (err) {
        failures.push(
          `Failed to put new transaction in the table!\n Transaction: ${newTransaction}.\n reason: ${err}`
        );
        console.log(err);
      }
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        createdTransactions: successfulPuts,
        ...(failures && { failures }),
      }),
    };
  }
  sendFail(message: string): APIGatewayProxyResult {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    };
  }
}
