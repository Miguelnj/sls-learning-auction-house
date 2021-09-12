import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

function notifySeller(title, amount, seller) {
    const subject = (amount === 0) ? 'The auction for your item has finished' : 'Your item has been sold';
    const body = (amount === 0) ? `Hello. The auction for "${title}" has finished without any bid on it` :
        `Hey! your item "${title}" has been sold for $${amount}.`;

    return sqs.sendMessage({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
            subject: subject,
            recipient: seller,
            body: body,
        }),
    }).promise();
}

function notifyBidder(title, amount, bidder) {
    return sqs.sendMessage({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
            subject: 'You won an auction',
            recipient: bidder,
            body: `What a great deal! You won the bid for a "${title}" for $${amount}`
        }),
    }).promise();
}

export async function closeAuction(auction) {

    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: {id: auction.id},
        UpdateExpression: 'set #status = :status',
        ExpressionAttributeValues: {
            ':status': 'CLOSED',
        },
        ExpressionAttributeNames: {
            '#status': 'status'
        },
    };

    await dynamodb.update(params).promise();

    const {title, seller, highestBid} = auction;
    const {amount, bidder} = highestBid;

    const sellerNotificationPromise = notifySeller(title, amount, seller);

    let notificationsPromises = [sellerNotificationPromise];
    if(amount > 0) notificationsPromises.push(notifyBidder(title, amount, bidder));

    return Promise.all([notificationsPromises]);

}