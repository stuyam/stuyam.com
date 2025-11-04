require 'set'

module Jekyll
  class CategoryPageGenerator < Generator
    safe true

    def generate(site)
      if site.layouts.key? 'category'
        categories = Set.new

        # Collect all unique categories from posts
        site.posts.docs.each do |post|
          if post.data['categories'] && post.data['categories'].is_a?(Array)
            post.data['categories'].each do |category|
              categories.add(category) if category
            end
          end
        end

        # Generate a page for each unique category
        categories.each do |category|
          site.pages << CategoryPage.new(site, site.source, category)
        end
      end
    end
  end

  class CategoryPage < Page
    def initialize(site, base, category)
      @site = site
      @base = base
      @dir = 'blog/categories'
      @name = "#{category}.html"

      self.process(@name)
      # Format category name: capitalize and replace hyphens with spaces
      formatted_name = category.split('-').map(&:capitalize).join(' ')
      self.data = {
        'category-name' => category,
        'title' => "#{formatted_name} - Categories",
        'layout' => 'category'
      }
      self.content = ""
    end
  end
end

