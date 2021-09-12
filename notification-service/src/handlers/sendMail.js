import AWS from 'aws-sdk';

const SES = new AWS.SES({region:'eu-west-1'});

async function sendMail(event, context) {

    const record = event.Records[0];
    console.log('Record processoing', record);
    const email = JSON.parse(record.body);
    const {subject, body, recipient} = email;

    const params = {
        Source: 'miguel.navjor@gmail.com',
        Destination: {
            ToAddresses: [recipient],
        },
        Message: {
            Body: {
                Text: {
                    Data: body,
                },
            },
            Subject: {
                Data: subject
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


