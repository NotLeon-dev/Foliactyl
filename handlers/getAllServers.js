import { settings } from './readSettings.js';
import fetch from 'node-fetch';

const settingsData = settings();

export default async function getAllServers() {
    const rawData = await fetch(
        `${settingsData.pterodactyl.domain}/api/application/servers?per_page=99999999`, {
            headers: {
                "Authorization": `Bearer ${settingsData.pterodactyl.key}`
            }
        }
    );
    return await rawData.json();
}

