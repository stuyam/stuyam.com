---
layout: post
title:  "Introducing: Hotwire Native Version Gate"
categories: ruby-on-rails hotwire-native hotwire open-source
og_image: "hotwire-native-version-gate.png"
---

<a class="text-sky-500" href="https://github.com/stuyam/hotwire_native_version_gate" target="_blank">Go straight to gem &rarr;</a>

Hotwire Native has made releasing iOS and Android apps so much easier than it used to be. Since it is web-based, it means you can deploy most changes from your backend without needing to release through the app stores. However, there are times when you need to release new versions of the apps. When you do, unlike Rails which is running a singular instance on a server, you will have multiple versions of the app running at the same time on users' devices. This introduces a problem where you might need to make different choices on the backend based on the version or platform of the app.

My app [Friends Weekly](https://friendsweekly.com) is a Hotwire Native app. Originally it was built using an HTML tab bar for convenience. However, for many reasons it is now better and easier to implement a native tab bar. This introduces the issue where users running the old app versions need to display the HTML tab bar but I want to hide it on newer app versions since it will now have the native tabs. Not to mention the same goes for Android and the Android app is also a different version than the iOS app.

Introducing <a class="text-sky-500" href="https://github.com/stuyam/hotwire_native_version_gate">Hotwire Native Version Gate</a>, the Ruby gem that lets you define versioned features in your Rails app and lets you run checks on those features throughout your views and controllers.

## How It Works

Hotwire Native Version Gate solves this by reading version information from the app's User Agent string. The gem parses the User Agent to determine:
- **Platform**: Whether the request is from iOS or Android
- **Version**: The semantic version number (e.g., `1.2.0`)

Once it knows the platform and version, you can define features with version requirements, and the gem handles all the comparison logic for you. (related: [Ruby already solved my problem](https://newsletter.masilotti.com/p/ruby-already-solved-my-problem))

## HTML/Native Tab Bar Example

Here is how I use it to toggle the HTML tab bar on and off.

```ruby
class ApplicationController < ActionController::Base
  include HotwireNativeVersionGate::Concern
  # iOS versions 1.3.0+ and android versions 1.1.0+ will return true
  native_feature :native_tab_bar, ios: '1.3.0', android: '1.1.0'
end
```

Then in my tab bar view in my Rails app:
```erb
<% unless native_feature?(:native_tab_bar) %>
  <%= render 'navigation/tab_bar' %>
<% end %>
```

### The User Agent Mechanism

The gem expects your mobile apps to append version information to their User Agent. For example:
- iOS: `Hotwire Native App iOS/1.2.0;`
- Android: `Hotwire Native App Android/1.1.0;`

The gem includes regex patterns to parse these User Agents and extract the platform and version. It also includes fallback patterns and lets you add fallback patterns for older apps that might use the default Hotwire Native User Agent without version numbers (like `Hotwire Native iOS;`) or any custom user agent setup.

## Setup

### Step 1: Configure Your Mobile Apps

First, you need to configure your iOS and Android apps to include version information in the User Agent.

**iOS (Swift):**
```swift
if let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String {
    Hotwire.config.applicationUserAgentPrefix = "Hotwire Native App iOS/\(appVersion);"
}
```

**Android (Kotlin):**
```kotlin
val appVersion = packageManager.getPackageInfo(packageName, 0).versionName
Hotwire.config.applicationUserAgentPrefix = "Hotwire Native App Android/$appVersion;"
```

### Step 2: Install the Gem

Add the gem to your Rails app:
```bash
bundle add hotwire_native_version_gate
```

### Step 3: Include the Concern

Include the concern in your `ApplicationController`:
```ruby
class ApplicationController < ActionController::Base
  include HotwireNativeVersionGate::Concern
end
```

If you have many features, you might want to create a separate concern to avoid crowding your `ApplicationController`:
```ruby
# app/controllers/concerns/native_features.rb
module NativeFeatures
  extend ActiveSupport::Concern
  extend HotwireNativeVersionGate::Concern

  included do
    native_feature :html_tabs, ios: '1.2.0', android: '1.1.0'
    native_feature :new_drawer_ui, ios: '2.0.0'
    # ... more features
  end
end

# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  include NativeFeatures
end
```

## Defining Features

The `native_feature` method lets you define features with version requirements for each platform:

```ruby
class ApplicationController < ActionController::Base
  include HotwireNativeVersionGate::Concern

  # Enable a feature on iOS 1.2.0+ and Android 1.1.0+
  native_feature :html_tabs, ios: '1.2.0', android: '1.1.0'

  # Enable a feature only for Android 2.0.0+
  native_feature :new_drawer_ui, android: '2.0.0'

  # Enable a feature only for iOS 3.0.0+
  native_feature :onboarding_refactor, ios: '3.0.0'

  # Enable for iOS but disable for Android
  native_feature :future_feature, ios: true, android: false

  # Beta feature controlled by environment variable
  native_feature :experimental_search, ios: :beta_enabled?, android: :beta_enabled?

  def beta_enabled?
    ENV['ENABLE_BETA_FEATURES'] == 'true'
  end
end
```

**Platform detection helpers:**

The gem also provides two handy helpers throughout your Rails app:
- `native_ios?` — Returns `true` if the current request comes from a Hotwire Native iOS app
  - Also supports version strings for manual checking `native_ios?('1.2.3')`
- `native_android?` — Returns `true` if the current request comes from a Hotwire Native Android app
  - Also supports version strings for manual checking `native_android?('1.2.3')`

These are useful if you need to change behavior based on platform, regardless of version. For example:

```erb
<% if native_ios? %>
  <!-- iOS-specific UI or logic -->
<% elsif native_android? %>
  <!-- Android-specific UI or logic -->
<% else %>
  <!-- fallback for web or other clients -->
<% end %>
```


## Conclusion

Hotwire Native Version Gate makes it easy to handle the reality of mobile app deployments where multiple versions coexist. Instead of waiting for all users to update or maintaining complex version-checking logic yourself, you can define features once and use them throughout your Rails app.

The gem is available on [RubyGems](https://rubygems.org/gems/hotwire_native_version_gate) and the source code is on [GitHub](https://github.com/stuyam/hotwire_native_version_gate). Give it a try and let me know what you think!

