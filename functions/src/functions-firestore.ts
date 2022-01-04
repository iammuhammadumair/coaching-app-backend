import { sendEmail, getBookingClient, getBookingCoach, getCoachById, getUserById, createCancelledBooking, createGoogleCalendarEvents, getUserByEmail } from "./utils";
import * as functions from 'firebase-functions';
import * as moment from 'moment-timezone';

export async function sendMessageOnCreate(snap: any) {
    // Get an object representing the document
    const newMessage = snap.data();

    if (newMessage) {
        console.log('Preparing to send new message to ' + newMessage.to + ' from: ' + newMessage.from );
        try {
            // Preparing the message
            const res = await sendEmail({

                from:    functions.config().gmail.email,
                to:       newMessage.to,
                cc:      'info@succeed.world',
                subject: newMessage.subject,
                text:    `From: ${newMessage.from}\n` +
                         `Message: ${newMessage.body}`+
                         `\n\nSincerely,`+
                         `\nYosara Geerlings`+
                         `\nFounder`+
                         `\nSucceed!`,
              
            });

           

            if (res) {
                console.log('Email sent. Response: ');
                console.log(res);
                newMessage.messageSentDate = new Date().getTime();
                return await snap.ref.update({
                    "messageSentDate": new Date().getTime(),
                    "messageSent": true
                });
            }
            console.log('Email not sent. Response: ');
            console.log(res);
        }
        catch(e) {
            console.log('Error');
            console.log(e)
        }
    }
    console.log('newMessage empty');
    return null;
}

