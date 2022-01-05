import * as OpenTok from 'opentok';
import * as mangopay  from 'mangopay2-nodejs-sdk';
import { firestoreDB } from '.';
import { getUserByEmail } from "./utils"


const mangopayApi = new mangopay({
    clientId: 'succeedprod',
    clientApiKey: 'm6ug4ut7dx7TVCkXEgpae8eyjDFes3CwfMOjTOLWNnr0mTso5h',
    baseUrl: 'https://api.mangopay.com'
//   clientId: 'suceed',
//   clientApiKey: 'qsaMyuUiw0vvGP78vqkZKV5KyFXDk8cvukLQ9Ct53YbN159RPS',
  // Set the right production API url. If testing, omit the property since it defaults to sandbox URL
//   baseUrl: 'https://api.sandbox.mangopay.com'
});

const coachhubUser = '71962424';
const coachhubUserWallet = '71962426';

// export async function testSession(req: any, res: any){

//     const { booking, session } = req.body;
//     const bookingsRef = firestoreDB.collection('bookings');
//     bookingsRef.doc(booking).set({
//                     sessionId: session
//                 }).then((bookingRes: any) => {
//                     console.log('booking doc updated: ', bookingRes);
//                     return res.status(200).send({result: 'success', bookingRes});
//                 }).catch((error: any) => {
//                     console.log('catch: ',error);
//                     return res.status(200).send({result: 'error', message: 'Session could not be created',error});
//                 });
// }

export async function createSession(req: any, res: any, opentok: any) {
    try {
        const data = req.body;
        if (!data || !data.booking) {
            console.log('Booking is required');
            return res.status(200).send({result: 'error', message: 'Booking is required'});
        }
        // Get booking session id
        const bookingsRef = firestoreDB.collection('bookings');
        const dbData = await bookingsRef.doc(data.booking).get();
        console.log(dbData)
        const dbBooking = dbData.data();
        if (dbBooking && dbBooking.sessionId) {
            const tokenOptions: OpenTok.TokenOptions = {role: "publisher"};
            const token = opentok.generateToken(dbBooking.sessionId, tokenOptions);
            return res.status(200).send({result: 'success', session: dbBooking.sessionId, token});
        }
        opentok.createSession({mediaMode: "relayed"}, (err: any, session: any) => {
            if (err || !session) {
                console.log(err);
                return res.status(200).send({result: 'error', message: 'Session could not be created'});
            }
            bookingsRef.doc(data.booking).update({
                sessionId: session.sessionId
            }).then((bookingRes: any) => {
                const tokenOptions: OpenTok.TokenOptions = {role: "publisher"};
                const token = opentok.generateToken(session.sessionId, tokenOptions);
                return res.status(200).send({result: 'success', session: session.sessionId, token});
            }).catch((error: any) => {
                console.log(error);
                return res.status(200).send({result: 'error', message: 'Session could not be created'});
            });
        });
    } catch (errorRes) {
        console.log(errorRes);
        return res.status(200).send({result: 'error', message: 'Session could not be created'});
    }
}

export async function createCardRegistration(req: any, res: any) {
    try {
        if (!req || !req.body || !req.body.UserId) {
            console.log('UserId is required');
            return res.status(200).send({error: true, message: 'UserId is required'});
        }
        mangopayApi.CardRegistrations.create({
            UserId: req.body.UserId,
            Currency: 'EUR'
        }).then((mangoRes: any) => {
            return res.status(200).send({data: mangoRes});
        }).catch((errorRes: any) => {
            console.log(errorRes);
            return res.status(200).send({error: true, message: 'CardRegistration creation failed. Request error.', errorRes});
        });
    } catch (errorRes) {
        res.status(200).send({error: true, message: 'CardRegistration creation failed', errorRes});
    }
}

export async function updateCardRegistration(req: any, res: any) {
    try {
        if (!req || !req.body || !req.body.RegistrationData) {
            console.log('RegistrationData is required');
            return res.status(200).send({error: true, message: 'RegistrationData is required'});
        }
        if (!req || !req.body || !req.body.CardRegistrationId) {
            console.log('CardRegistrationId is required');
            return res.status(200).send({error: true, message: 'CardRegistrationId is required'});
        }
        const data = {RegistrationData: req.body.RegistrationData, Id: req.body.CardRegistrationId};
        mangopayApi.CardRegistrations.update(data).then((mangoRes: any) => {
            return res.status(200).send({data: mangoRes});
        }).catch((errorRes: any) => {
            console.log(errorRes);
            return res.status(200).send({error: true, message: 'CardRegistration creation failed. Request error.', errorRes});
        });
    } catch (errorRes) {
        res.status(200).send({error: true, message: 'CardRegistration creation failed', errorRes});
    }
}

