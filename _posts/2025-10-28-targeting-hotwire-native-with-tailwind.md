---
layout: post
title:  "Targeting Hotwire Native with Tailwind"
categories: ruby-on-rails hotwire-native hotwire tailwindcss
og_image: "target-hotwire-native.png"
---

Hotwire Native gives us a lot of tools for building robust iOS and Android apps. It allows us to use our existing Ruby on Rails web application and transform it 🪄 into a native app. However, web apps usually need some tweaking before rendering in a native wrapper like Hotwire Native.

In Rails, we get the `hotwire_native_app?` view helper via the `turbo-rails` gem that we can use to conditionally render parts of the HTML. This can be helpful when you want to show or hide things like a navbar, footer, etc.

This works well, but there is usually more to it than just showing or hiding a part of the HTML. Sometimes you want to adjust the size of text, add padding to the top or bottom, or add borders or shadows that only show on Native.

Enter Tailwind Variants. Tailwind variants allow us to apply any Tailwind class to just native apps, giving us full control over the styling of our native apps. The first step is to set up our `application.html.erb` layout to include a `data-hotwire-native` attribute we can use for Tailwind variants.

```erb
<!DOCTYPE html>
<html <%= 'data-hotwire-native' if hotwire_native_app? %>>
```

Then in Tailwind, we create a set of variants like so:
```css
/* app/assets/tailwind/variants.css */
/* Target browser only */
@custom-variant browser (html:not([data-hotwire-native]) &);
/* Target Hotwire Native apps */
@custom-variant native (html[data-hotwire-native] &);
```

Tip: I create a `variants.css` file that I put these in to keep them isolated. Example:
```css
/* app/assets/tailwind/application.css */
@import "tailwindcss";
@import "./variants";
```

A quick overview of what each variant does:
- `browser:` targets browsers that are NOT Hotwire Native.
- `native:` targets Hotwire Native only.

Now comes the fun part where we can arbitrarily combine variants to customize our app. Here is an example where we customize the background color of a button on hover **only** on Native:

```markup
<button class="bg-gray-100 native:hover:bg-red-500">Hover me!</button>
```

Here are some examples of places I have used it.
1. Show or hide a navbar. Note: you can also do this just using the `hotwire_native_app?` helper, but it can be easier in the code flow to use classes. Just be careful not to load more than you need into the view:
    ```markup
    <nav class="native:hidden">...</nav>
    ```
2. Hide something only on small native apps, but show it on large native apps like iPad or desktop.
    ```markup
    <div class="native:hidden native:lg:block">Hide me on small native screens</div>
    <div class="native:max-lg:hidden">Same as above but in one class</div>
    ```
3. Add padding to the top of the page.
    ```markup
    <body class="native:pt-20">...</body>
    ```
4. Combine with `safe-area-insets` and arbitrary classes in Tailwind to push an HTML tab bar or other content above the home indicator on iOS. This will give padding to the bottom of the tab bar equal to the safe-area-inset-bottom or 0.5rem, whichever is greater.
    ```markup
    <div class="tabbar native:pb-[max(env(safe-area-inset-bottom),0.5rem)]">...</div>
    ```

### Update: Target iOS vs Android - 8/10/2026
I have since released [Hotwire Native Version Gate](https://stuyam.com/blog/introducing-hotwire-native-version-gate), which has helpers that make it really easy to also add variants based on iOS vs Android. This can be really useful for certain edge cases for iOS and Android apps.

You can easily [install Hotwire Native Version Gate](https://github.com/stuyam/hotwire_native_version_gate#setup) by adding the gem to your Gemfile:
```ruby
bundle add hotwire_native_version_gate
```

Then you can add the new `native_ios?` and `native_android?` view helpers from the gem to the `application.html.erb` file like we did above. Your `<html>` element should look like this:
```erb
<!DOCTYPE html>
<html <%= 'data-hotwire-native' if hotwire_native_app? %> <%= 'data-native-ios' if native_ios? %> <%= 'data-native-android' if native_android? %>>
```
**Updated Note** 🎉  I just added a helper to Hotwire Native Version Gate to make the above much easier:
```erb
<!DOCTYPE html>
<html <%= hotwire_native_html_attributes %>>
```

Then in Tailwind, we create a set of variants like so:
```css
/* app/assets/tailwind/variants.css */
/* Target browser only */
@custom-variant browser (html:not([data-hotwire-native]) &);
/* Target Hotwire Native apps */
@custom-variant native (html[data-hotwire-native] &);
/* Target ONLY Hotwire Native on iOS */
@custom-variant ios (html[data-native-ios] &);
/* Target ONLY Hotwire Native on Android */
@custom-variant android (html[data-native-android] &);
```

Then in our HTML we can use them like this:
```markup
<button class="browser:hidden">Hidden in regular browsers</button>
<button class="native:hidden">Hidden in Hotwire Native apps</button>
<button class="ios:hidden">Hidden in iOS Hotwire Native apps</button>
<button class="android:hidden">Hidden in Android Hotwire Native apps</button>
```
