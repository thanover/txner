import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB, PutItemInput } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { randomUUID } from "crypto";

interface TransactionInput {
  id?: string
  description: string
  date: string
  amount: number
}

interface Transaction {
  PK: string
  SK: string
  id: string
  description: string
  date: string
  amount: number
}

export class TransactionController {
  private event: APIGatewayProxyEvent
  constructor(event: APIGatewayProxyEvent) {
    this.event = event
  }


  async createTransaction(): Promise<APIGatewayProxyResult> {
    const { body } = this.event
    if (!body) return this.sendFail('invalid request')
    const { id, description, amount, date } = JSON.parse(body) as TransactionInput

    const dynamoClient = new DynamoDB({
      region: 'us-east-1'
    })

    const newTransaction: Transaction = {
      PK: `DESCRIPTION#${description}`,
      SK: `DATE#${date}`,
      id: id ?? randomUUID(),
      description, amount, date
    }

    const transactionParams: PutItemInput = {
      Item: marshall(newTransaction),
      TableName: process.env.TABLE_NAME
    }

    try {
      await dynamoClient.putItem(transactionParams)
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newTransaction })
      }
    } catch (err) {
      console.log(err)
      return this.sendFail('something went wrong')
    }
  }

  sendFail(message: string): APIGatewayProxyResult {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    }
  }
}