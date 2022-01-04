import { sendSecondBookingReminderToClient,sendSecondBookingReminderToCoach,sendBookingReminderToClient, sendBookingReminderToCoach, getBookingClient, getBookingCoach, getUserById, sendEmail, getUserByEmail } from "./utils";
import * as moment from 'moment-timezone';
import * as mangopay  from 'mangopay2-nodejs-sdk';
import { firestoreDB } from '.';
import * as functions from 'firebase-functions';
import * as request from "request-promise-native";

const coachhubUser = '71962424';
const coachhubUserWallet = '71962426';

const mangopayApi = new mangopay({
    clientId: 'succeedprod',
    clientApiKey: 'm6ug4ut7dx7TVCkXEgpae8eyjDFes3CwfMOjTOLWNnr0mTso5h',
    baseUrl: 'https://api.mangopay.com'
//   clientId: 'suceed',
//   clientApiKey: 'qsaMyuUiw0vvGP78vqkZKV5KyFXDk8cvukLQ9Ct53YbN159RPS',
  // Set the right production API url. If testing, omit the property since it defaults to sandbox URL
//   baseUrl: 'https://api.sandbox.mangopay.com'
});

export async  function fiveMinutesScheduledFunction() {
    console.log('This will run every 5 minutes!');
    const start = moment(new Date()).subtract(1, 'day');
    const end = moment(new Date()).add(1, 'day');

    console.log(`charging pending sessions...`);

    console.log(`getting bookings between ${start.format()} and ${end.format}`);
    const bookingsRef = firestoreDB.collection('bookings');
    const bookings = await bookingsRef.orderBy('date', 'asc').startAt(start.toDate())
                                      .endAt(end.toDate()).get();

    console.log(`bookings found: ${bookings.docs.length}`);
    for (const booking of bookings.docs) {
        const data = booking.data();
        if (data) {
            const bookingData = data ? {...data, id: booking.id} : null;
            sendFirstReminder(bookingData).catch(err => handleError(err, 'sendFirstReminder'));
            sendSecondReminder(bookingData).catch(err => handleError(err, 'sendSecondReminder'));
            chargeForSession(bookingData).catch(err => handleError(err, 'chargeForSession'));
        }
    }
    return null;
}

export async function firstOfMonthScheduledFunction() {
    try {
        // Get all balances and charge them from the coachAgents
        const balances = await firestoreDB.collection('balances').where('amount', '>', 0).get();
        if (!balances.docs.length) {
            console.log('No balances found')
            return;
        }
        for (const balance of balances.docs) {
            const balanceData = balance.data();
            if (balanceData) {
                const coachAgent = getUserById(balanceData.coachAgent);
                if (coachAgent) {
                    await chargeBalance({...balanceData, id: balance.id}, coachAgent);
                }
                else {
                    throw Error(`Coach agent not find with id: ${balanceData.coachAgent}`);
                }
            }
            else {
                throw Error(`Could not charge balance: ${balance.id}`);
            }
        }
    }
    catch(e) {
        throw e;
    }
}

export async function everyTwoDaysScheduledFunction() {
   await refreshImageToken();
}

async function chargeBalance(balance: any, coachAgent: any) {
    try {
        console.log(`Charging balance from coach agent: ${coachAgent.id}`);
        const payIn: any = {
            "AuthorId": coachAgent.mangoUserId,
            "CreditedWalletId": coachhubUserWallet,
            "PaymentType": "CARD",
            "ExecutionType": "DIRECT",
            "DebitedFunds": {"Currency": balance.currency, "Amount": balance.amount},
            "Fees": {"Currency": "EUR", "Amount": 0},
            "SecureModeReturnURL": "https://succeed.world/home",
            "CardId": coachAgent.mangoCardId,
            "SecureMode": "DEFAULT",
            "StatementDescriptor": "Succeed",
            "Culture": "EN"
        };
        const res = await mangopayApi.PayIns.create(payIn);
        console.log('Session successfully charged: ' + JSON.stringify(res));

        // reset balance
        await firestoreDB.collection('balances').doc(balance.id).update({amount: 0});

        await createBalanceEntry(balance, null, -balance.amount, payIn);

    } catch(e) {throw e;}
}

