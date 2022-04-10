
import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';
import * as smtpTransport from 'nodemailer-smtp-transport';
import * as moment from 'moment-timezone';
import { firestoreDB } from '.';
const {google} = require('googleapis');
export class Booking {
    id?: string;
    date?: any;
    client?: string;
    coach?: string;
    timeSlot?: string;
}

//exports.sendBookingReminderToCoach = functions.https.onCall((booking) => {

 export async function sendBookingReminderToCoach(booking: Booking): Promise<boolean> {
    const coach = await getBookingCoach(booking);
    const client = await getBookingClient(booking);
    const gmailEmail = functions.config().gmail.email;
    if (!coach) {
        console.log(`Coach not found by id: ${booking.coach}`);
      return false;
    }
    const bookingDate = new Date(booking.date.seconds * 1000);
    let strDate;
    let jsdate;
    if (coach.timezone) {
        jsdate = moment(bookingDate).tz(coach.timezone);
        strDate = jsdate.format('MMMM Do, YYYY h:mma');
        strDate += ` (${jsdate.tz()})`;
    }
    else {
        jsdate = moment(bookingDate).subtract(2, 'hours');
        strDate = jsdate.format('MMMM Do, YYYY h:mma');
    }
    const body = `Hello,`+
                 `This is a friendly reminder from Succeed.` +   
                 `\nAre you ready for your session with ${client.firstname}, ${client.lastname} tomorrow? `+ 
                 `\nYou booked on ${strDate}. Open your calendar and tap on the orange coloured date ` +
                 `\nand time. You see the name of your client. By tapping on the name, the video call session `+ 
                 `\nopens. Your client will appear. Please remember to write notes on the timeline after the session has ended. `+
                 `\nYour client appreciates that a great deal.`+
                 `\nKind regards,` + 
                 `\n\nYosara Geerlings` +
                 `\nFounder` +
                 `\nSucceed!`;

    // Send coach email
    console.log(`Sending reminder email to ${coach.email}`);
    return await sendEmail({
        from:    gmailEmail,
        to:     `${coach.email}`,
        subject: `Session reminder`,
        text:    body
    });
}
export async function sendSecondBookingReminderToCoach(booking: Booking): Promise<boolean> {
    const coach = await getBookingCoach(booking);
    const client = await getBookingClient(booking);
    const gmailEmail = functions.config().gmail.email;
    if (!coach) {
        console.log(`Coach not found by id: ${booking.coach}`);
      return false;
    }
    //const bookingDate = new Date(booking.date.seconds * 1000);
    // let strDate;
    // let jsdate;
    // if (coach.timezone) {
    //     jsdate = moment(bookingDate).tz(coach.timezone);
    //     strDate = jsdate.format('MMMM Do, YYYY h:mma');
    //     strDate += ` (${jsdate.tz()})`;
    // }
    // else {
    //     jsdate = moment(bookingDate);
    //     strDate = jsdate.format('MMMM Do, YYYY h:mma');
    // }
    const body =   `Are you ready for your session with ${client.firstname}, ${client.lastname}? ` +
                   `\nThey will come to see you within 15 minutes. Open your calendar and tap on the orange ` +
                   `\ncoloured date and time. You see the name of your client. By tapping on the name, the video `+
                   `\ncall session opens. Your client will appear. ` +
                   `\nPlease remember to write notes on the timeline after the session has ended. ` +
                   `\nYour client appreciates that a great deal.`+
                   `\nKind regards,` + 
                   `\n\nYosara Geerlings` +
                   `\nFounder` +
                   `\nSucceed!`;

    // Send coach email
    console.log(`Sending reminder email to ${coach.email}`);
    return await sendEmail({
        from:    gmailEmail,
        to:     `${coach.email}`,
        subject: `Session reminder`,
        text:    body
    });
}


export async function sendBookingReminderToClient(booking: Booking): Promise<boolean> {
    const client = await getBookingClient(booking);
    const coach = await getBookingCoach(booking);
    const gmailEmail = functions.config().gmail.email;
    if (!client) {
        console.log(`Client not found by id: ${booking.client}`);
        return false;
    }
    const bookingDate = new Date(booking.date.seconds * 1000);
    let strDate;
    let jsdate;
    if (client && client.timezone) {
        jsdate = moment(bookingDate).tz(client.timezone);
        strDate = jsdate.format('MMMM Do, YYYY h:mma');
        strDate += ` (${jsdate.tz()})`;
    }
    else {
        jsdate = moment(bookingDate);
        strDate = jsdate.format('MMMM Do, YYYY h:mma');
    }
    const body = `Hello,`+
                 `\n\nThis is a friendly reminder from Succeed. `+
                 `\nAre you ready for your session with ${coach.coachName} tomorrow? `+
                 `\nYou booked at ${strDate}. Please try to be on time, `+ 
                 `\n${coach.coachName} is waiting and ready to work with you. `+
                 `\nKind whishes,` +
                 `\n\nYosara Geerlings` +
                 `\nFounder` +
                 `\nSucceed!`;

    // Client email
    console.log(`Sending reminder email to ${client.email}`);
    return await sendEmail({
        from:    gmailEmail,
        to:     `${client.email}`,
        subject: `Session reminder`,
        text:    body
    });
}

