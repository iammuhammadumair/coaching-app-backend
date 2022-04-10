// import * as braintree from 'braintree';
import * as payoutSDK from '@paypal/payouts-sdk'
import { getTransaction, getBookingCoach,getBookingClient,updateTransaction } from './utils';
import * as functions from 'firebase-functions';


console.log(functions.config())

/**
 *
 * Returns PayPal HTTP client instance with environment that has access
 * credentials context. Use this instance to invoke PayPal APIs, provided the
 * credentials have access.
 */
function client() {
  return new payoutSDK.core.PayPalHttpClient(environment());
}

/**
*
* Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
* This sample uses SandboxEnvironment. In production, use LiveEnvironment.
*
*/
function environment() {
  const clientId = functions.config().paypal.paypal_client_id ||  'AYbq8tIvOV3o3xc4GFxM9H6gbTkpBpveKweOh_E0_ETWbjt0G6TtE0mFwiaW6IuMqRRSkDNKqCDMzV5s';
  const clientSecret = functions.config().paypal.paypal_client_secret || 'EOxYBFJMbfkBgxhMxQo4umrxBIb7v89tyIa0tCB8sPzDyg1R-Pb8g91paigD385OnHMG45YXQyTZbILl';

  if (functions.config().node.env === 'production') {
    return new payoutSDK.core.LiveEnvironment(clientId, clientSecret);
  }
  return new payoutSDK.core.SandboxEnvironment(clientId, clientSecret);

}


// const gateway = new braintree.BraintreeGateway({
//   environment: braintree.Environment.Sandbox,
//   merchantId: 'cgksn54rwb729qct',
//   publicKey: '4x7g2s2rkqkyhsqq',
//   privateKey: '4b2dbcced647fb77ca029173a1e405af'
// });




// async function getMerchantAccounts(){
  
  
//   let temp = {};
//   let myPromise = new Promise(function(myResolve, myReject) {
//     // let x = 0;
  
//   // The producing code (this may take some time)
//   gateway.merchantAccount.all((err, merchantAccounts) => {
//     if(merchantAccounts){
//       myResolve(merchantAccounts)
//     }else{
//       myReject(err);
//     }
    
//   });
//   });
  
//   const data = await myPromise.then(function(data){
//     return data;
//   })

//   await data.forEach((merchantAccount) => {
//     temp[merchantAccount.currencyIsoCode] = merchantAccount
//   });

//   return temp;
// }

// export async function createCustomerWithPayment(req: any, res: any) {
//   try {


//     const { firstName, lastName, paypalNonce } = req.body;

//     if (firstName && lastName && paypalNonce) {
//       gateway.customer.create({
//         firstName,
//         lastName,
//         paymentMethodNonce: paypalNonce
//       }).then(result => {
//         if (result.success) {
//           return res.status(200).send({ error: false, message: 'CustomerWithPayment created successfully. ', data: result })
//         } else {
//           return res.status(200).send({ error: true, message: 'CustomerWithPayment creation failed. ', result })
//         }
//       }).catch(err => {
//         return res.status(200).send({ error: true, message: 'CustomerWithPayment creation failed. ', err })
//       })
//     } else {
//       return res.status(200).send({ error: true, message: 'Provide the required parameters to create the customer.'})
//     }

//   } catch (errRes) {
//     console.log(errRes);
//     return res.status(200).send({ error: true, message: 'CustomerWithPayment creation failed. ', errRes })
//   }
// }

// export async function createPaymentMethod(req: any, res: any) {
//   try {

//     const { customerId, paypalNonce } = req.body;

//     if (customerId && paypalNonce) {

//       gateway.paymentMethod.create({
//         customerId,
//         paymentMethodNonce: paypalNonce
//       }).then(result => {
//         // console.log(result);
//         if (result.success) {
//           return res.status(200).send({ error: false, message: 'PaymentMethod created successfully. ', data: result })
//         } else {
//           return res.status(200).send({ error: true, message: 'PaymentMethod creation failed. ', result })
//         }
//       }).catch(err => {
//         return res.status(200).send({ error: true, message: 'PaymentMethod creation failed. ', err })
//       })
//     } else {
//       return res.status(200).send({ error: true, message: 'Provide the required parameters to create the payment method.' })
//     }

//   } catch (errRes) {
//     console.log(errRes);
//     return res.status(200).send({ error: true, message: 'PaymentMethod creation failed. ', errRes })
//   }
// }

// export async function updatePaymentMethod(req: any, res: any) {
//   try {

//     const { paymentMethodToken } = req.body;

//     if (paymentMethodToken) {

//       gateway.paymentMethod.update(paymentMethodToken, {
//         options: {
//           makeDefault: true
//         }
//       }).then(result => {
//         // console.log(result);
//         if (result.success) {
//           return res.status(200).send({ error: false, message: 'PaymentMethod updated successfully. ', data: result })
//         } else {
//           return res.status(200).send({ error: true, message: 'PaymentMethod updated failed. ', result })
//         }
//       }).catch(err => {
//         return res.status(200).send({ error: true, message: 'PaymentMethod updated failed. ', err })
//       })
//     }else{
//       return res.status(200).send({ error: true, message: 'Provide the required parameters to create the payment method'})
//     }

