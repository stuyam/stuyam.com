---
layout: post
title:  "Migrating from Heroku to Hatchbox (easier than you think)"
categories: ruby-on-rails heroku hatchbox
og_image: "migrating-from-heroku-to-hatchbox.png"
---

I have been using Heroku for the last decade and it has served me well. At the time it was released it was pretty revolutionary and [The Twelve-Factor App](https://12factor.net) principals were ahead of it's time. However, Salesforce bought Heroku back in January 2011 (almost 15 years ago) and the platform has hardly evolved since. It feels like it has been in maintenance mode for years. That stagnation shows up in the pricing, too; what felt right for 2011 no longer makes sense in 2025.

Pricing aside, Heroku is strict about its dynos and you don't get _full server access_ which makes it hard matching versions of Ruby or Node with the buildpack configuration and can turn into a puzzle.

Meanwhile, tools like Kamal have matured and providers like Hetzner make cheap, powerful servers easy to access. I have been weighing alternatives to Heroku for a few years. Kamal is appealing, but I still like having a slick Heroku-style UI for configuring my apps.

With all that in mind, I decided to try [Hatchbox](https://hatchbox.io). I kept seeing people rave about it, and knowing that [Chris Oliver](https://x.com/excid3) from GoRails built it gave me confidence it was worth testing. I used [Laravel Forge](https://forge.laravel.com) back when I shipped Laravel apps a decade ago, and Hatchbox immediately felt familiar in the best ways.

Long story short: I switched all of my apps from Heroku to Hatchbox in a single day and came away impressed. I deployed a very modern app—[Friends Weekly](https://friendsweekly.com)—running Rails 8.1 and Ruby 3.4, and it worked without a hitch. I also deployed a slightly older app—[Bootstrap Email](https://app.bootstrapemail.com)—running Rails 6 and Ruby 2.7, and it worked on the first try. I honestly couldn't believe it _just worked_. I was struggling to even get the app running on my laptop or on a newer Heroku stack, yet Hatchbox handled it flawlessly. I was extremely impressed and wanted to share the migration process in case it helps others do the same.

<img class="w-full" src="/assets/blogs/opengraph/migrating-from-heroku-to-hatchbox.png">

Here are the steps we will go through to set up and migrate from Heroku to Hatchbox:
1. [Set Up Accounts](#set-up-accounts)
2. [Create Hatchbox Cluster](#create-hatchbox-cluster)
3. [Create Your App](#create-your-app)
4. [Starting to Migrate](#starting-to-migrate)
5. [DNS](#dns)
6. [Set up SSH](#set-up-ssh)
7. [Connect to Old and New DB with TablePlus](#connect-to-old-and-new-db-with-tableplus)
8. [Maintenance Mode](#maintenance-mode)
9. [Backup Heroku DB](#backup-heroku-db)
10. [Restore to Hatchbox DB](#restore-to-hatchbox-db)
11. [Bonus Features](#bonus-features)

### Set Up Accounts
1. Create your [Hatchbox](https://hatchbox.io) account.
2. Create your [Hetzner](https://www.hetzner.com) account, which you will use to provision servers. Hatchbox works with several VPS providers, but Hetzner is popular and very inexpensive compared to other options.

### Create Hatchbox Cluster
1. In Hatchbox, go to `Servers`, click `New Cluster`, and select Hetzner.
2. You will need a Hetzner API token. In the Hetzner Console, select your `Default` project, choose `Security` in the left nav, switch to the `API Tokens` tab, and click `Generate API Token`. Give it `Read & Write` access.
3. Copy that token back into Hatchbox and create the cluster.
4. For my apps I selected Web Server, Cron, Background Worker, and PostgreSQL roles, but pick what your Rails app needs.
<img class="w-full" src="/assets/blogs/images/migrating-from-heroku-to-hatchbox/hetzner-api-key.png">

### Create Your App
1. In Hatchbox, open `Apps` and click `New App`.
2. Select the new cluster, name your app, and click `Create App`.
3. Connect to your repository. I used GitHub, which also makes auto-deploys easy to configure later.

### Starting to Migrate
- Your app now exists in Hatchbox, so it is time to move things over from Heroku. We will start by moving the app over but leaving the database on Heroku for now.
1. Move every environment variable from Heroku into Hatchbox. Find them in the Heroku settings and copy them into the app `Environment` settings in Hatchbox. Whether you use `.env` style variables or Rails credentials, it all works the same. When using credentials, the `RAILS_MASTER_KEY` variable decrypts the production credentials file. Make sure you copy over the `SECRET_KEY` from Heroku, or delete the `SECRET_KEY` if it's in credentials, so sessions and users stay logged in through the migration.
2. This process assumes your Rails app uses a `DATABASE_URL` on Heroku. Copy that variable as well; we will deploy to Hatchbox while still pointing at the Heroku database for now.
3. Hit `Deploy` in Hatchbox to deploy your new app. Check the recent logs to confirm it deployed successfully. Click the `View App` button in Hatchbox to ensure the app is running properly in the browser 🎉

### DNS
1. Go into `Domains & SSL` and add your site's domain name. Hatchbox will generate a domain and IP address pair.
2. Update your DNS provider to point the domain to the new Hatchbox IP instead of the Heroku record.
3. Your domain now points to the app running on Hatchbox and Hetzner, while still using the Heroku database under the hood.

### Set up SSH
- Hatchbox has a firewall setup so that the databases can only be used on your Hatchbox server for security reasons. So we first need to set up SSH so we connect to the Hatchbox server from our computer.
1. Run `ssh-keygen -t ed25519` in your terminal.
2. Hit Enter to accept the default file name.
3. Create a password, I saved mine in 1password. If you use 1password you can also save SSH keys.
4. Run `cat ~/.ssh/id_ed25519.pub` to print the public key and copy it.
5. Go to `SSH Keys` in Hatchbox and click `New SSH Key` and paste the newly generated public key into Hatchbox and save it.
6. To test the connection, go into your server on Hatchbox, click `SSH` from the left tab. You will see a line that looks something like this `ssh deploy@10.20.30.40.50`, paste it into your terminal and you should be able to connect to the server following the steps.

### Connect to Old and New DB with TablePlus
- Now we will connect to the old Heroku and the new Hatchbox database.
1. Download [TablePlus](https://tableplus.com/download/).
2. Once installed, add a connection and choose `Import from URL`.
3. Paste in the Heroku database URL from the env and connect and you should now be able to see your Heroku DB in TablePlus.
4. Back in Hatchbox, in your app's left nav, click `Databases` and create a new unmanaged database for your app. Click `View` in the database you just created and copy the database url.
5. In TablePlus, create a new connection for the Hatchbox database. Click `Import from URL` to set it up. It will fill out the connection form but you need to click the `Over SSH` button to tunnel through your ssh connection.
6. The username and server IP need to be added to the ssh part of form, those values are the same as the ssh values you used to connect from your terminal above, something like `ssh deploy@10.20.30.40.50`. So for example the username would be `deploy` and the ip `10.20.30.40.50`.
7. Check the `Use SSH Key` box and select the private key you generated on your computer at `~/.ssh/id_ed25519.pub`.
8. Test the connection and connect to the database.
You should now have your Heroku and your Hatchbox databases connected to TablePlus.
<img class="w-full" src="/assets/blogs/images/migrating-from-heroku-to-hatchbox/postgres-ssh-connection.png">

### Maintenance Mode
- Put the Hatchbox app in maintenance mode so you can migrate the database without missing any writes to database in the process.
1. Inside your app in Hatchbox, open `Settings` in the left nav.
2. Click `Enable Maintenance Mode` at the top. This temporarily takes your app offline, and you should see a maintenance page if you visit your site.
<img class="w-full" src="/assets/blogs/images/migrating-from-heroku-to-hatchbox/maintenance-mode.png">

### Backup Heroku DB
- Now it is time to backup the Heroku Postgres database.
1. In TablePlus, click `File > Backup` and backup and save the Heroku database somewhere on your computer. In my Heroku Postgres instance there were several databases, so make sure you select the one that matches the connection shown in the TablePlus status bar.

### Restore to Hatchbox DB
- Now we will restore that Heroku backup to the Hatchbox PostgreSQL database.
1. To start the restore, click `File > Restore`, select the Hatchbox database as the destination, add the restore options `--no-owner --no-privileges --single-transaction`, and choose the backup file you created from Heroku.
<img class="w-full max-w-100 mx-auto" src="/assets/blogs/images/migrating-from-heroku-to-hatchbox/restore-options.png">

### Bring Back the App
- Everything is ready, so we just need to update the environment and bring the app back online.
1. Back in the app `Environment` settings, rename `DATABASE_URL` to `HEROKU_DATABASE_URL` and save. You could delete it, but renaming keeps it handy in case you need to revert quickly.
2. You should see another database URL, something like `RED_DATABASE_URL`, which points to the Hatchbox database we created. Rename that one to `DATABASE_URL` so Rails uses it as the primary database.
3. Return to app `Settings` and disable maintenance mode.
4. You should now be able to load your app in the browser with everything running on Hatchbox 🎉

### Bonus Features
One of the best things about Hatchbox is the flat fee per server. You get access to every feature, unlike Heroku where only certain premium dynos or database tiers unlocked the good stuff.

One of my favorite features is continuous database backups to S3, R2, or any compatible storage service. Since the database is unmanaged, having an automated safety net matters. I set mine to back up the database daily to a Cloudflare R2 bucket that keeps 30 days of history and automatically prunes older backups so I am not paying for stale data. Each database gets its own subfolder, so I use one R2 bucket to backup all of my app databases in one place.

Another feature I appreciate is `Cron Jobs`. I used to lean on the Heroku Scheduler add-on to run scripts cheaply, but it was pretty limited. Hatchbox gives you full cron support, so migrating any scheduled tasks from Heroku is easy and you get complete control over timing and frequency.

**Thank you** to [Chris Oliver](https://x.com/excid3) for not only creating a great product, but also answer my questions on X and making me excited about my Rails servers again!
