import { APIGatewayProxyEvent } from 'aws-lambda';
import { ControllerResponse } from '../types/controller';

export class HealthCheckController {
  private event: APIGatewayProxyEvent
  constructor(event: APIGatewayProxyEvent) {
    this.event = event


  }

  async getResponse(): Promise<ControllerResponse> {
    if (this.event.httpMethod !== "GET") {
      return {
        statusCode: 404,
        body: JSON.stringify("Only GET method supported at resource /health")

      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify("Txner API is running!")
    }
  }
}