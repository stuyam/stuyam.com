---
layout: post
title:  '"Load More" with Pagy and Turbo'
categories: ruby-on-rails turbo pagy
og_image: "load-more-with-pagy-and-turbo.png"
---

I have been working on my app [Friends Weekly](https://friendsweekly.com) for a while now. It's a new form of "Small Room" social media to stay in touch with the people you care about. It uses the latest and greatest tech: Rails 8.1, Turbo, Stimulus, and Hotwire Native. So it only makes sense that when I wanted to support a "Load More" button to load more posts in a list, I would expect to be able to do it without writing a lick of JS. Here is the functionality I ended up building:

<video class="max-w-100 mx-auto" src="/assets/blogs/videos/load-more-friends-weekly.mp4?v2" loop autoplay playsinline></video>

I think it works great and is very simple, using only the [Pagy Gem](https://github.com/ddnexus/pagy) and [Turbo Rails](https://github.com/hotwired/turbo-rails). Pagy has been my go-to favorite pagination gem in the past few years. Not only does it boast being very fast, but it is just dead simple to use and takes away the need to maintain my own pagination logic.

Let's start with a simple controller. This assumes you have already set up Pagy in Rails. Here are the [Set Up Instructions](https://ddnexus.github.io/pagy/quick-start) if you need to do that. As you can see, I have two controller actions; you could technically do it in one, but it's easier to keep them separate in this case. The only difference is we pass through the page number for the `#load_more` action.

```ruby
# app/controllers/newsletter_controller.rb
class NewslettersController < ApplicationController
  def index
    @pagy, @newsletters = pagy(Current.user.newsletters, limit: 10)
  end

  def load_more
    @pagy, @newsletters = pagy(Current.user.newsletters, page: params[:page], limit: 10)
  end
end
```

Now here is a _part_ of the index view that renders that list of newsletters. Note the importance of the `#newsletters_list` id that we will use later as a list to append to. We also render the `load_more_button` partial at the bottom, whose first job is to link to the next page.

```erb
<!-- app/views/newsletters/index.html.erb -->
...
<div id="newsletters-list">
  <% @newsletters.each do |newsletter| %>
    <%= render "newsletter_card", newsletter: newsletter %>
  <% end %>
</div>
<%= render "load_more_button", pagy: @pagy %>
...
```

We loop over a `newsletter_card` partial that renders the newsletter item itself. For the purposes of this demo it isn't important what that looks like but just including it as an example. This could be a card, link, table cell, etc.
```erb
<!-- app/views/newsletters/_newsletter_card.html.erb -->
<%= link_to newsletter_path(newsletter) do %>
  <div>Newsletter Card</div>
<% end %>
```

Here is the `load_more_button` partial, which links to the `#load_more` controller action with the next page in the URL params. As you can see, we tell it it is a `turbo_stream` with the data attributes so Turbo on the front end knows to load a turbo stream and do something with the results rather than navigating away to another page. Trick: We check `if pagy.next` to see if there is another round of results, and if there isn't, we show "You've reached the end of your inbox" and don't render the button so when you get to the end of the list the button disappears.
```erb
<!-- app/views/newsletters/_load_more_button.html.erb -->
<%= turbo_frame_tag "load-more-button" do %>
  <% if pagy.next %>
    <%= link_to load_more_newsletters_path(page: pagy.next), data: { turbo_stream: true } do %>
      Load More
    <% end %>
  <% else %>
    <div class="text-center text-gray-500 text-sm py-3">
      You've reached the end of your inbox
    </div>
  <% end %>
<% end %>
```

And finally, here is the `load_more` turbo_stream that is the view for the `#load_more` controller action. As you can see, we render two things:
1. We pass the `@newsletters` into the `newsletter_card` partial as a collection so it renders the next 10 newsletters. We use the `turbo_stream.append` method with the `#newsletters-list` id so that when it gets loaded into the view, it will append to the existing list of newsletters inside the existing wrapper.
2. We call `turbo_stream.replace` for the `load_more_button` with the key that matches the `turbo_frame_tag` id of `load-more-button`. We also pass through the `@pagy` instance variable from the controller to the load more button partial so it can call `pagy.next` to pass in as the page param in the URL loading the next page of results.

```erb
<!-- app/views/newsletters/load_more.turbo_stream.erb -->
<%= turbo_stream.append("newsletters-list",
                       partial: "newsletters/newsletter_card",
                       collection: @newsletters) %>

<%= turbo_stream.replace("load-more-button",
                        partial: "newsletters/load_more_button",
                        locals: { pagy: @pagy }) %>
```

And it's as simple as that. In classic Rails fashion, it is all about naming things the right way and setting things up so they _just work_. But it means we don't need to write nor maintain any JavaScript to handle this functionality, which is always a win!
