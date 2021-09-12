import AWS from 'aws-sdk';

const SES = new AWS.SES({region:'eu-west-1'});

async function sendMail(event, context) {
    const params = {
        Source: 'EMAIL_HERE',
        Destination: {
            ToAddresses: ['TO_ADDRESS_HERE'],
        },
        Message: {
            Body: {
                Text: {
                    Data: 'Hello from Codingly!',
                },
            },
            Subject: {
                Data: 'Test Mail'
            }
        },
    };

    try{
        const result = await SES.sendEmail(params).promise();
        console.log(result);
        return result;
    }catch(error){
        console.error(error);
    }

}

export const handler = sendMail;