export async function createNaturalUsers(req: any, res: any) {
    try {
        if (!req || !req.body) {
            console.log('User Info is required');
            return res.status(200).send({error: true, message: 'User Info is required'});
        }
        console.log(req.body);
        mangopayApi.Users.create({...req.body, PersonType: 'NATURAL'}).then((mangoRes: any) => {
            return res.status(200).send({data: mangoRes});
        }).catch((errorRes: any) => {
            console.log(errorRes);
            return res.status(200).send({error: true, message: 'User creation failed. Request error.', errorRes});
        });
    } catch (errorRes) {
        res.status(200).send({error: true, message: 'User creation failed', errorRes});
    }
}

export async function createBankAccount(req: any, res: any) {
    try {
        if (!req || !req.body) {
            console.log('Request body is empty');
            return res.status(200).send({error: true, message: 'Request body is empty'});
        }
        console.log(req.body);
        if (!req || !req.body.UserId) {
            console.log('UserId is required');
            return res.status(200).send({error: true, message: 'UserId is required'});
        }
        if (!req || !req.body.bankAccount) {
            console.log('Bank account info is required');
            return res.status(200).send({error: true, message: 'Bank account info is required'});
        }
        mangopayApi.Users.createBankAccount(
            req.body.UserId, {...req.body.bankAccount, Type: 'IBAN'}
        ).then((mangoRes: any) => {
            return res.status(200).send({data: mangoRes});
        }).catch((errorRes: any) => {
            console.log(errorRes);
            return res.status(200).send({error: true, message: 'Bank account creation failed. Request error.', errorRes});
        });
    } catch (errorRes) {
        res.status(200).send({error: true, message: 'Bank account creation failed', errorRes});
    }
}

export async function createWallet(req: any, res: any) {
    try {
        if (!req || !req.body) {
            console.log('wallet info is required');
            return res.status(200).send({error: true, message: 'wallet info is required'});
        }
        console.log(req.body);
        mangopayApi.Wallets.create(req.body).then((mangoRes: any) => {
            return res.status(200).send({data: mangoRes});
        }).catch((errorRes: any) => {
            console.log(errorRes);
            return res.status(200).send({error: true, message: 'Wallet creation failed. Request error.', errorRes});
        });
    } catch (errorRes) {
        res.status(200).send({error: true, message: 'Wallet creation failed', errorRes});
    }
}

export async function getUserCards(req: any, res: any) {
    try {
        if (!req || !req.body || !req.body.UserId) {
            console.log('UserId info is required');
            return res.status(200).send({error: true, message: 'UserId info is required'});
        }
        console.log(req.body);
        mangopayApi.Users.getCards(req.body.UserId).then((mangoRes: any) => {
            return res.status(200).send({data: mangoRes});
        }).catch((errorRes: any) => {
            console.log(errorRes);
            return res.status(200).send({error: true, message: 'Cards were not found. Request error.', errorRes});
        });
    } catch (errorRes) {
        res.status(200).send({error: true, message: 'Cards were not found', errorRes});
    }
}

export async function getAccessToken(req: any, res: any) {
    const dbData = await firestoreDB.collection('igToken').doc('1').get();
    const data = dbData.data();
    if (!data) {
        console.error('IG token was deleted!!')
        return res.status(400);
    }
    return res.status(200).send({token: data.token});
}

export async function mangoPaySale(coachee: any, coach: any){
    const payIn: any = {
        "AuthorId": coachee.mangoUserId,
        "CreditedWalletId": coach.mangoWallet,
        "PaymentType": "CARD",
        "ExecutionType": "DIRECT",
        // TODO: handle amount in website
        "DebitedFunds": {"Currency": coach.currency, "Amount": coach.price * 100},
        "Fees": {"Currency": "EUR", "Amount": 0},
        "SecureModeReturnURL": "https://succeed.world/",
        "CardId": coachee.mangoCardId,
        "SecureMode": "DEFAULT",
        "StatementDescriptor": "Succeed",
        "Culture": "EN"
    };

    const payInRes = await mangopayApi.PayIns.create(payIn);
    console.log('Session successfully charged: ' + JSON.stringify(payInRes))
}

export async function mangoPayPayout(coach: any) {
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
