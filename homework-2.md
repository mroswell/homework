---
layout: lesson
title: "Homework 2: Git & GitHub Basics"
description: Learn the fundamentals of version control with Git and GitHub.
tasks:
  - id: git-workflow
    text: Complete this git tutorial
    url: https://www.codecademy.com/courses/learn-git/lessons/git-workflow/exercises/hello-git
    link_text: Codecademy Git Workflow

  - id: git-guide-thread
    text: Visit and understand this thread about git basics
    url: https://claude.ai/share/00a093fb-1abd-4b64-aca9-9b82ae3f4600
    link_text: Claude discussion

  - id: progress-tracker
    text: Spend 5 minutes filling out your Progress Tracker
    url: https://mroswell.github.io/ai-coding-essentials/progress-tracker.html
    link_text: Progress Tracker

  - id: bookmarklets
    text: Try your hand at bookmarklets using the sample pages
    url: https://mroswell.github.io/ai-coding-essentials/bookmarklets/
    link_text: Bookmarklets Tutorial

  - id: portfolio-site
    text: Build a portfolio website with TechFolios, or build a GitHub Pages website of your choice (Quiz, Class Notes, Tutorial)
    url: https://techfolios.github.io/
    link_text: TechFolios
    optional: true
---

## What is Git?

Git is a **version control system** that helps you track changes to your code over time. Think of it as an unlimited undo button that also lets you see exactly what changed, when, and why.

GitHub is a platform that hosts Git repositories online, making it easy to collaborate with others and back up your work.

![Git workflow diagram](https://rogerdudler.github.io/git-guide/img/trees.png)

## Key Concepts

| Term | What it means |
|------|---------------|
| **Repository** | A folder containing your project and its entire history |
| **Commit** | A snapshot of your changes at a point in time |
| **Branch** | An independent line of development |
| **Push** | Upload your commits to GitHub |
| **Pull** | Download commits from GitHub |

## Common Commands

Here are the commands you'll use most often:

```bash
git init              # Start a new repository
git add .             # Stage all changes
git commit -m "msg"   # Save changes with a message
git push              # Upload to GitHub
git pull              # Download from GitHub
git status            # See what's changed
git log               # See commit history
```

## Why Learn Git?

> "Version control is the most important skill a developer can learn after programming itself."

Even if you're working alone, Git helps you:

- **Experiment safely** — try things without fear of breaking your project
- **Track progress** — see how your project evolved
- **Recover from mistakes** — go back to any previous version
- **Document decisions** — commit messages explain *why* you made changes

## Additional Resources

If you want to go deeper:

- [Git - the simple guide](https://rogerdudler.github.io/git-guide/) — visual reference
- [Learn Git Branching](https://learngitbranching.js.org/) — interactive tutorial
- [GitHub Docs](https://docs.github.com/) — official documentation
