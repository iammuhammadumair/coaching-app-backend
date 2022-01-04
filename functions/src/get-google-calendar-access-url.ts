export function getGoogleCalendarAccessUrl(req: any, res: any, oauth2Client: any) {
    try {
        // generate a url that asks permissions for Blogger and Google Calendar scopes
        const scopes = ['https://www.googleapis.com/auth/calendar'];

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes
        });
        res.status(200).send({url});
    }
    catch(e) {
        console.error(e);
        res.status(400).send(e);
    }
}
