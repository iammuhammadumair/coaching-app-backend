import { firestoreDB } from '.';

export async function getGoogleCalendarAccessToken(req: any, res: any, oauth2Client: any) {
    try {
        const {code, user} = req.body;
        // This will provide an object with the access_token and refresh_token.
        // Save these somewhere safe so they can be used at a later time.
        const {tokens} = await oauth2Client.getToken(code);

        // save tokens
        const usersRef = firestoreDB.collection('users');
        usersRef.doc(user).update({
            gcTokens: tokens,
            gcEnabled: true
        }).then(() => {
            return res.status(200).send();
        }).catch((error: any) => {
            console.log(error);
            return res.status(400).send('Error saving tokens');
        });
    }
    catch(e) {
        console.error(e);
        return res.status(400).send(e);
    }
}