export async function sendSecondBookingReminderToClient(booking: Booking): Promise<boolean> {
    const client = await getBookingClient(booking);
    const coach = await getBookingCoach(booking);
    const gmailEmail = functions.config().gmail.email;
    if (!client) {
        console.log(`Client not found by id: ${booking.client}`);
        return false;
    }
    //const bookingDate = new Date(booking.date.seconds * 1000);
    // let strDate;
    // let jsdate;
    // if (client && client.timezone) {
    //     jsdate = moment(bookingDate).tz(client.timezone);
    //     strDate = jsdate.format('MMMM Do, YYYY h:mma');
    //     strDate += ` (${jsdate.tz()})`;
    // }
    // else {
    //     jsdate = moment(bookingDate);
    //     strDate = jsdate.format('MMMM Do, YYYY h:mma');
    // }
    const body = `Hello,`+
                 `\nWe hope you’re looking forward to your session with ${coach.coachName} ` +
                 `\nwho is waiting and ready to work with you within 15 minutes. ` +
                 `\nWe recommend that you separate yourself from people and other possible interruptions.`+ 
                 `\nSit at ease and indulge your special time.`+
                 `\nKind whishes,` +
                 `\n\nYosara Geerlings` +
                 `\nFounder` +
                 `\nSucceed!`;

    // Client email
    console.log(`Sending reminder email to ${client.email}`);
    return await sendEmail({
        from:    gmailEmail,
        to:     `${client.email}`,
        subject: `Session reminder`,
        text:    body
    });
}

export async function getBookingClient(booking: Booking) {
    try {
        if (!booking.client) {
            throw Error('Booking.client is falsy');
        }
        return getUserById(booking.client);
    }
    catch(e) {
        throw Error('Booking.client is falsy')
    }
}

export async function getUserById(userId: string): Promise<any> {
    try {
        const clientData = await firestoreDB.collection("users").doc(userId).get();
        const client = clientData.data();
        return client ? {...client, id: userId} : null;
    }
    catch(e) {
        console.log(e)
    }
}

export async function getUserByEmail(userEmail: string): Promise<any> {
    try {
        const clientData = await firestoreDB.collection("users").where('email', '==', userEmail).get();
        if (clientData.empty) {
            return null;
        }
        const client = clientData.docs[0].data();
        return client ? {...client, id: clientData.docs[0].id} : null;
    }
    catch(e) {
        console.error(e);
    }
}

export async function getBookingCoach(booking: Booking) {
    try {
        if (!booking.coach) {
            return;
        }
        return getCoachById(booking.coach);
    }
    catch(e) {
        throw e;
    }
}

export async function getCoachById(coachId: string): Promise<any> {
    try {
        const coachData = await firestoreDB.collection("coaches").doc(coachId).get();
        const coach = coachData.data();
        return coach ? {...coach, id: coachId} : null;
    }
    catch(e) {
        console.log('error in function: getCoachById');
        console.log(e)
        return;
    }
}

export async function sendEmail(mailOptions: any): Promise<boolean> {
    console.log(mailOptions)
    return new Promise(resolve => {
        nodemailer.createTransport(smtpTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'nlpsucceed@gmail.com',
                pass: 'Succeed1234'
            }
        })).sendMail(mailOptions, (error: any, info: any) => {
            if (error) {
                console.log('error: ' + error);
                resolve(false);
            }
            else {
                console.log('The message has been sent: ' + info );
                resolve(true);
            }
        });
    });
}

export async function createCancelledBooking(booking: any): Promise<any> {
    try {
        await firestoreDB.collection("cancelledBookings").add(booking);
            }
    catch(e) {
        console.log('error in function: createCancelledBooking');
        console.log(e)
        return;
    }
}

export async function createGoogleCalendarEvents(
    booking: any,
    tokens: any,
    oauth2Client: any
) {
    return new Promise(async (resolve) => {
        const credentials = {
            access_token: tokens.access_token,
            token_type: tokens.token_type,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date
        };
        oauth2Client.setCredentials(credentials);

        // event data
        const bookingDate = new Date(booking.date.seconds * 1000);

        const calendar = google.calendar({version: 'v3', oauth2Client});
        calendar.events.insert({
            auth: oauth2Client,
            calendarId: 'primary',
            resource: {
                'summary': 'Succeed session',
                'start': {
                    'dateTime': moment(bookingDate).format()
                },
                'end': {
                    'dateTime': moment(bookingDate).add(75, 'seconds').format()
                }
            },
        }, (err: any, res: any) => {
            if (err) {
                console.error(err);
            } else {
                console.log(res.data);
            }
            resolve(err);
        });
    });
}

export async function getTransaction(id: string){
    console.log('transaction id: ',id)
    const transaction = firestoreDB.collection('transactions');
        
    const db_transaction = await transaction.where('transaction.captureId','==', id).where('status','==','pending').get();

    console.log('stringyfy transactions: ',JSON.stringify(db_transaction))
    if(db_transaction.docs.length){
        return db_transaction;
    }else{
        return false;
    }

}

export async function createTransactions(data: any) {
    const transaction = firestoreDB.collection('transactions');
  
    // const payerId = await parsePaymentId(data.transaction.paymentId);
  
    transaction.add(data).then((res: any) => {
    //   console.log(' : ', res);
      return res
    }).catch((error: any) => {
      console.log('transaction not created in db: ',error);
      return error
    });
}

export async function updateTransaction(id: any, data: any) {
    const transaction = firestoreDB.collection('transactions');
  
    // const payerId = await parsePaymentId(data.transaction.paymentId);
  
    transaction.doc(id).update(data).then((res: any) => {
    //   console.log('transaction updated: ', res);
      return res
    }).catch((error: any) => {
      console.log('transaction updated failed in db: ',error);
      return error
    });
}