import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { Request } from 'firebase-functions/lib/providers/https';
import * as moment from 'moment-timezone';
import * as nodemailer from 'nodemailer';
import * as smtpTransport from 'nodemailer-smtp-transport';
import * as OpenTok from 'opentok';

import {
  onCancelledBooking,
  sendEmailOnBookingCancel,
  sendEmailOnBookingCreate,
  sendEmailOnContactMessageCreate,
  sendMessageOnCreate,
  sendNotificationOnRatingCreate,
} from './functions-firestore';
import {
  createBankAccount,
  createCardRegistration,
  createNaturalUsers,
  createSession,
  createWallet,
  getAccessToken,
  getUserCards,
  updateCardRegistration,
} from './functions-http';
import {
  everyTwoDaysScheduledFunction,
  firstOfMonthScheduledFunction,
  fiveMinutesScheduledFunction,
} from './functions-scheduled';
import {
  getGoogleCalendarAccessToken,
} from './get-google-calendar-access-token';
import { getGoogleCalendarAccessUrl } from './get-google-calendar-access-url';

// const { OAuth2 }  = google.auth;
const { google } = require("googleapis");

export class Booking {
  id?: string;
  date?: any;
  client?: string;
  coach?: string;
  timeSlot?: string;
}

const cors = require("cors")({ origin: true });
const opentokConfig = {
  apikey: "46729622",
  secret: "eb6fce8b4f84f34b9778a9802ee5d4a4c1222f5f",
};
const opentok = new OpenTok(opentokConfig.apikey, opentokConfig.secret);

const oauth2Client = new google.auth.OAuth2(
  "938975470837-3norgd08a5j33dmpojq4ptl9utdf98qm.apps.googleusercontent.com",
  "nDjMYbDM2OwbAzfEHLaAttse",
  "https://app-3dhomes-prod.web.app/calendar-redirect"
);
// const oauth2Client = new google.auth.OAuth2(
//     "938975470837-3norgd08a5j33dmpojq4ptl9utdf98qm.apps.googleusercontent.com",
//     "nDjMYbDM2OwbAzfEHLaAttse",
//     "https://app-3dhomes-prod.web.app/calendar-redirect"
//   );

// const oauth2Client = new google.auth.OAuth2(
//     '477139402419-3gp8e2aqleo9cadrles5tj30vgch4oi4.apps.googleusercontent.com',
//     'tAHQX0eNY_St9e5LfZDDgQSP',
//     'https://app-3dhomes-prod.web.app/calendar-redirect'
// );

// import * as apiFunctions from './apis/index';
// import * as triggerFunctions from './triggers/index';

oauth2Client.setCredentials({
  refresh_token:
    "1//045zcEc7bm0QQCgYIARAAGAQSNwF-L9IrNPx4Gcl9GFl3rXvi8Y1piSrNMpI_fAGGHspxlgY0iExFs0Pjb45Q_BPqLatDCoYRDno",
});

// const calendar: google.calendar({version:'v3', auth:oauth2Client})
admin.initializeApp();

// initialize the db
export const firestoreDB = admin.firestore();

// sendMessagesOnCreate is a cloud function triggered when a new record is inserted in the collections /messages
// it takes the message fields to compose the email message
exports.sendMessageOnCreate = functions.firestore
  .document("/messages/{messageId}")
  .onCreate(async (snap, context) => {
    return await sendMessageOnCreate(snap);
  });

exports.sendEmailOnContactMessageCreate = functions.firestore
  .document("/contactMessages/{contactMessageId}")
  .onCreate(async (snap, context) => {
    return await sendEmailOnContactMessageCreate(snap);
  });

exports.sendEmailOnBookingCreate = functions.firestore
  .document("/bookings/{bookingId}")
  .onCreate(async (snap, context) => {
    return await sendEmailOnBookingCreate(snap, oauth2Client);
  });

exports.sendEmailOnBookingCancel = functions.firestore
  .document("/bookings/{bookingId}")
  .onDelete(async (snap, context) => {
    return await sendEmailOnBookingCancel(snap);
  });

exports.fiveMinutesScheduledFunction = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async () => fiveMinutesScheduledFunction());

exports.everyTwoDaysScheduledFunction = functions.pubsub
  .schedule("every 48 hours")
  .onRun(async () => everyTwoDaysScheduledFunction());

exports.firstOfMonthScheduledFunction = functions.pubsub
  .schedule("0 0 1 * *")
  .onRun(async () => firstOfMonthScheduledFunction());

// Send message to the coach if the client rated 1 star
exports.sendNotificationOnRatingCreate = functions.firestore
  .document("/ratings/{ratingId}")
  .onCreate(async (snap, context) => {
    return await sendNotificationOnRatingCreate(snap);
  });

exports.cancelledBooking = functions.firestore
  .document("/bookings/{bookingId}")
  .onDelete(async (snap, context) => {
    return await onCancelledBooking(snap);
  });

exports.createSession = functions.https.onRequest(
  (req: Request, res: functions.Response) => {
    cors(req, res, () => createSession(req, res, opentok));
  }
);

exports.getGoogleCalendarAccessUrl = functions.https.onRequest(
  (req: Request, res: functions.Response) => {
    cors(req, res, () => getGoogleCalendarAccessUrl(req, res, oauth2Client));
  }
);

exports.getGoogleCalendarAccessToken = functions.https.onRequest(
  (req: Request, res: functions.Response) => {
    cors(req, res, () => getGoogleCalendarAccessToken(req, res, oauth2Client));
  }
);

