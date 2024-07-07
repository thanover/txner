import { APIGatewayProxyHandler } from 'aws-lambda';
import { HealthCheckController } from './controllers/healthCheck';

export const handler: APIGatewayProxyHandler = async (event, context) => {
  console.log('EVENT: \n' + JSON.stringify(event, null, 2));
  const responseMessage = `Unable to route method ${event.resource} at resource ${event.resource}!`
  const statusCode = 404
  if (event.resource === "/health") return await (new HealthCheckController(event).getResponse())

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: responseMessage,
    }),
  }
};