async function chargeForSession(booking: any) {
    try {
        if (booking.paid || booking.isFree) {
            console.log(`Booking ${booking.id} is paid (${booking.paid}) or is free (${booking.isFree})`);
            return;
        }
        const bookingDate = moment(new Date(booking.date.seconds * 1000));
        const now = moment(new Date());
        const finishTime = bookingDate.add(75, 'minutes');
        console.log(`Booking finishes on: ${finishTime.format()}`);
        console.log(`Current time: ${now.format()}`);

        if (finishTime.isAfter(now)) {
            console.log(`${finishTime.diff(now, 'minutes')} minutes left for the session to finish`);
            return;
        }

        console.log('session finished, it can be charged')
        // get session coach and coachee
        const coachee = await getBookingClient(booking);
        if (!coachee) {
            throw Error(`Coachee could not be found for booking: ${booking.id}. Coachee.id = ${booking.client}`);
        }
        if (coachee.sponsored) {
            chargeCoachAgent(coachee, booking).catch(err => {throw err;});
        }
        else {
            const coach = await getBookingCoach(booking);
            if (!coach) {
                throw Error(`Coach could not be found for booking: ${booking.id}. Coach.id = ${booking.coach}`);
            }
            await chargeCoachee(coachee, coach, booking);
        }
    } catch(e) {
        console.log(e);
    }
}

async function chargeCoachee(coachee: any, coach: any, booking: any) {
    try {
        console.log(`Charging session between ${coachee.mangoCardId} and ${coach.mangoBankAccountId}`);
        // 100% goes to the coach
        const payIn: any = {
            "AuthorId": coachee.mangoUserId,
            "CreditedWalletId": coach.mangoWallet,
            "PaymentType": "CARD",
            "ExecutionType": "DIRECT",
            "DebitedFunds": {"Currency": coach.currency, "Amount": coach.price * 100},
            "Fees": {"Currency": "EUR", "Amount": 0},
            "SecureModeReturnURL": "https://succeed.world/",
            "CardId": coachee.mangoCardId,
            "SecureMode": "DEFAULT",
            "StatementDescriptor": "Succeed",
            "Culture": "EN"
        };
        const payInRes = await mangopayApi.PayIns.create(payIn);
        console.log('Session successfully charged (coachee): ' + JSON.stringify(payInRes))

        // Mark session as paid
        await markBookingAsPaid(booking).then(
            async () => {
                console.log('Session marked as paid!');
                // Send 17% to coachhub
                const coachhubCut = Math.round(coach.price * 100 * 0.17);
                const coachUser = await getUserByEmail(coach.email);
                const transfer = {
                    "AuthorId": coachUser.mangoUserId,
                    "DebitedFunds": {
                        "Currency": coach.currency,
                        "Amount": coachhubCut
                    },
                    "Fees": {
                        "Currency": "EUR",
                        "Amount": "0"
                    },
                    "CreditedUserId": coachhubUser,
                    "CreditedWalletId": coachhubUserWallet,
                    "DebitedWalletId": coach.mangoWallet
                };
                const transferRes = mangopayApi.Transfers.create(transfer as any);
                console.log('Funds moved to coach bank account: ' + JSON.stringify(transferRes));
            }
        ).catch(e => {
            console.log('Session coud not be marked as paid!');
            console.log(JSON.stringify(e));
            throw e;
        });
    } catch(e) {
        console.log('Charging coachee failed: ' + JSON.stringify(e));
        throw e;
    }
}

function markBookingAsPaid(booking: any) {
    return firestoreDB.collection('bookings').doc(booking.id).update({paid: true});
}

async function chargeCoachAgent(coachee: any, booking: any) {
    try {
        if (!coachee.coachAgent) {
            throw Error(`coachee '${coachee.id}' does not have a coachAgent`);
        }
        let balance = await getCoachAgentBalance(coachee.coachAgent);
        if (!balance) {
            const money = {amount: 1000, currency: 'EUR'};
            balance = await createCoachAgentBalance(money, coachee.coachAgent);
        }
        else {
            await increaseCoachAgentBalanceAmount(balance, 1000);
        }
        await createBalanceEntry(balance, booking, 1000);
        await markBookingAsPaid(booking);
        await sendEmailToCoachAgent(coachee);
        console.log(`Session ${booking.id} was charged to coachAgent ${coachee.coachAgent}`);
    } catch(e) {
        console.log(JSON.stringify(e));
        throw e;
    }
}

