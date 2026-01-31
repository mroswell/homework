---
layout: home
title: Home
---

## Homework

{% for item in site.nav %}
- [{{ item.title }}]({{ item.url | relative_url }})
{% endfor %}
