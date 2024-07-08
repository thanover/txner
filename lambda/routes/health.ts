import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export class HealthRoute {
  private event: APIGatewayProxyEvent
  constructor(event: APIGatewayProxyEvent) {
    this.event = event


  }

  async getResponse(): Promise<APIGatewayProxyResult> {
    if (this.event.httpMethod !== "GET") {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: "Only GET method supported at resource /health" })

      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: "Txner API is running!" })
    }
  }
}