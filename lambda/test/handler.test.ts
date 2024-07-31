// write a jest test that mocks a aws lambda event
import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../handler";

describe("handler", () => {
  it("should return 404 when resource is not found", async () => {
    const event: APIGatewayProxyEvent = {
      httpMethod: "GET",
      body: null,
      headers: {},
      multiValueHeaders: {},
      isBase64Encoded: false,
      path: "",
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {
        accountId: "",
        apiId: "",
        authorizer: undefined,
        protocol: "",
        httpMethod: "",
        identity: {
          accessKey: null,
          accountId: null,
          apiKey: null,
          apiKeyId: null,
          caller: null,
          clientCert: null,
          cognitoAuthenticationProvider: null,
          cognitoAuthenticationType: null,
          cognitoIdentityId: null,
          cognitoIdentityPoolId: null,
          principalOrgId: null,
          sourceIp: "",
          user: null,
          userAgent: null,
          userArn: null
        },
        path: "",
        stage: "",
        requestId: "",
        requestTimeEpoch: 0,
        resourceId: "",
        resourcePath: ""
      },
      resource: ""
    };
    const response = await handler(event, {
      callbackWaitsForEmptyEventLoop: false,
      functionName: "",
      functionVersion: "",
      invokedFunctionArn: "",
      memoryLimitInMB: "",
      awsRequestId: "",
      logGroupName: "",
      logStreamName: "",
      getRemainingTimeInMillis: function (): number {
        throw new Error("Function not implemented.");
      },
      done: function (error?: Error, result?: any): void {
        throw new Error("Function not implemented.");
      },
      fail: function (error: Error | string): void {
        throw new Error("Function not implemented.");
      },
      succeed: function (messageOrObject: any): void {
        throw new Error("Function not implemented.");
      }
    }, () => {});
    expect(response).toBeDefined()
    expect(response.statusCode).toBe(404);
  });

  it("should return 200 when resource is /health", async () => {
    const event = {
      resource: "/health",
    };
    const response = await handler(event, null);
    expect(response.statusCode).toBe(200);
  });

  it("should return 200 when resource is /transaction", async () => {
    const event = {
      resource: "/transaction",
    };
    const response = await handler(event, null);
    expect(response.statusCode).toBe(200);
  });
});



