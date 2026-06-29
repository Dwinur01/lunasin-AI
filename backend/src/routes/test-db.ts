import express from "express";
import { DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { docClient, TABLE_NAME } from "../lib/dynamodb.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const dbClient = (docClient.config as any).destroy 
      ? docClient 
      : (docClient as any).client || new DynamoDBClient({
          region: process.env.AWS_REGION || "ap-southeast-1",
          credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          } : undefined
        });

    const command = new DescribeTableCommand({
      TableName: TABLE_NAME,
    });

    const response = await dbClient.send(command);

    res.json({
      status: "success",
      message: `Successfully connected to AWS DynamoDB! Table '${TABLE_NAME}' exists.`,
      tableStatus: response.Table?.TableStatus,
      itemCount: response.Table?.ItemCount,
      keySchema: response.Table?.KeySchema,
      region: dbClient.config.region,
    });
  } catch (error: any) {
    console.error("DynamoDB connection test failed:", error);
    
    // Check if the error is due to missing or invalid credentials
    if (
      error.name === "CredentialsProviderError" || 
      error.name === "UnrecognizedClientException" || 
      error.name === "InvalidSignatureException" || 
      error.message?.includes("credentials") || 
      error.message?.includes("security token")
    ) {
      return res.status(500).json({
        status: "error",
        message: "AWS Credentials are missing or invalid. Please check your .env.local configuration.",
        error: error.message || String(error),
        hint: "Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set correctly in .env.local and are not placeholders."
      });
    }

    // Check if the error is because table does not exist
    if (error.name === "ResourceNotFoundException") {
      return res.json({
        status: "warning",
        message: `AWS Credentials are valid, but the table '${TABLE_NAME}' does not exist in region '${process.env.AWS_REGION || "ap-southeast-1"}'.`,
        error: error.message,
        hint: "Please create the table manual via AWS Console with PK (Partition Key, String) and SK (Sort Key, String)."
      });
    }

    res.status(500).json({
      status: "error",
      message: "Failed to connect to DynamoDB.",
      error: error.message || String(error),
      name: error.name
    });
  }
});

export default router;