export async function sendEmailOnBookingCreate(snap: any, oauth2Client: any) {
    // Get an object representing the document
    
    const booking = snap.data();
    console.log(booking)

    if (booking) {

        console.log(
            `Preparing to send email about booking: ${booking.id}`
        );

        // Setup the GMAIL account enabled to send the emails
        const gmailEmail = functions.config().gmail.email;

        // Preparing the email
        const client = await getBookingClient(booking);
        if (!client) {
            console.log(`Client not found by id: ${booking.client}`);
            return;
        }
        const coach = await getBookingCoach(booking);
        if (!coach) {
            console.log(`Coach not found by id: ${booking.coach}`);
            return;
        }
        const bookingDate = new Date(booking.date.seconds * 1000);
        let clientStrDate;
        let clientJsdate;
        if (client.timezone) {
            clientJsdate = moment(bookingDate).tz(client.timezone);
            clientStrDate = clientJsdate.format('MMMM Do, YYYY h:mma');
            clientStrDate += ` (${clientJsdate.tz()})`;
        }
        else {
            clientJsdate = moment(bookingDate);
            clientStrDate = clientJsdate.format('MMMM Do, YYYY h:mma');
        }

        // Client email
        await sendEmail({
            from:    gmailEmail,
            to:     `${client.email}`,
            subject: `New session with ${coach.coachName}`,
            text:    `Hello,`+
            `\n\nYou have booked a session with ${coach.coachName} on ${clientStrDate}. ` +
            `When the time for your session has come, please log in to your account on Succeed. ` +
            `Open your calendar and tap on the orange-coloured date. On the home page `+
            `you see a button that takes you directly to your calendar. You see the name of your `+ 
            `coach. By tapping on the name, the video call session starts. Your time to grow and ` +
            `learn has come and we love to support you on the journey. Your session is encrypted `+
            `and secured. `+
            `And don’t worry about forgetting, you will receive a reminder email 15 `+ 
            `minutes prior to your `+
            `session.`+
            `\n\nSincerely,`+
            `\nYosara Geerlings`+
            `\nFounder`+
            `\nSucceed!`
                
        });

        // Send coach email
        await sendEmail({
            from:    gmailEmail,
            to:     `${coach.email}`,
            subject: `${client.firstname} ${client.lastname} booked a session`,
            text:   `Dear coach,\n\nYou are booked.\nOpen your Succeed -calendar to see ` +
            `your bookings and the names of your clients.` +
            `\nAt the stipulated date and time, please tap on the booking in your ` +
            `calendar and wait for your client to appear on the other side.` +
            `\n\nSincerely,`+
            `\nYosara Geerlings`+
            `\nFounder`+
            `\nSucceed!`,
        });

        if (client.gcEnabled && client.gcTokens) {
            await createGoogleCalendarEvents(
                booking,
                client.gcTokens,
                oauth2Client
            );
        }
        // get coach user
        const coachUser = await getUserByEmail(coach.email);
        if (coachUser && coachUser.gcEnabled && coachUser.gcTokens) {
            await createGoogleCalendarEvents(
                booking,
                coachUser.gcTokens,
                oauth2Client
            );
        }
    }
    return null;
}
export async function sendEmailOnBookingCreateNew(snap: any, oauth2Client: any) {
    // Get an object representing the document
    const booking = snap.data();
    console.log(booking)

    if (booking) {

        console.log(
            `Preparing to send email about booking: ${booking.id}`
        );

        // Setup the GMAIL account enabled to send the emails
        const gmailEmail = functions.config().gmail.email;

        // Preparing the email
        const client = await getBookingClient(booking);
        if (!client) {
            console.log(`Client not found by id: ${booking.client}`);
            return;
        }
        const coach = await getBookingCoach(booking);
        if (!coach) {
            console.log(`Coach not found by id: ${booking.coach}`);
            return;
        }
        const bookingDate = new Date(booking.date.seconds * 1000);
        let clientStrDate;
        let clientJsdate;
        if (client.timezone) {
            clientJsdate = moment(bookingDate).tz(client.timezone);
            clientStrDate = clientJsdate.format('MMMM Do, YYYY h:mma');
            clientStrDate += ` (${clientJsdate.tz()})`;
        }
        if(!client.paid){
            
        }
        else {
            clientJsdate = moment(bookingDate);
            clientStrDate = clientJsdate.format('MMMM Do, YYYY h:mma');
        }

        // Client email
        await sendEmail({
            from:    gmailEmail,
            to:     `${client.email}`,
            subject: `New session with ${coach.coachName}`,
            text:    `Hello,`+
            `\n\nYou have booked a session with ${coach.coachName} on ${clientStrDate}. ` +
            `When the time for your session has come, please log in to your account on Succeed. ` +
            `Open your calendar and tap on the orange-coloured date. On the home page `+
            `you see a button that takes you directly to your calendar. You see the name of your `+ 
            `coach. By tapping on the name, the video call session starts. Your time to grow and ` +
            `learn has come and we love to support you on the journey. Your session is encrypted `+
            `and secured. `+
            `And don’t worry about forgetting, you will receive a reminder email 15 `+ 
            `minutes prior to your `+
            `session.`+
            `\n\nSincerely,`+
            `\nYosara Geerlings`+
            `\nFounder`+
            `\nSucceed!`
                
        });

        // Send coach email
        await sendEmail({
            from:    gmailEmail,
            to:     `${coach.email}`,
            subject: `${client.firstname} ${client.lastname} booked a session`,
            text:   `Dear coach,\n\nYou are booked.\nOpen your Succeed -calendar to see in ` +
            `your bookings and the names of your clients.` +
            `\nAt the stipulated date and time, please tap on the booking in your ` +
            `calendar and wait for your client to appear on the other side.` +
            `\n\nSincerely,`+
            `\nYosara Geerlings`+
            `\nFounder`+
            `\nSucceed!`,
        });

        if (client.gcEnabled && client.gcTokens) {
            await createGoogleCalendarEvents(
                booking,
                client.gcTokens,
                oauth2Client
            );
        }
        // get coach user
        const coachUser = await getUserByEmail(coach.email);
        if (coachUser && coachUser.gcEnabled && coachUser.gcTokens) {
            await createGoogleCalendarEvents(
                booking,
                coachUser.gcTokens,
                oauth2Client
            );
        }
    }
    return null;
}
export async function sendEmailOnBookingCancel(snap: any) {
    // Get an object representing the document
    const booking = snap.data();

    if (booking) {

        console.log(
            `Preparing to send email about booking: ${booking.id}`
        );

        // Setup the GMAIL account enabled to send the emails
        const gmailEmail = functions.config().gmail.email;

        // Preparing the email
        const client = await getBookingClient(booking);
        if (!client) {
            console.log(`Client not found by id: ${booking.client}`);
            return;
        }
        const coach = await getBookingCoach(booking);
        if (!coach) {
            console.log(`Coach not found by id: ${booking.coach}`);
            return;
        }
        const bookingDate = new Date(booking.date.seconds * 1000);
        const jsdate = moment(bookingDate);

        // Client email
        await sendEmail({
            from:    gmailEmail,
            to:     `${client.email}`,
            subject: `Session with ${coach.coachName} was cancelled`,
            text:    `The session on ${jsdate.format('MMMM Do, YYYY h:mma')} with ${coach.coachName} was recently cancelled.`
        });

        // Send coach email
        await sendEmail({
            from:    gmailEmail,
            to:     `${coach.email}`,
            subject: `Session with ${client.firstname} ${client.lastname} was cancelled`,
            text:    `The session on ${jsdate.format('MMMM Do, YYYY h:mma')} with ${coach.coachName} was recently cancelled.`
        });
    }
    return null;
}

