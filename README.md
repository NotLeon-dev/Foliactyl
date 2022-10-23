# Faliactyl V3 • The best Pterodactyl Control Panel
Making a free or paid host and need a way for users to sign up, earn coins, manage servers? Try out Faliactyl.
To get started, scroll down and follow the guide

# All features:
- Resource Management (gift, use it to create servers, etc)
- Coins (AFK Page earning, Join for Rewards)
- Coupons (Gives resources & coins to a user)
- Servers (create, view, edit servers, set server creation cost)
- User System (auth, regen password, etc)
- Store (buy resources with coins, limits)
- Dashboard (view resources & servers from one area)
- Join for Rewards (join discord servers for coins)
- Admin (set/add/remove coins & resources, create/revoke coupons)
- Webhook (Logs actions)
- Gift (Share coins/resources with anyone)
- Stripe API (buy coins via stripe)
- Mail Server (SMTP support)
- Linkvertise Earning
- Role Packages (get packages via roles)
- Coin Leaderboard
- AFK Party/Party Mode
- API System
- Whitelist System
- Email Verifier
- No login system (if user doesn't login for a number of days, it deletes servers and account.)
- Anti VPN System
- Referral system
- Blacklist system

# Install Guide
**Ubuntu and Debian**
Firstly, make sure that you have all the prerequisites above installed (if you do you can skip this part).
```
sudo apt update && sudo apt upgrade
  
# Installing git
sudo apt install git

# Installing NodeJS
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs
```
Now to install Faliactyl and its dependencies   
```
git clone https://github.com/Zircon-Dev/Faliactyl.git
cd Faliactyl && npm install
```
**Windows**
Firstly, make sure that you have all the prerequisites above installed (if you do you can skip this part).
```
# Installing git
sudo dnf install git-all
# Installing NodeJS
sudo choco install nvs
nvs add latest
```
Now to install Faliactyl and its dependencies   
```
git clone https://github.com/Zircon-Dev/Faliactyl.git
cd Faliactyl && npm install
```
**Configuring your Settings**
Because the ``settings.yml`` file is so large, this page will break down and explain each individual section.
```
name: Faliactyl
icon: https://cdn.discordapp.com/attachments/998170574843035720/1003467646769057882/unknown.png
defaulttheme: default
version: 3.1.0
website:
  port: 8080
  secret: Example Secret
```
The start of the settings file; The ``name`` is the name used for all placeholders. The ``icon`` is used for all page icons. The ``defaulttheme`` is the theme you are using for Faliactyl, default is Falcon. The ``version`` is the Faliactyl version. The ``website port`` is the port that Faliactyl is listening on. The ``website secret`` is a randomly genererated password that you must keep secret as it it is what the dashboards sessions are encrypted with. 
```
discordserver:
  enabled: true
  invitelink: https://discord.com/example
```
You can choose to either disable the discord links from all pages by setting enabled to false; Replace invite link with your discord server invite link.
```
ads:
  enabled: false
  script: '
```
You can choose to either disable the ads from all pages by setting enabled to false; Replace script with your AD script.
```
guildblacklist:
  guilds:
  - ServerID
  - ServerID
```
You can blacklist people if they are in a certain server; Replace ServerID with the server's ID you want to blacklist.
```
pterodactyl:
  domain: https://panel.example.com
  key: API KEY
```
Replace domain with your Pterodactyl domain; Create a API Key with all permissions and paste it to key.
```
storelimits:
  ram: 8192
  disk: 16384
  cpu: 400
  databases: 4
  allocations: 4
  backups: 4
```
Here you can set the store limits for each user.
```
AFK Party: 
  enabled: false
  webhook: ""
  users: 1
  multiplier: 2
```
Warning: This feature only works with AFK Page & Arc.io enabled; Set enabled to true if you want to enable AFK Party. Add your discord webhook at webhook. Replace users with how many users you want for AFK Party to be enabled; Replace multiplier with the multiplier you want for the coins.
```
linkvertise:
  enabled: false
  userid: 00000
  coins: 25
```
Here you can enable Linkvertise earning by settings enabled to true; Replace userid with your Linkvertise UserID. Replace coins with the amount of coins you want the user to get after completing a Linkvertise link.
```
status:
  enabled: false
  script: https://example.com
```
Here you can enable status page which will embed HetrixTools status page; Replace the script with your Hetrix page script.
```
stripe:
  enabled: false  
  key: 0000000000 # Replace this with your Stripe API Key
  coins: 200 # Coins per amount in USD
  amount: 1
```
Here you can enable Stripe which will give the option to buy coins for money; Set key to your Stripe API Key. Set coins to the coins you want the user to receive based on the amount section.
```
smtp:
  enabled: true
  mailfrom: support@example.com
  host: mail.example.com
  port: 465
  username: support@example.net
  password: PASSWORD
```
Here you can enable SMTP server which is required for some features; Replace mailfrom with the email you are sending requests from. Replace host with the host of SMTP server. Replace port with the port of SMTP server. Replace username with the username of SMTP server. Replace password with the password of the SMTP server.
```
server:
    enabled: false
    key: API KEY
```
Here you can enable server-side API by setting enabled to true; Set key to the API Key you want for the Authorization.
```
j4r: 
    enabled: false
    ads:
    - name: Example Server 1
      id: 933803406513012807
      invite: https://discord.gg/7m5d4K8Mwg
      coins: 50
    - name: Example Server 2
      id: 933803406513012807
      invite: https://discord.gg/7m5d4K8Mwg
      coins: 50
```
Here you can enable J4R which will give users coin for joining discord servers; Replace name with the name of Discord Server; Replace ID with the ID of the discord server; Replace invite with the invite link of the discord server; Replace coins with the amount of coins you want the user to recieve if they join the discord server.
```
Role Packages:
    enabled: false
    Server: SERVERID 
    list: 
        RoleID: Package Name 
```
Here you can enable Role Packages which will give a user a certain package for having a certain role; Replace SERVERID with the Server ID. REplace ROLEID with the ID of the role. Replace Package Name with the name of the package the user should recieve.
```
bot:
    token: ""
    joinguild:
        enabled: false
        guildid:
        - SERVERID
        - SERVERID
        forcejoin: false
        registeredrole: ""    
```
Firstly create a discord bot; Replace token with the token of the discord bot. You can set enabled to true in join guild if you want the users to join the discord server. Replace ServerID with your server id (you can add as many as you want). You can enable forcejoin which will forcefully join users into the discord server while logging in. Replace registeredrole with the role you want to give the user once they signed up (to disable it, set registeredrole to null).
```
webhook:
  webhook_url: ""
  auditlogs:
    enabled: false
    disabled: []
```
Here is where you can enable dashboard logging; Add discord webhook to webhook_url and set enabled to true.
```
passwordgenerator:
  signup: true # Use this to disable signups
  length: 8
```
You can disable signup's by setting signup to false; The length is the length of password generated for user on the Pterodactyl panel.
```
allow:
  gift: true
  newusers: true
  regen: true
  server:
    create: true
    modify: true
    delete: true
```
Here is where you can disable certain features; Set the feature to false if you want to disable.
```
oauth2: # Discord OAUTH2
  id: ""
  secret: ""
  link: "https://dash.example.com"
  callbackpath: "/callback"
  prompt: true
```
Set ID to client ID of discord bot. Set secret to client secret of discord bot. Create a redirect link in discord developer with your dashboard URL and /callback. Set link to the link of your dashboard without the /callback.
```
ip:
  trust x-forwarded-for: true
  block: []
  duplicate check: false
```
Here is where you can block certain IPs from logging in by adding their IP in block section; You can also enable duplicate check which will check for alt accounts and block them from signing up.
```
packages:
  default: default
  list:
    default:
      ram: 1024
      disk: 1024
      cpu: 100
      servers: 1
      databases: 2
      allocations: 2
      backups: 2
```
Here is where you can create and set certain packages; The default package is called default and you can edit it.
```
locations:
  '1':
    name: EXAMPLE LOCATION
    package: null
```
Here is where you can add/set locations; Replace 1 with the location ID. Replace name with location name. If you want a certain package to have access of location, set package to the name of the package.
```
eggs:
  paper:
    display: Minecraft Java (Paper)
    minimum:
      ram: 512
      disk: 512
      cpu: 25
    maximum:
      ram: 8000
      disk: 16000
      cpu: 400
    info:
      egg: 15
      docker_image: ghcr.io/pterodactyl/yolks:java_17
      startup: java -Xms128M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true -jar {{SERVER_JARFILE}}
      environment:
        MINECRAFT_VERSION: "latest"
        SERVER_JARFILE: "server.jar"
        DL_PATH: ""
        BUILD_NUMBER: "latest"
      feature_limits:
        databases: 2
        backups: 2
```
This is the default egg for Faliactyl; You can add more or edit this one.
```
coins:
  enabled: true
  store:
    enabled: true
    ram:
      cost: 100
      per: 1
    disk:
      cost: 100
      per: 1
    cpu:
      cost: 100
      per: 1
    servers:
      cost: 100
      per: 1
    databases:
      cost: 100
      per: 1
    ports:
      cost: 100
      per: 1
    backups:
      cost: 100
      per: 1
```
Here you can edit store prices or disable coins; To disable coins set enabled to false. To disable store set enabled under store to false; 
```
minero:
  enabled: false
  key: Minero Public Key
```
Here you can enable minero miner; Add your Minero Public Key in key and set enabled to true.
```
arcio:
  enabled: false
  widgetid: WIDGETID
  afk page:
    enabled: false
    path: faliactyl_endpoint1
    every: 10
    coins: 1
    coinlimit: 50
```
Here you can enable arcio earning and afk page; Add your Arc.io widget ID to widgetid. You can disable daily coin limit by setting it to false. Every certain seconds it will give certain coins.
```
referral:
  coins: 1000 
```
Here is the settings for Referral system; Replace coins with how many coins you want the user and the person who invited the user to receive.
```
whitelist:
  enabled: false
  users:
    - Email Address
```
Here you can enable whitelist only system; Add the email address you want to whitelist under users and set enabled to true.
```
blacklist:
  enabled: false
  users:
    - Email Address
```
Here you can enable blacklist system; Add the email address you want to blacklist under users and set enabled to true.
```
servercreation:
  cost: 0
```
Here you can set certain price for creating a server.
```
renewal: 
  enabled: false
  cost: 200
  delay: 3 
```
Here you can enable renewal system where the user has to pay certain coins per certain days for every server. In cost add the coins you want. In delay add the number of days after the user has to renew.
```
AntiVPN:
  enabled: false
  key: KEY
  whitelistedIPs:
    - IP Address
```
Here you can enable AntiVPN system; Add your Proxycheck API Key to key. You can add any whitelisted IP addresses you want under whitelistedIPs
```
widget:
  enabled: false
  server_id: GUILD_ID
  channel_Id: CHANNEL_ID
```
Here is where you can enable Widget Bot; Invite the bot in your server first. Set server_id to your server ID. Set channel_Id to your channel ID.
**Setting up Domain**
Point the domain that you are using to your server IP address using an A record.
Installing Nginx and Certbot
```
sudo apt install nginx
sudo apt install certbot
sudo apt install -y python3-certbot-nginx
```
Installing SSL certificate
```
systemctl start nginx
certbot certonly --nginx -d <FALIACTYL_DOMAIN>
```
Make sure to replace ``<FALIACTYL_DOMAIN>`` with your domain name. If you have done this correctly you should see something similar to the following:
```
IMPORTANT NOTES:
- Congratulations! Your certificate and chain have been saved at:
  /etc/letsencrypt/live/your.faliactyl.domain/fullchain.pem
  Your key file has been saved at:
  /etc/letsencrypt/live/your.faliactyl.domain/privkey.pem
  Your cert will expire on date. To obtain a new or tweaked
  version of this certificate in the future, simply run certbot
  again. To non-interactively renew *all* of your certificates, run
  "certbot renew"
- If you like Certbot, please consider supporting our work by:

  Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
  Donating to EFF:                    https://eff.org/donate-le
```
If what you saw isn't similar to what you saw in your server, we recommend you ask for support on Faliactyl Discord Server: https://discord.gg/TYCRTGMmHK

Next, if everything's going correctly, you need to go to the Nginx sites directory and create a configuration file:
```
nano /etc/nginx/sites-enabled/faliactyl.conf
```
Now paste the following into the file. Make sure to replace ``<DOMAIN>`` and ``<PORT>`` with your Faliactyl domain and the port Faliactyl is running on.
```
server {
  listen 80;
  server_name <DOMAIN>;
  return 301 https://$server_name$request_uri;
}
server {
  listen 443 ssl http2;
                      
  server_name <DOMAIN>;
  ssl_certificate /etc/letsencrypt/live/<DOMAIN>/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/<DOMAIN>/privkey.pem;
  ssl_session_cache shared:SSL:10m;
  ssl_protocols SSLv3 TLSv1 TLSv1.1 TLSv1.2;
  ssl_ciphers  HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;
                      
  location / {
    proxy_pass http://localhost:<PORT>/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_buffering off;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```
Once you have edited, saved, and symlinked your configuration file, restart Nginx with:
```
systemctl restart nginx
```
You should see it running on that domain with SSL!
**Starting Faliactyl**
First we need to install pm2
```
npm install pm2 -g
```
Now you need to go to the Faliactyl directory and use:
```
pm2 start index.js
```
Once you have started Faliactyl, head to the Dashbard URL and Faliactyl should be live!

If there is any Nginx error page such as 502 Bad Gateaway, it means Faliactyl is down.

You can check logs using:
```
pm2 logs
```
If you need help installing, we recommend you ask for support on Faliactyl Discord Server: https://discord.gg/TYCRTGMmHK
