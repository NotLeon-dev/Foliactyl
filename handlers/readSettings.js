import fs from 'fs';
import yaml from 'js-yaml';

export function settings() {
   let settings = yaml.load(fs.readFileSync('./settings.yml', 'utf8'));
   if (settings.pterodactyl.domain.endsWith("/")) settings.pterodactyl.domain.slice(0, -1);
   if (settings.api.client.oauth2.link.endsWith("/")) settings.api.client.oauth2.link.slice(0, -1); 
   return settings;
}
