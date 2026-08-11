---
layout: post
title:  "Reference: Hotwire Native Tricks Every App (Might) Need"
categories: ruby-on-rails hotwire-native hotwire turbo
og_image: "hotwire-native-app-tricks.png"
---

I have been writing Hotwire Native apps for almost 2 years now and have picked up many tricks along the way that end up making it into almost all the apps I build. I want to keep this straight and to the point as a reference for myself and others of tricks to come back to for common Hotwire Native <span class="text-red-500">problems</span> & <span class="text-green-500">solutions</span>.

1. [Version Gating](#1-version-gating)
2. [Tailwind Variants](#2-tailwind-variants)
3. [Modal via Links](#3-modal-via-links)
4. [Tab Switching](#4-tab-switching)
5. [Disabling Page Cache](#5-disabling-page-cache)

## 1: Version Gating
<span class="text-red-500">Problem:</span> Sometimes I need to target a specific app version number or platform like iOS vs Android in the code.

<span class="text-green-500">Solution:</span> Use [Hotwire Native Version Gate](https://github.com/stuyam/hotwire_native_version_gate).

This is actually a gem I wrote to solve my own problem. It lets you easily gate features based on the version of the iOS or Android app. As an example, I released a `v1.0.0` version of an app with an HTML tab bar. Then in `v1.1.0` of the iOS app I added a native tab bar, so I wanted to hide the HTML tab bar in new versions of the app while keeping it around for people still running the old version. Here is how you would do that:
```ruby
class ApplicationController < ActionController::Base
  include HotwireNativeVersionGate::Concern
  # iOS versions 1.1.0+ will return true
  native_feature :native_tab_bar, ios: '1.1.0'
end
```

Then in my tab bar view in my Rails app:
```erb
<% unless native_feature?(:native_tab_bar) %>
  <%= render 'navigation/tab_bar' %>
<% end %>
```

## 2: Tailwind Variants
<span class="text-red-500">Problem:</span> I often need to make the Hotwire Native version of the Rails app look slightly different than the regular web version.

<span class="text-green-500">Solution:</span> Use [Custom Tailwind Variants](https://stuyam.com/blog/targeting-hotwire-native-with-tailwind).

This is a really simple but powerful solution that lets you write HTML like `<button class="native:hidden">Hidden button on Native</button>` using custom Tailwind variants to customize your views.

It involves just adding an attribute to your `application.html.erb` file like so:
```erb
<!DOCTYPE html>
<html <%= 'data-hotwire-native' if hotwire_native_app? %>>
```

Then in a CSS file with Tailwind, we create a set of variants like so:
```css
/* app/assets/tailwind/variants.css */
/* Target browser only */
@custom-variant browser (html:not([data-hotwire-native]) &);
/* Target Hotwire Native apps */
@custom-variant native (html[data-hotwire-native] &);
```

You can use this in combination with Hotwire Native Version Gate above to even target iOS & Android specifically with CSS. [Check out this other post I wrote to explain that in more detail.](https://stuyam.com/blog/targeting-hotwire-native-with-tailwind#update-target-ios-vs-android---8102026)

## 3: Modal via Links
<span class="text-red-500">Problem:</span> Sometimes I need to open a page in a modal _only_ sometimes.

<span class="text-green-500">Solution:</span> Create a custom path configuration to allow you to trigger modals via URL params.

Pages in Hotwire Native apps are often relatively static in their page presentation. They either show regularly in the navigation stack or show in a modal, like `/new` and `/edit` pages. I have, however, had cases when I want a page to display normally, but then in certain circumstances have it show in a modal, like on a map where I want to easily dismiss it and not lose my place navigating the map. To do this we can add `\\?.*launch_in_modal` to the path configuration for the modal context. This is the secret sauce that allows us to append `launch_in_modal` as a URL param to any path and it will launch it in a modal. This means any link can trigger opening a modal, for example `<a href="https://example.com?launch_in_modal">Open Me in a Modal</a>`.

Here is an example iOS path configuration file I tend to start with. This is all the default, where everything will open in the default context except `/new` & `/edit` open in a modal. The one addition I have made is the `\\?.*launch_in_modal` part.
```javascript
{
  "settings": {},
  "rules": [
    {
      "patterns": [
        ".*"
      ],
      "properties": {
        "context": "default",
        "pull_to_refresh_enabled": true
      }
    },
    {
      "patterns": [
        "/new$", "/edit$", "\\?.*launch_in_modal"
      ],
      "properties": {
        "context": "modal",
        "pull_to_refresh_enabled": false
      }
    }
  ]
}
```

## 4: Tab Switching
<span class="text-red-500">Problem:</span> When I click a link in one tab, I want the page to open in the appropriate tab and not just the current tab.

<span class="text-green-500">Solution:</span> Use tab switching via custom path configuration code.

I found this great solution by Jonathan Spooner that allows you to define `tab_identifiers` in the path configuration file, which makes it really easy to ensure certain pages always open in the right tab. I won't try to reproduce his explanation, so just head over to his post [How to Switch Tabs from Links in Hotwire Native](https://jonathanspooner.com/posts/how-to-switch-tabs-from-links-in-hotwire-native) to set it up.

The solution allows you to do stuff like this with the `tab_identifier`, which is really slick and means it's another win for us because we're able to define this stuff all on the backend.
```javascript
{
  "settings": {},
  "rules": [
    {
      "patterns": ["/meditations", "/meditations/*"],
      "properties": {
        "tab_identifier": "meditations"
      }
    },
    {
      "patterns": ["/posts", "/posts/*"],
      "properties": {
        "tab_identifier": "posts"
      }
    }
  ]
}
```

## 5: Disabling Page Cache
<span class="text-red-500">Problem:</span> When navigating to a specific page I always want it to fetch from the backend to get the latest changes.

<span class="text-green-500">Solution:</span> Use `turbo-cache-control` to control how the page is cached.

Sometimes you want a page to never be restored from cache. This can happen when you have page #1 and you navigate to page #2, pushing onto the stack in the app. If you make a change or save something on page #2 and then click back to navigate back to page #1, that page may be outdated. If you use the following code to add the meta tag to your page, it will ensure the page won't be restored but rather refreshed when navigating back. Note: in general you don't need to do this often with form submits and stuff because that will bust caches, but in certain circumstances like the ones described above, it can be needed.
```erb
<% content_for :head do %>
  <meta name="turbo-cache-control" content="no-cache">
<% end %>
```
