---
layout: post
title:  "Targeting Hotwire Native with Tailwind"
categories: ruby-on-rails hotwire-native tailwindcss
---

Hotwire Native gives us a lot of tools for building robust iOS and Android apps. It allows us to use our existing Ruby on Rails web application and transform it 🪄 into a native app. However, web apps usually need some tweaking before rendering in a native wrapper like Hotwire Native.

In Rails we get the `hotwire_native_app?` view helper via the `turbo-rails` gem that we can use to conditionally render parts of the HTML. This can be helpful when you want to show or hide things like a navbar, footer, etc.

This works well, but there is usually more to it than just showing or hiding a part of the HTML. Sometimes you want to adjust the size of text, add padding to the top or bottom, or add borders or shadows that only show on Native.

Enter Tailwind Variants. Tailwind variants allow us to apply any Tailwind class to just native apps, giving us full control over the styling of our native apps. The first step is to set up our `application.html.erb` layout to include a `data-hotwire-native` property we can use for Tailwind variants.

```markup
<!DOCTYPE html>
<html <%= 'data-hotwire-native' if hotwire_native_app? %>>
  <head>
  ...
```

Then in Tailwind, we create a set of variants like so:
```css
/* app/assets/tailwind/variants.css */
/* Target browser only */
@variant browser (@media (display-mode: browser) and html:not([data-hotwire-native]) &);
/* Standalone mode for PWA */
@variant pwa (@media (display-mode: standalone));
/* Native mode for hotwire native */
@variant native (html[data-hotwire-native] &);
/* App Like mode for PWA or hotwire native */
@variant applike (@media (display-mode: standalone), html[data-hotwire-native] &);
```

Tip: I create a `variants.css` file that I put these in to keep it isolated. Example:
```css
/* app/assets/tailwind/application.css */
@import "tailwindcss";
@import "./variants";
```

A quick overview of what each variant does:
- `browser:` targets browsers that are neither Hotwire Native nor PWA apps.
- `pwa:` targets Progressive Web Apps only.
- `native:` targets hotwire native only.
- `applike:` targets PWAs or Hotwire Native if you want them to function the same.

Feel free to only include the variants you need in your app.

Now comes the fun part where we can arbitrarily combine variants to customize our app. Here is an example where we customize the background color of a button on hover **only** on native:

```markup
<button class="bg-gray-100 native:hover:bg-red-500">Hover me!</button>
```

Here are some examples of places I have used it.
1. Show or hide a navbar. Note: you can also do this just using the `hotwire_native_app?` helper but it can be easier in the code flow to use classes. Just be careful not to load more than you need into the view:
    ```markup
    <nav class="native:hidden">...</nav>
    ```
2. Hide something only on small native apps, but show it on large native apps like iPad or Desktop.
    ```markup
    <div class="native:hidden native:lg:block">Hide me on small native screens</div>
    <div class="native:max-lg:hidden">Same as above but in one class</div>
    ```
3. Add padding to the top of the page.
    ```markup
    <body class="native:pt-20">...</body>
    ```
4. Combine with `safe-area-insets` and arbitrary classes in Tailwind to push an HTML tabbar or other content above the home indicator on iOS. This will give padding to the bottom of the tabbar equal to the safe-area-inset-bottom or 0.5rem, whichever is greater.
    ```markup
    <div class="tabbar native:pb-[max(env(safe-area-inset-bottom),0.5rem)]">...</div>
    ```

Note: I actually discovered this [post by Joe Masilotti](https://masilotti.com/hotwire-native/hide-content-tailwind-css/) _after_ I wrote this. We came up with a very similar approach. The only slight difference I chose was to put the `data-hotwire-native` property on the `<html>` element so you can add classes to the `<body>` and they will still work because they are still a child of `<html>`. As well as some other naming choices. Of course, Joe is a great resource for all things Hotwire Native. Check out his work if you haven't already.

