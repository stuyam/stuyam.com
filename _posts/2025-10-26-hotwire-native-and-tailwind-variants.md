---
layout: post
title:  "Hotwire Native & Tailwind Variants"
categories: ruby-on-rails hotwire-native tailwindcss
---

Hotwire Native gives us a lot of tools for building robust iOS and Android apps. It allows us to use our existing ruby on rails web application and transform it 🪄 into a native app. However, web apps usually need some tweaking before rending in a native wrapper like Hotwire Native.

In rails we get the `hotwire_native_app?` view helper via the `turbo-rails` gem that we can use to conditionally render parts of the HTML. This can be helpful when you want to show or hide things like a navbar, footer, etc.

This works well, but there is more to it usually than just showing or hiding a part of the HTML. Sometimes there are times you want to adjust the size of text, padding on the top or bottom, or borders or shadows that only show on Native.

Enter Tailwind Variants. Tailwind variants allows us to apply any tailwind class to just native apps giving us full control over the styling of our native apps. First step is we need to set up our `application.html.erb` layout to include a `data-hotwire-native` attribute we can use for tailwind variant.

```markup
<!DOCTYPE html>
<html <%= 'data-hotwire-native' if hotwire_native_app? %>>
  <head>
  ...
```

Then in tailwind, we create a set of variants like so:
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

Now is the fun part where we can arbitratily combine variants to customize our app. Here is an example where we customize the background color of a button on hover **only** on native:

```markup
<button class="bg-gray-100 native:hover:bg-red-500">Hover me!</button>
```

Here are some examples of places I have used it.
1. Show or hide a nav bar (you can also do this just using the `hotwire_native_app?` helper.)

```markup
<nav class="native:hidden">...</nav>
```

2. Add padding to the top of the page.

```markup
<body class="native:pt-20">...</body>
```
3. Combine with `safe-area-insets` and abitraty classes in tailwind to push an HTML tab bar or other content above the home indicator on iOS. This will give padding to the bottom of the tabbar or the safe-area-inset-bottom or 0.5rem, whichever is greater.

```markup
<div class="tabbar native:pb-[max(env(safe-area-inset-bottom),0.5rem)]">...</div>
```

So far all of these examples have just used the `native:` variant. But as you can see we also use `browser:`, `pwa:`, and `app-like:`.
- `browser:` is if you want to target neither hotwire native nor pwa apps.
- `pwa:` targets progressive web apps only.
- `app-like:` targets pwa's or hotwire native if you are wanting them to function the same.
