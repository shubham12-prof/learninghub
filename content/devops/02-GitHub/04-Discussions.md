# 04. Discussions

## What Are GitHub Discussions?

GitHub Discussions is a forum-style communication space attached to a repository, designed for open-ended conversations, Q&A, announcements, and community engagement — distinct from Issues, which are meant for specific, actionable, trackable items of work.

## Discussions vs Issues — The Key Distinction

|                 | Issues                                        | Discussions                                                         |
| --------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| Purpose         | Actionable bugs/tasks with a clear resolution | Open-ended conversation, questions, ideas                           |
| Resolution      | Closed when the underlying work is done       | Can be marked "answered" (for Q&A) but often stay open indefinitely |
| Structure       | Linear thread                                 | Threaded replies, can have nested conversations                     |
| Typical content | "Login button doesn't work on mobile"         | "What's the best way to structure a large React app?"               |

```
Use an Issue when:  "This specific thing is broken and needs to be fixed"
                     "We should build this specific feature"

Use a Discussion when: "How do people usually handle X in this project?"
                         "I have an idea, but I'm not sure it's fully formed yet"
                         "Announcing our v3.0 release — feedback welcome"
```

Using Discussions for open-ended conversation keeps the Issues tracker focused on genuinely actionable work, rather than becoming cluttered with questions and half-formed ideas that don't represent concrete tasks.

## Discussion Categories

Repositories can configure custom categories to organize discussions by type.

```
📣 Announcements    - maintainer-only posting, project news and updates
💡 Ideas             - feature suggestions and brainstorming
🙏 Q&A                - questions with the ability to mark an answer
🗣 General             - open conversation that doesn't fit elsewhere
🙌 Show and tell         - community members sharing what they've built
```

Each category can have different permissions (e.g., only maintainers can post Announcements) and different behaviors (Q&A categories support marking a specific reply as "the answer").

## Creating and Participating in a Discussion

```bash
gh api repos/{owner}/{repo}/discussions -f title="How do I configure custom middleware?" -f body="..."
```

Most discussion interaction happens through the web UI — creating a new discussion, replying (with support for nested/threaded replies), reacting with emoji, and upvoting.

## Marking an Answer (Q&A Category)

In a Q&A-type discussion, the original poster (or a maintainer) can mark a specific reply as "the answer" — it gets highlighted at the top of the thread, making it easy for future visitors with the same question to quickly find the resolution without reading the entire thread.

```
Q: How do I configure a custom rate limiter for this API?

Reply from @maintainer: You can pass a custom `RateLimiterOptions` object...
  ✓ Marked as answer
```

## Converting Between Issues and Discussions

```
An issue reported as a "bug" turns out to actually be a usage question
  -> maintainer converts it to a Discussion (Q&A category)

A discussion reveals a genuine, actionable feature request
  -> maintainer creates a linked Issue to formally track the work
```

This flexibility helps keep both spaces serving their intended purpose without forcing contributors to correctly categorize their post upfront.

## Polls

Discussions support built-in polls — useful for quick community sentiment gathering (e.g., "Which of these two API designs do you prefer?") without needing an external survey tool.

## Discussions for Open Source Community Building

Many open-source projects use Discussions specifically to:

- **Reduce noise in Issues** — redirecting "how do I..." questions (which aren't bugs) to Discussions.
- **Build community** — a "Show and tell" category lets users share what they've built with the project.
- **Gather early feedback** — posting a proposal/RFC as a Discussion before committing to an implementation, gathering input before writing code.
- **Publish announcements** — release notes, roadmap updates, breaking change notices — in a space designed for one-way (or moderated) broadcast rather than task tracking.

## Discussions and Pinning

Maintainers can pin important discussions (like a project roadmap or FAQ) to the top of the Discussions page, ensuring high visibility for frequently-relevant content regardless of how much other discussion activity has occurred since.

## Enabling Discussions on a Repository

```
Settings -> General -> Features -> check "Discussions"
```

Discussions are opt-in per repository (unlike Issues, which are enabled by default) — a repository maintainer must explicitly turn the feature on.

## Common Interview-Style Questions

- **What's the fundamental difference between GitHub Issues and Discussions?**
  Issues are for specific, actionable, trackable items of work (bugs to fix, features to build) that get closed once resolved; Discussions are for open-ended conversation — questions, ideas, announcements — that don't necessarily have a concrete resolution and can remain open indefinitely as ongoing community space.

- **Why might a maintainer convert an Issue into a Discussion?**
  If a reported "issue" turns out to actually be a usage question or open-ended conversation rather than an actionable bug/task, converting it to a Discussion keeps the Issues tracker focused on genuinely actionable work while still preserving the conversation in an appropriate space.

- **What does "marking an answer" in a Q&A-category discussion accomplish?**
  It highlights a specific reply as the resolution to the original question, making it easy for future visitors with the same question to quickly find the answer without reading through the entire discussion thread.

- **Give an example of how open-source projects commonly use Discussions beyond simple Q&A.**
  Posting proposals or RFCs before committing to an implementation (gathering community feedback before writing code), publishing announcements/release notes in a dedicated broadcast space, or hosting a "Show and tell" category where users share projects built with the tool — all uses that don't fit the actionable, trackable nature of Issues.

- **Are Discussions enabled by default on a new GitHub repository?**
  No — unlike Issues, Discussions must be explicitly enabled per repository via the repository settings.
