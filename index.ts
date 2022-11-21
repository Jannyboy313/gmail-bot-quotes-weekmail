const fs = require('fs').promises;
import path from 'path';
import process from 'process';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import { writeFileSync } from 'fs';

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  let authenticatedClient = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (authenticatedClient.credentials) {
    await saveCredentials(authenticatedClient);
  }
  return authenticatedClient;
}

authorize().then(async auth => {
  var emailIds = await retrieveEmailIds(auth);
  await processEmailIds(auth, emailIds);
}).catch(console.error);

async function retrieveEmailIds(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const response = await gmail.users.messages.list({
    userId: "me",
    q: "from:(intern@vslcatena.nl) Wekelijkse Catena Blijheid after:2022/9/5"
    // q: "from:(intern@vslcatena.nl) Wekelijkse Catena Blijheid after:2022/10/9 before:2022/10/12"
  });

  const emails = response.data.messages;

  if (!emails || emails.length === 0) {
    console.log('No messages found.');
    return;
  }

  const emailIds = [];

  emails.forEach(element => {
    emailIds.push(element.id);
  })

  return emailIds;
}

async function processEmailIds(auth, emailIds) {
  const quoteMails = [];
  const gmail = google.gmail({version: 'v1', auth});
  for await (const emailId of emailIds) {
    const message = await gmail.users.messages.get({
      userId: "me",
      id: emailId,
      format: "full"
    });

    var date = getDate(message.data.payload.headers);

    var rawQuotes = getRawQuotes(message);
    var processedQuotes = processQuotes(rawQuotes);
    quoteMails.push({
      receiveDate: date,
      quotes: processedQuotes
    })
  }

  // Writes it to a json file.
  writeFileSync('./testing.json', JSON.stringify(quoteMails), {
    flag: 'w'
  })
}

function getDate(headers) {
  for (let i=0; i<headers.length; i++) {
    if (headers[i].name === "Date") {
      var date = new Date(headers[i].value);
      return date.toLocaleDateString("en-GB");
    }
  }
}

function getRawQuotes(message) {
  const parts = message.data.payload.parts;
  const body = Buffer.from(parts[0]['body'].data, 'base64').toString('utf8');
  let quotesPart = body.split("Quotes van de Week");
  quotesPart = quotesPart[quotesPart.length -1].split("Heb je (een) betere quote(s)? Stuur hem dan snel naar de")[0].split("\r\n");
  var rawQuotes = [];
    quotesPart.forEach(element => {
    if (element.length > 3) {
      rawQuotes.push(element);
    }
  })
  return rawQuotes;
}

function processQuotes(rawQuotes) {
  const processedQuotes = [];
  var temp = "";
  rawQuotes.forEach(element => {
    var processed = element.trim();
    if (processed[0] !== '-') {
      if (temp.length === 0) {
        temp += processed;
      } else {
        temp += " " + processed;
      }
    } else {
      processed = processed.slice(1).trim();
      processedQuotes.push({
        quote: temp,
        name: processed
      })
      temp = "";
    }
  })
  return processedQuotes;
}