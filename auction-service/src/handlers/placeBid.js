import AWS from 'aws-sdk';
import createError from 'http-errors';
import commonMiddleware from "../lib/commonMiddleware";
import {getAuctionById} from "./getAuction";
import placeBidSchemaValidation from "../lib/schemas/placeBidSchemaValidation";
import validator from "@middy/validator";

const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
    const {id} = event.pathParameters;
    const {amount} = event.body;
    const {email} = event.requestContext.authorizer;
    const auction = await getAuctionById(id);

    if (amount <= auction.highestBid.amount){
        throw new createError.Forbidden('Your bid must be higher than ' + auction.highestBid.amount);
    }else if (auction.status !== 'OPEN') {
        throw new createError.Forbidden('You cannot bid on a closed auction');
    }else if(auction.highestBid.bidder === email){
        throw new createError.Forbidden('You are already the highest bidder');
    }else if(auction.seller === email){
        throw new createError.Forbidden('You cannot bid on your own auctions');
    }

    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: {id},
        UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
        ExpressionAttributeValues: {
            ':amount': amount,
            ':bidder': email
        },
        ReturnValues: 'ALL_NEW'
    };

    let updatedAuction;

    try{
        const result = await dynamoDB.update(params).promise();
        updatedAuction = result.Attributes;
    }catch (error){
        console.error(error);
        throw new createError.InternalServerError(error);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(updatedAuction),
    };
}

export const handler = commonMiddleware(placeBid)
    .use(validator({inputSchema: placeBidSchemaValidation}));


