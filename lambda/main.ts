export async function handler(event: unknown) {
  console.log('Event: ', event);
  let responseMessage = 'Txner API is Running!';

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: responseMessage,
    }),
  }
}