//   } catch (errRes) {
//     console.log(errRes);
//     return res.status(200).send({ error: true, message: 'PaymentMethod creation failed. ', errRes })
//   }
// }

// export async function findCustomer(req: any, res: any) {
//   try {

//     const { paypalUserId } = req.body;

//     if (paypalUserId) {
//       gateway.customer.find(paypalUserId)
//         .then(customer => {
//           // console.log(customer);
//           if (customer) {
//             return res.status(200).send({ error: false, message: 'Customer fetch successfully.', data: customer })
//           } else {
//             return res.status(200).send({ error: true, message: 'Customer failed to fetch.', customer })
//           }
//         }).catch(err => {
//           return res.status(200).send({ error: true, message: 'Customer failed to fetch.', err })
//         })
//       } else {
//       return res.status(200).send({ error: true, message: 'Provide the required parameters to find the customers.' })
//     }

//   } catch (errRes) {
//     console.log(errRes);
//     return res.status(200).send({ error: true, message: 'Customer failed to fetch.', errRes })
//   }
// }
// export async function paypalSale(coachee: any, coach: any) {
//   try {

//     const { paymentId } = coachee;

//     if (paymentId) {

//       const merchants = await getMerchantAccounts();

//       if(!Object.keys(merchants).length){
//         console.log('failed to get the merchants')
//         return;
//       }


//       const trans = await gateway.transaction.sale({
//         paymentMethodToken: paymentId,
//         amount: String(coach.price),
//         options: {
//           submitForSettlement: true
//         },
//         merchantAccountId: merchants[coach.currency].id
//       })

//       if(trans.success){
      
//         const transactionObject = {
//           status: 'pending',
//           paymentGateway: 'paypal',
//           client: coachee.id,
//           coach: coach.id,
//           transaction: {
//             id: trans.transaction['id'],
//             paymentId: trans.transaction['paypalAccount'].paymentId,
//             authorizationId: trans.transaction['paypalAccount'].authorizationId
//           }
//         }
//         await createTransactions(transactionObject)

//         return trans
//       } else {
//         console.log('Transaction failed: ',trans)
//         return trans
//       }
//     }

//   } catch (errRes) {
//     console.log('Transaction failed: ',errRes);
//     return errRes//res.status(200).send({error: true, message: 'Transaction Failed.', errRes})
//   }
// }

export async function paypalWebhook(req: any, res:any){
  
  // console.log(req.body)


  if(req.body.event_type === 'PAYMENT.CAPTURE.COMPLETED'){
    //get the transaction
    const transaction = await getTransaction(req.body.resource.id)

    if(!transaction) {
      console.log('unable to find record in transaction.')
      return;
    }
    const tdata  = transaction.docs[0].data()

    //get the coach

    if(tdata.status !== 'complete'){
      // const coach = await getBookingCoach({coach: tdata.coach})
      // const client = await getBookingClient({client: tdata.client});
      // const payout = await paypalPayout(coach,client)
      // if(payout.statusCode === 201) {
  
        const transactionObject = {
          status: 'complete',
          // "transaction.payoutBatchId": payout.result.batch_header.payout_batch_id
        }
  
        await updateTransaction(transaction.docs[0].id, transactionObject)
      // }else {
      //   console.log('Payout failed: ',payout)
      //   return;
      // }
    }else{
      console.log('Payout Completed Already.')
      return;
    }
  }
}


export async function paypalPayout(coach: any, clientt: any) {

  const coachCut = Math.round(coach.price * 0.83);
  const recipient_type = "EMAIL";

  const requestBody = {
    "sender_batch_header": {
      "recipient_type": recipient_type,
      "email_message": "Payment from " + clientt.firstname + " " + clientt.lastname,
      "note": "Enjoy your Payout!!",
      "sender_batch_id": String(new Date().getTime()),
      "email_subject": "Session Payout Transaction"
    },
    "items": [{
      "note": "Your " +coachCut+ "" + coach.currency + " Payout!",
      "amount": {
        "currency": coach.currency,
        "value": coachCut
      },
      "receiver": coach.paypalEmail,
      "sender_item_id": "Test_txn_1"
    }]
  }

  // Construct a request object and set desired parameters
  // Here, PayoutsPostRequest() creates a POST request to /v1/payments/payouts
  const request = new payoutSDK.payouts.PayoutsPostRequest();
  request.requestBody(requestBody);

  try {
    const response = await client().execute(request);
    // console.log(`Response: ${JSON.stringify(response)}`);
    // If call returns body in response, you can get the deserialized version from the result attribute of the response.
    // console.log(`Payouts Create Response: ${JSON.stringify(response.result)}`);

    return response
  } catch (e) {
    if (e.statusCode) {
      //Handle server side/API failure response
      console.log("Status code: ", e.statusCode);
      // Parse failure response to get the reason for failure
      const error = JSON.parse(e.message)
      console.log("Failure response: ", error)
      console.log("Headers: ", e.headers)

      return e
    } else {
      //Hanlde client side failure
      console.log(e)
      return e
    }
  }

}