async function sendEmailToCoachAgent(coachee: any) {
    const coachAgent = await getUserById(coachee.coachAgent);
    if (!coachAgent) {
        throw Error(`Coach agent not found by id: ${coachee.coachAgent}`);
    }
    const gmailEmail = functions.config().gmail.email;
    const body = `This is a session notification. Coachee ${coachee.firstname} ${coachee.lastname} just finished a session.` +
                 `\n\nSincerely,` +
                 `\nYosara Geerlings` +
                  `\nFounder` +
                 `\nSucceed!`;

                 

    // Client email
    console.log(`Sending reminder email to ${coachAgent.email}`);
    return await sendEmail({
        from:    gmailEmail,
        to:     `${coachAgent.email}`,
        subject: `Session reminder`,
        text:    body
    });
}

async function getCoachAgentBalance(coachAgentId: string) {
    const balance = await firestoreDB.collection('balances').where(
        'coachAgent', '==', coachAgentId
    ).get();
    if (!balance.docs.length) {
        return;
    }
    const balanceData = balance.docs[0].data();
    return balanceData ? {...balanceData, id: balance.docs[0].id} : null;
}

async function createCoachAgentBalance(money: any, coachAgentId: string) {
    const result = await firestoreDB.collection('balances').add({
        coachAgent: coachAgentId,
        amount: money.amount,
        currency: 'EUR'
    });
    const created = await result.get();
    const createdData = created.data();
    return createdData ? {...createdData, id: created.id} : null;
}

function increaseCoachAgentBalanceAmount(balance: any, amount: number) {
    return firestoreDB.collection('balances').doc(balance.id).update({
        amount: Number(balance.amount) + amount,
    }).catch(e => {throw e;});
}

function createBalanceEntry(balance: any, booking: any = null, amount: number, payIn: any = null) {
    return firestoreDB.collection('balanceEntries').add({
        balance: balance.id,
        amount: amount,
        booking: booking ? booking.id : null,
        payIn: payIn ? payIn.id : null,
    }).catch(e => {throw e;});
}

async function sendFirstReminder(booking: any) {
    const today = moment(new Date());
    const bookingDate = moment(new Date(booking.date.seconds * 1000));
    if (today.diff(bookingDate, 'days') > 1) {
        return;
    }
    if (!booking.firstReminderSendToClient) {
        const res = await sendBookingReminderToClient(booking);
        if (res) {
            booking.firstReminderSendToClient = true;
            await firestoreDB.collection('bookings').doc(booking.id).update(booking);
        }
    }
    if (!booking.firstReminderSendToCoach) {
        const res = await sendBookingReminderToCoach(booking);
        if (res) {
            booking.firstReminderSendToCoach = true;
            await firestoreDB.collection('bookings').doc(booking.id).update(booking);
        }
    }
}

async function sendSecondReminder(booking: any) {
    const today = moment(new Date());
    const bookingDate = moment(new Date(booking.date.seconds * 1000));
    if (today.diff(bookingDate, 'minutes') <= 59) {
        return;
    }
    if (!booking.secondReminderSendToClient) {
        const res = await sendSecondBookingReminderToClient(booking);
        if (res) {
            booking.secondReminderSendToClient = true;
            await firestoreDB.collection('bookings').doc(booking.id).update(booking);
        }
    }
    if (!booking.secondReminderSendToCoach) {
        const res = await sendSecondBookingReminderToCoach(booking);
        if (res) {
            booking.secondReminderSendToCoach = true;
            await firestoreDB.collection('bookings').doc(booking.id).update(booking);
        }
    }
}

function handleError(error: any, method: string) {
    console.log(`Error running method: ${method}`);
    console.log(error);
}

async function refreshImageToken() {
    try {
        console.log('refreshing ig access token')
        const dbData = await firestoreDB.collection('igToken').doc('1').get();
        const data = dbData.data();
        if (!data) {
            console.error('Instagram Access token was deleted!!');
            return;
        }
        const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${data.token}`;
        const options = {uri: url};
        const result = await request.get(options);
        console.log(result);
    }
    catch(e) {
        console.error(e);
    }
}
