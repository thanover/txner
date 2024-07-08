import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TransactionController } from '../controllers/transaction';

export class TransactionRoute {
  private event: APIGatewayProxyEvent
  constructor(event: APIGatewayProxyEvent) {
    this.event = event
  }

  async getResponse(): Promise<APIGatewayProxyResult> {
    let response: APIGatewayProxyResult =
    {
      statusCode: 400,
      body:
        JSON.stringify({ message: "Unable to process the request" })
    }

    if (this.event.httpMethod === "POST") return await (new TransactionController(this.event).createTransaction())

    return response
  }
}