export async function onCancelledBooking(snap: any) {
    // Get an object representing the document
    const booking = snap.data();

    console.log('booking deleted:');
    console.log(booking)

    await createCancelledBooking(booking);

    return null;
}

export async function sendNotificationOnRatingCreate(snap: any) {
    // Get an object representing the document
    const rating = snap.data();

    if (rating && rating.rate === 1) {
        // get the coach
        const coach = await getCoachById(rating.coach);
        if (!coach) {
            console.log(`Coach not found by id: ${rating.coach}`);
            return;
        }
        // get client
        const client = await getUserById(rating.client);
        if (!client) {
            console.log(`Client not found by id: ${rating.client}`);
            return;
        }

        // Send coach email
        const gmailEmail = functions.config().gmail.email;
        const coachMessage = `Unfortunately, the session with ${client.firstname} ${client.lastname} has been rated 1 star.`;
        await sendEmail({
            from:    gmailEmail,
            to:     `${coach.email}`,
            subject: `New Rating`,
            text:    coachMessage
        });
        console.log(`Rating email sent to coach: ${rating.coach}`);

        // Send client email
        await sendEmail({
            from:    gmailEmail,
            to:     `${client.email}`,
            subject: `New Rating`,
            text:    `Unfortunately the session with ${coach.name} has been rated 1 star.`
        });
        console.log(`Rating email sent to client: ${rating.client}`);

        // get coachAgent
        const coachAgent = await getUserById(coach.coachAgent);
        if (!coachAgent) {
            console.log(`Coach agent not found by id: ${coach.coachAgent}`);
            return;
        }
        await sendEmail({
            from:    gmailEmail,
            to:     `${coachAgent.email}`,
            subject: `New Rating`,
            text:    coachMessage
        });
        console.log(`Rating email sent to coachAgent: ${coach.coachAgent}`);
    }
    return null;
}


export async function sendEmailOnContactMessageCreate(snap: any) {
    // Get an object representing the document
    const newMessage = snap.data();

    if (newMessage) {
        console.log('Preparing to send new contactMessage to info@succeed.world from: ' + functions.config().gmail.email);
        try {
            // Preparing the message
            const res = await sendEmail({
                from:    functions.config().gmail.email,
                to:      'info@succeed.world',
                subject: 'New contact form message',
                text:    `First name: ${newMessage.first}\n` +
                         `Last name: ${newMessage.last}\n` +
                         `Email: ${newMessage.email}\n` +
                         `Country: ${newMessage.country}\n\n` +
                         `Story: ${newMessage.description}`
            });

            if (res) {
                console.log('Email sent. Response: ');
                console.log(res);
                newMessage.messageSentDate = new Date().getTime();
                return await snap.ref.update({
                    "messageSentDate": new Date().getTime(),
                    "messageSent": true
                });
            }
            console.log('Email not sent. Response: ');
            console.log(res);
        }
        catch(e) {
            console.log('Error');
            console.log(e)
        }
    }
    console.log('newMessage empty');
    return null;
}
