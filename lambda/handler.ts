import { APIGatewayProxyHandler } from 'aws-lambda';
import { HealthRoute } from './routes/health';
import { TransactionRoute } from './routes/transaction';

export const handler: APIGatewayProxyHandler = async (event, context) => {
  console.log('EVENT: \n' + JSON.stringify(event, null, 2));
  if (event.resource === "/health") return await (new HealthRoute(event).getResponse())
  if (event.resource === "/transaction") return await (new TransactionRoute(event).getResponse())

  return {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Unable to route method ${event.resource} at resource ${event.resource}!`,
    }),
  }
};
