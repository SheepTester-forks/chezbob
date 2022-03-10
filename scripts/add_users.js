#! /usr/bin/env node
import {db} from "../server/db.js";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "readline/promises";

const rl = readline.createInterface({input, output});
const emails = [];

rl.on('line', (line) => {
    const email = line.trim();
    const split = email.split('@');
    if (split.length !== 2) {
        console.error(`Invalid email: '${email}'`);
        return;
    }
    const username = split[0];
    emails.push({email, username});
});

rl.on('close', async () => {
    const conflicts = await db("users").select(['username', 'email'])
        .whereIn('username', emails.map(e => e.username))
        .orWhereIn('email', emails.map(e => e.email));

    if (conflicts.length > 0) {
        console.error(`Found ${conflicts.length} conflicts`);
        for (let c of conflicts) {
            console.log(c.username, "\t", c.email);
        }
    }

    const conflictingEmails = new Set(conflicts.map(c => c.email));
    const conflictingUsernames = new Set(conflicts.map(c => c.username));
    const validEmails = emails.filter(e => !conflictingEmails.has(e.email) && !conflictingUsernames.has(e.username));

    console.log(`Inserting ${validEmails.length} emails.`);
    if (validEmails.length > 0) {
        await db("users").insert(validEmails);
    }
    console.log("Done");
    process.exit(0);
})