exports.createCardRegistration = functions.https.onRequest(
  (req: Request, res: functions.Response) => {
    cors(req, res, () => createCardRegistration(req, res));
  }
);

exports.updateCardRegistration = functions.https.onRequest(
  (req: Request, res: functions.Response) => {
    cors(req, res, () => updateCardRegistration(req, res));
  }
);

exports.createNaturalUsers = functions.https.onRequest(
  (req: Request, res: functions.Response) => {
    cors(req, res, () => createNaturalUsers(req, res));
  }
);

exports.createBankAccount = functions.https.onRequest(
  (req: Request, res: functions.Response) => {
    cors(req, res, () => createBankAccount(req, res));
  }
);

exports.createWallet = functions.https.onRequest(
  (req: Request, res: functions.Response) => {
    cors(req, res, () => createWallet(req, res));
  }
);

exports.getUserCards = functions.https.onRequest(
  (req: Request, res: functions.Response) => {
    cors(req, res, () => getUserCards(req, res));
  }
);

exports.getAccessToken = functions.https.onRequest(
  (req: Request, res: functions.Response) => {
    cors(req, res, () => getAccessToken(req, res));
  }
);

//export async function sendBookingReminderToCoach(booking: Booking): Promise<boolean> {
export async function sendBookingReminderToCoach(
  booking: Booking
): Promise<boolean> {
  const coach = await getBookingCoach(booking);
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
    strDate = jsdate.format("MMMM Do, YYYY h:mma");
    strDate += ` (${jsdate.tz()})`;
  } else {
    jsdate = moment(bookingDate);
    strDate = jsdate.format("MMMM Do, YYYY h:mma");
  }
  const body =
    `This is a reminder that your coaching session via Succeed takes place on ${strDate}. Please when the time is due, log in to your account on Succeed, open your calendar and click on the respective date. Then you see a green button with the name of your coachee that takes you to your coaching space.` +
    `\n\nThe Succeed team` +
    `\nhttps://succeed.world`;

  // Send coach email
  console.log(`Sending reminder email to ${coach.email}`);
  return await sendEmail({
    from: gmailEmail,
    to: `${coach.email}`,
    subject: `Session reminder`,
    text: body,
  });
}

export async function getBookingCoach(booking: Booking) {
  try {
    if (!booking.coach) {
      return;
    }
    return getCoachById(booking.coach);
  } catch (e) {
    console.log(e);
  }
}
export async function getCoachById(coachId: string): Promise<any> {
  try {
    const coachData = await firestoreDB
      .collection("coaches")
      .doc(coachId)
      .get();
    const coach = coachData.data();
    return coach ? { ...coach, id: coachId } : null;
  } catch (e) {
    console.log("error in function: getCoachById");
    console.log(e);
    return;
  }
}
export async function sendEmail(mailOptions: any): Promise<boolean> {
  console.log(mailOptions);
  return new Promise((resolve) => {
    nodemailer
      .createTransport(
        smtpTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: "nlpsucceed@gmail.com",
            pass: "Succeed1234",
          },
        })
      )
      .sendMail(mailOptions, (error: any, info: any) => {
        if (error) {
          console.log("error: " + error);
          resolve(false);
        } else {
          console.log("The message has been sent: " + info);
          resolve(true);
        }
      });
  });
}

exports.freeIntakeRequest = functions.firestore
  .document("/FreeIntakeRequest/{FreeIntakeRequestId}")
  .onCreate(async (snap, context) => {
    // Get an object representing the document
    const newMessage = snap.data();
    let autthData = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "nlpsucceed@gmail.com",
        pass: "Succeed1234",
      },
    });

    // send email to admin
    await autthData.sendMail({
      from: newMessage.ClientEmail,
      replyTo: newMessage.AdminEmail,
      to: newMessage.AdminEmail,
      subject: newMessage.subject,
      text:
        `Hi Yosara` +
        `${newMessage.coachName} has been booked for a free intake.` +
        `\nby ${newMessage.ClientName}` +
        `\nEmail: ${newMessage.ClientEmail}` +
        `\nYour Succeed team` +
        `\nFounder`,
    });
    // send email to coach
    await autthData.sendMail({
      from: newMessage.AdminEmail,
      replyTo: newMessage.AdminEmail,
      to: newMessage.CoachEmail,
      subject: newMessage.subject,
      text:
        `Hello ${newMessage.coachName}` +
        `\nA new client has booked a Free Intake with you.` +
        `\nMake it a good one, we count on your qualities that make our client book more sessions with you. ` +
        `\n\nKindest regards,` +
        `\nYour Succeed team` +
        `\nFounder`,
    });

    // send email to client
    await autthData.sendMail({
      from: newMessage.AdminEmail,
      replyTo: newMessage.AdminEmail,
      to: newMessage.ClientEmail,
      subject: newMessage.subject,
      text:
        `Hello ` +
        `Thank you for trying a free intake with ${newMessage.coachName}` +
        `\nWe hope that you booked the right coach for you!` +
        `\nHave you signed up with us already?` +
        `\nWe need you to do that in order to make Succeed work for you. ` +
        `\nTo have your free intake, you sign in and open your calendar in your account ` +
        `\nor tap the button “my bookings” on the Succeed homepage. ` +
        `\nYou will see the name of your coach. ` +
        `Tap on that name and your video call opens.` +
        `\nWe wish you a very good session.` +
        `\n\nKindest regards,` +
        `\nYour Succeed team` +
        `\nFounder`,
    });
  });
