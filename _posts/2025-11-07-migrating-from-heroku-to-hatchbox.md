---
layout: post
title:  "Migrating from Heroku to Hatchbox"
categories: ruby-on-rails heroku hatchbox
og_image: "target-hotwire-native.png"
---

I have been using Heroku for the last decade. It has always done the trick. However, Salesforce bought Heroku in Januaary of 2011, almost 15 years ago. In that time, Heroku hasn't actually changed much but has been more or less in maitnance mode. That also goes for their pricing, their prices for their resporces were probably good for 2011, but not for 2025.

Pricing aside, Heroku also is very strict with their dyno stack versions tracking the Ubuntu LTS versions which makes sense but it can actually be difficult to get get over versions of ruby or node running on a newer Heroku stack and the buildpack configurations can actually be tricky.

There has also been a lot of development of Kamal and access to cheap servers like Hetzner. I have been thinking a lot about alternatives to Heroku over the past few years. Kamal sounds great but still leaves a bit to be desired in that I would still like a slick Heroku style UI to be able configure my apps.

With all that in mind, I have been wanting to try [Hatchbox](https://hatchbox.io) after seeing people talking about and knowing that GoRails himself [Chris Oliver](https://x.com/excid3) made it made me think it was a worthy option. I used to use [Laravel Forge](https://forge.laravel.com) back when I wrote Laravel apps and Hatchbox felt very similar and familiar to me in that way.

Long story short. I switched all of my apps from Heroku to Hatchbox in a day and was very impressed with Hatchbox. I deployed a very modern ([Friends Weekly](https://friendsweekly.com)) app running the latest Rails 8.1 and lastest Ruby 3.4 and it worked without a hitched. I also deployed a semi old app ([Boostrap Email](https://app.bootstrapemail.com)) which is running Rails 6 and Ruby 2.7 and it also worked FIRST TRY on Hatchbox. I couldn't even get it working on my computer or a newer Heroku stack yet it deployed without a single issue via Hatchbox. I was extermly impressed and thought I would share my experience the migration in case it helped others do the same.

### Set Up Accounts
1. Create your [Hatchbox](https://hatchbox.io) account.
2. Create your [Hetzner](https://www.hetzner.com) account you will use to create servers. Hatchbox works with lots of VPS providers but Hetzner seems to be popular and is very cheap compared to other options.

### Create Hatchbox Cluster
1. Create a Cluster on Hatchbox by going to "Servers", click "New Cluster", and selecting Hetzner.
2. You will need a Hetzner API token at this point. To get it, go into Hetzner Console, select "Default" project, select "Security" from the left nav, select "Api Tokens" from the top nav, then click "Generate API Token" and create a token with "Read & Write" access.
3. Copy that API token back into Hatchbox and create the cluster.
4. For my apps I chose Web Server, Cron, Background Worker, and PostgreSQL but select what you need for your specific Rails app.

### Create Your App
1. In Hatchbox, click "Apps" and click "New App".
2. Select the new cluster, give your app a name, and click "Create App".
3. Connect to your repository. I connected to the GitHub repo which also makes auto-deploys easy to set up later.

### Starting to Migrate
- Now you have an app in Hatchbox! Now we want to start moving things over from Heroku.
1. First step is to move every enviromental variable from Heroku into Hatchbox. Find yours envs in Heroku settings and copy each one, one by one into the Apps "Enviroment" settings in Hatchbox. Whether you use .env style variables or credentials, it should all work the same. When uisng credentials the "RAILS_MASTER_KEY" variable is what is used to decrypt the produciton credential file.
2. This also assumes your Rails app is using a `DATABASE_URL` env in Heroku. So make sure that env also is copied over. We will deploy the app to Hatchbox while still using the Heroku database temporarily.
3. Hit "Deploy" in Hatchbox to deploy your new app! Check the recent lots in Hatchbox to ensure it deploys succesfully.

### DNS
1. Click the "View App" button in Hatchbox to ensure the app is running properly.
2. Go into the "Domains & SSL" settings and add your sites domain name. This will generate a domain & IP address pair.
3. Take your IP address and swap it with your DNS provider from the Heroku record to using this new Hatchbox record.
4. Your domain should now point to your new app on Hatchbox & Hetzer while using the Heroku database still.

### Maintance Mode
- We will now put the new Hatchbox app in maintance mode so that we can copy over the database without missing any writes to the database.
1. Inside you app in Hatchbox, go to `Settings` in the left nav.
2. Click `Enable` Maintenance Mode in the top of settings, this will temporarily take your app offline. If you navigate to your app should now see it is in maintance mode.

### Backup Heroku DB
- Now time to migrate the Postgres Heroku DB.
1. Download [TablePlus](https://tableplus.com/download/).
2. Once installed, click to add a connection and click "Import from URL".
3. Past in the Heroku DB url and connect.
4. Click `File > Backup`, and make a backup saving it somewhere on your computer. Note: in my Heroku DB there were a lot of databases, search for the database in the Backup menu that matches the database you are connected to in the Table Plus status bar.

### Restore to Hatchbox DB
- Now we will restore that DB to Hatchbox Postgre.
1. In your apps left nav, click "Databases" and create a new unmanaged database for your app.
2. Connecting to the Hatchbox DB isn't as easy as putting the url in Table Plus because there firewall protection in Hatchbox that only let the DB able to be access from the cluster server which is a great security features but requires an extra step.
3. Go to the server in Hatchbox and click `Firewall Rules` in the left nav.
4. You will see a Postgres firewall already in there for the internal server. Add another record using the same port `5432` and leave the rest empty to give access everywhere.
5. Click back to "Databases" in the top nav then click into the database you just made click "View".
6. Back in Table Plus create a new connection and copy the new app database in HOWEVER change the IP address in the url from `10.0.1.1` to the SSH IP address listed in yours databases info in Hatchbox.
7. You should now be able to connect to the empty DB in Table Plus. To start the restore click `File > Restore`, select your newly connected Hatchbox DB, add the following restore options `--no-owner,--no-privileges,--single-transaction`, and select the backup file your created from the Heroku DB above.
8. DON'T FORGET: Go back into the `Firewall Rules` and remove the `5432` Firewall Rule we just added but don't delete the `10.0.1.1` rule that was already there.

### Bring Back the App
- Everything it set, now we just to need update the env and bring the app back online
1. Go back into `Enviroment` in your app, first change your `DATABASE_URL` to `HEROKU_DATABASE_URL` to temporarily set that one aside and hit save. You can remove it also but this is just safer in case you need to quickly revert it.
2. There should be another database url already there like `RED_DATABASE_URL`, that is your Hatchbox database, you can see what it is attached as in the database settings. Change the env to be `DATABASE_URL` so the Rails app will identify it is the new main database.
3. Go back to app `Settings` and turn maintanace mode back off.
4. You should now be able to load your Rails app in the browser and it should be all working properly!

### Bonus Features
One of the great things about Hatchbox is they charge a flat fee for server. And with that you get access to all of the features. Unlike Heroku where only certian premium dynos or databases would get access to more of the pro features.

One of my favorite features is the ability to have constant datbase backups to S3, R2, or any other type of storage service. Especially since it is an umanaged database it is a great way to have extra safetynet that if something went wrong there would always be a backup. I set mine up to backup the databse `daily` to a Cloudflare R2 bucket what will retain the backups for 1 month and will clear older ones so I also don't need to pay for storage for really old backups. There are a lot of settings you can fine tune for how you want that set up. I actually have all of my apps backup up to the same R2 bucket because it puts them in subfolders for each database.

Another nice feature that Hatchbox supports is `Cron Jobs`. I have historically used the Heroku scheduler which was a free add on to run different scripts. It was a cheaper way to handle multiple processes on Heroku. Anothing thing to remember if you have any of those set up in Heroku is you want to transfer any of those over to the `Cron Jobs` in your app in Hatchbox. The nice thing about Hatchbox is it has actual full cron support so you have much better control compared to the Heroku scheduler which was much more redumentary.
