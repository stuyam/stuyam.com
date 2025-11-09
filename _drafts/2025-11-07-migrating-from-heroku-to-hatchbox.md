---
layout: post
title:  "Migrating from Heroku to Hatchbox (easier than you think)"
categories: ruby-on-rails heroku hatchbox
og_image: "target-hotwire-native.png"
---

I have been using Heroku for the last decade and it has served me well. However, Salesforce bought Heroku back in January 2011 (almost 15 years ago) and the platform has hardly evolved since. It feels like it has been in maintenance mode for years. That stagnation shows up in the pricing, too; what felt right for 2011 no longer makes sense in 2025.

Pricing aside, Heroku is strict about matching its dyno stack versions to Ubuntu LTS releases. That makes sense, but it also makes it hard matching versions of Ruby or Node with the buildpack configuration and can turn into a puzzle.

Meanwhile, tools like Kamal have matured and providers like Hetzner make cheap, powerful servers easy to access. I have been weighing alternatives to Heroku for a few years. Kamal is appealing, but I still want that slick Heroku-style UI for configuring my apps.

With all that in mind, I decided to try [Hatchbox](https://hatchbox.io). I kept seeing people rave about it, and knowing that [Chris Oliver](https://x.com/excid3) from GoRails built it gave me confidence it was worth testing. I used [Laravel Forge](https://forge.laravel.com) back when I shipped Laravel apps a decade ago, and Hatchbox immediately felt familiar in the best ways.

Long story short: I switched all of my apps from Heroku to Hatchbox in a single day and came away impressed. I deployed a very modern app—[Friends Weekly](https://friendsweekly.com)—running Rails 8.1 and Ruby 3.4, and it worked without a hitch. I also deployed a slightly older app—[Bootstrap Email](https://app.bootstrapemail.com)—running Rails 6 and Ruby 2.7, and it worked on the first try. I could not even get that app running on my laptop or on a newer Heroku stack, yet Hatchbox handled it flawlessly. I was extremely impressed and wanted to share the migration process in case it helps others do the same.

### Set Up Accounts
1. Create your [Hatchbox](https://hatchbox.io) account.
2. Create your [Hetzner](https://www.hetzner.com) account, which you will use to provision servers. Hatchbox works with several VPS providers, but Hetzner is popular and very inexpensive compared to other options.

### Create Hatchbox Cluster
1. In Hatchbox, go to `Servers`, click `New Cluster`, and select Hetzner.
2. You will need a Hetzner API token. In the Hetzner Console, select your `Default` project, choose `Security` in the left nav, switch to the `API Tokens` tab, and click `Generate API Token`. Give it `Read & Write` access.
3. Copy that token back into Hatchbox and create the cluster.
4. For my apps I selected Web Server, Cron, Background Worker, and PostgreSQL roles, but pick what your Rails app needs.

### Create Your App
1. In Hatchbox, open `Apps` and click `New App`.
2. Select the new cluster, name your app, and click `Create App`.
3. Connect to your repository. I used GitHub, which also makes auto-deploys easy to configure later.

### Starting to Migrate
- Your app now exists in Hatchbox, so it is time to move things over from Heroku. We will start by moving the app over but leaving the database on Heroku for now.
1. Move every environment variable from Heroku into Hatchbox. Find them in the Heroku settings and copy them into the app `Environment` settings in Hatchbox. Whether you use `.env` style variables or Rails credentials, it all works the same. When using credentials, the `RAILS_MASTER_KEY` variable decrypts the production credentials file. Make sure you copy over the `SECRET_KEY` from Heroku or delete the `SECRET_KEY` if it's in credentials to ensure your things like sessions and users stay logged in through the migration.
2. This process assumes your Rails app uses a `DATABASE_URL` on Heroku. Copy that variable as well; we will deploy to Hatchbox while still pointing at the Heroku database for now.
3. Hit `Deploy` in Hatchbox to deploy your new app. Check the recent logs to confirm it deployed successfully. Click the `View App` button in Hatchbox to ensure the app is running properly in the browser 🎉

### DNS
1. Go into `Domains & SSL` and add your site's domain name. Hatchbox will generate a domain and IP address pair.
2. Update your DNS provider to point the domain to the new Hatchbox IP instead of the Heroku record.
3. Your domain now points to the app running on Hatchbox and Hetzner, while still using the Heroku database under the hood.

### Maintenance Mode
- Put the Hatchbox app in maintenance mode so you can migrate the database without missing any writes to database in the process.
1. Inside your app in Hatchbox, open `Settings` in the left nav.
2. Click `Enable Maintenance Mode` at the top. This temporarily takes your app offline, and you should see a maintenance page if you visit your site.

### Backup Heroku DB
- Now it is time to migrate the Heroku Postgres database.
1. Download [TablePlus](https://tableplus.com/download/).
2. Once installed, add a connection and choose `Import from URL`.
3. Paste in the Heroku database URL from the env and connect.
4. Click `File > Backup` and save it somewhere on your computer. In my Heroku Postgres instance there were several databases, so make sure you select the one that matches the connection shown in the TablePlus status bar.

### Restore to Hatchbox DB
- Now we will restore that backup to the Hatchbox PostgreSQL database.
1. In your app's left nav in Hatchbox, click `Databases` and create a new unmanaged database for your app.
2. Connecting to the Hatchbox database is **not** as simple as pasting the URL into TablePlus because Hatchbox protects the database behind a firewall. Only the cluster server has access by default, which is great for security but requires an extra step.
3. Open the server in Hatchbox and click `Firewall Rules` in the left nav.
4. You will see a Postgres rule for the internal server. Add another duplicate rule using port `5432` and leave the other fields empty to allow access from anywhere temporarily.
5. Go back to `Databases` in Hatchbox, click into the database you just created, and click `View`.
6. In TablePlus, create a new connection for the Hatchbox database. Copy the connection URL, but change the IP address from `10.0.1.1` to the SSH IP address shown in the database details in Hatchbox.
7. You should now be able to connect to the empty database from TablePlus. To start the restore, click `File > Restore`, select the Hatchbox database, add the restore options `--no-owner --no-privileges --single-transaction`, and choose the backup file you created from Heroku.
8. Do not forget to remove the temporary `5432` firewall rule once the restore finishes, but keep the original `10.0.1.1` rule in place.

### Bring Back the App
- Everything is ready, so we just need to update the environment and bring the app back online.
1. Back in the app `Environment` settings, rename `DATABASE_URL` to `HEROKU_DATABASE_URL` and save. You could delete it, but renaming keeps it handy in case you need to revert quickly.
2. You should see another database URL, something like `RED_DATABASE_URL`, which points to the Hatchbox database. Rename that one to `DATABASE_URL` so Rails uses it as the primary database.
3. Return to app `Settings` and disable maintenance mode.
4. You should now be able to load your app in the browser with everything running on Hatchbox 🎉

### Bonus Features
One of the best things about Hatchbox is the flat fee per server. You get access to every feature, unlike Heroku where only certain premium dynos or database tiers unlocked the good stuff.

One of my favorite features is continuous database backups to S3, R2, or any compatible storage service. Since the database is unmanaged, having an automated safety net matters. I set mine to back up the database daily to a Cloudflare R2 bucket that keeps 30 days of history and automatically prunes older backups so I am not paying for stale data. Each database gets its own subfolder, so I use one R2 bucket to backup all of my app databases in one place.

Another feature I appreciate is `Cron Jobs`. I used to lean on the Heroku Scheduler add-on to run scripts cheaply, but it was pretty limited. Hatchbox gives you full cron support, so migrating any scheduled tasks from Heroku is easy and you get complete control over timing and frequency.
