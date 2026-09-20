# 05. Projects

## What Are GitHub Projects?

GitHub Projects is a flexible, integrated project management tool built directly on top of Issues and Pull Requests — providing Kanban-style boards, tables, and roadmap views for planning and tracking work, without needing a separate external tool like Jira or Trello.

## Projects (New) vs Classic Projects

GitHub has two generations of this feature:

```
Projects (Classic):  simpler, column-based Kanban boards, tied to a single repository
Projects (New, current default): more powerful, spans MULTIPLE repositories,
                                   supports custom fields, multiple views (table, board, roadmap),
                                   built on GitHub's newer "Issues as a database" model
```

Modern GitHub Projects (the current recommended version) is significantly more flexible and is what this note focuses on.

## Creating a Project

```
Organization/Repository -> Projects tab -> New project
```

```bash
gh project create --owner my-org --title "Q3 Roadmap"
```

## Views — Multiple Ways to Visualize the Same Underlying Data

A key strength of modern GitHub Projects: the same set of items (issues, PRs, draft items) can be visualized in different ways without duplicating data.

### Board View (Kanban)

```
Backlog     |  Todo       |  In Progress  |  In Review   |  Done
------------|-------------|---------------|--------------|----------
Issue #12    | Issue #45    | Issue #38      | PR #52        | Issue #20
Issue #15    | PR #47        |                  |                | Issue #22
```

### Table View (Spreadsheet-Style)

```
Title              | Status       | Assignee | Priority | Iteration
Add search feature   | In Progress  | @alice    | High      | Sprint 12
Fix login bug          | In Review    | @bob        | Critical    | Sprint 12
Update docs               | Todo         | @carol       | Low          | Sprint 13
```

### Roadmap View (Timeline)

Visualizes items against a calendar timeline — useful for planning releases or seeing how work is distributed over upcoming weeks/months.

## Custom Fields

Beyond the built-in status/assignee/labels, Projects support fully custom fields tailored to a team's specific workflow.

```
Custom fields example:
  Priority: single-select (Low / Medium / High / Critical)
  Effort: number (story points)
  Team: single-select (Frontend / Backend / Design)
  Target Date: date
```

This flexibility is what lets GitHub Projects genuinely compete with dedicated project management tools, rather than being a bare-bones Kanban board.

## Automation — Keeping the Board in Sync Automatically

Projects support built-in automation (workflows) that update item status based on real repository events, eliminating manual board maintenance.

```
Built-in automation examples:
  - When an issue is closed -> automatically move it to "Done"
  - When a PR is opened -> automatically move its linked issue to "In Review"
  - When a PR is merged -> automatically move its linked issue to "Done"
  - Item added to project -> automatically set default status to "Backlog"
```

```
Settings (within a Project) -> Workflows -> configure these automatic status transitions
```

This automation is a major practical advantage over manually maintaining a separate Trello/Jira board that has to be kept in sync with actual GitHub activity by hand.

## Cross-Repository Projects

Unlike Projects (Classic), which was tied to a single repository, modern Projects can pull in issues and PRs from **multiple repositories** into a single unified board — essential for organizations where a single initiative spans several codebases (e.g., a feature touching both a frontend repo and a backend API repo).

```
Project: "Search Feature Launch"
  Items from: web-app repo, api-server repo, docs repo
  -> ALL tracked together on one board, regardless of which repo each issue/PR lives in
```

## Filtering and Grouping

```
Group by: Status, Assignee, Priority, Iteration, or any custom field
Filter by: label:bug assignee:@me status:"In Progress"
Sort by: Priority, Target Date, creation date, etc.
```

## Draft Issues — Planning Before Formalizing

Projects support "draft issues" — lightweight items that exist only within the project board, not yet converted into a full repository issue. Useful for early brainstorming/planning before something is concrete enough to become a formally tracked issue.

```
Draft issue: "Explore adding dark mode support"
  -> can be converted into a real GitHub Issue later, once it's ready to be formally tracked
```

## Insights — Basic Reporting

Projects include a basic charting/insights view (burndown-style charts, item counts by status over time) — useful for lightweight progress tracking without needing a fully separate analytics tool.

## Project Templates

```
New project -> choose a template:
  - Team planning
  - Bug tracker
  - Feature planning
  - Iterative development (with built-in Sprint/Iteration fields)
```

Templates provide sensible pre-configured views and custom fields for common workflows, rather than starting from a completely blank board every time.

## GitHub Projects vs Dedicated Tools (Jira, Linear, Trello)

|                       | GitHub Projects                                                          | Dedicated Tool (Jira, Linear)                                                             |
| --------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Integration with code | Native — issues/PRs are the same underlying objects                      | Requires integration/syncing, often imperfect                                             |
| Feature depth         | Solid for most teams, less deep than specialized tools                   | Often more advanced workflow customization, reporting                                     |
| Cost                  | Included with GitHub                                                     | Usually a separate subscription                                                           |
| Best for              | Teams wanting tight code/task integration without extra tooling overhead | Teams needing advanced PM features, complex cross-functional workflows beyond engineering |

## Common Interview-Style Questions

- **What's the key advantage of modern GitHub Projects over Projects (Classic)?**
  Modern Projects can span multiple repositories in a single unified board, support fully custom fields, and offer multiple views (board, table, roadmap) of the same underlying data — Classic Projects were tied to a single repository with simpler, fixed Kanban columns only.

- **How does GitHub Projects automation reduce manual board maintenance?**
  Built-in workflows automatically move items between statuses based on real repository events (e.g., closing an issue moves it to "Done," opening a linked PR moves the issue to "In Review"), keeping the board synchronized with actual work without anyone needing to manually drag cards.

- **What is a draft issue within a GitHub Project, and why is it useful?**
  A lightweight item that exists only within the project board, not yet a formal repository issue — useful for early brainstorming or planning before an idea is concrete enough to warrant becoming a fully tracked issue.

- **How can a single GitHub Project track work spanning multiple repositories?**
  Modern GitHub Projects can pull in issues and pull requests from multiple repositories into one unified board, which is essential for organizations where a single initiative spans several codebases (e.g., a feature requiring both frontend and backend changes in separate repos).

- **When might a team choose a dedicated project management tool (like Jira or Linear) over GitHub Projects?**
  When they need more advanced workflow customization, deeper reporting/analytics, or cross-functional project management features beyond engineering (involving design, marketing, or other non-technical teams) that GitHub Projects isn't specifically built to handle as deeply.
