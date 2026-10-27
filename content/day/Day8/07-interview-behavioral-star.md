# 07 - Interview: Behavioral Questions and the STAR Method

> **Time to learn:** ~90 min | **Level:** Interview skill | **Interview frequency:** Every interview, usually the first and last 15 minutes
> **Important:** the model answers below are **examples of the structure**. Their details are illustrative (only the "challenging bug" story is true of the Day 6 build). **Never tell a story that didn't happen to you**: follow-up questions will expose it. Replace every example with **your own** situation.

## 1. The one idea

"Tell me about a time when..." is a request for **evidence**: past behaviour predicts future behaviour. A good answer is a **short story with a clear structure**, told in the first person, ending with a **result and a lesson**. The interviewer is checking communication, ownership, teamwork, handling of problems and self-awareness, not whether your story is dramatic.

## 2. Analogy

A highlights reel, not the full match. You choose the best 60 to 90 seconds that show how you play, and you skip the long warm-up.

## 3. The STAR method (plus a one-line lesson)

| Letter        | Meaning                                  | Share of the answer | Question it answers         |
| ------------- | ---------------------------------------- | ------------------- | --------------------------- |
| **S**ituation | the context, in 1 to 2 sentences         | 15%                 | "Where and when?"           |
| **T**ask      | **your** responsibility or the problem   | 15%                 | "What was needed from you?" |
| **A**ction    | what **you** did, step by step (use "I") | **50%**             | "What did you actually do?" |
| **R**esult    | the outcome, with a number if possible   | 15%                 | "What happened?"            |
| **L**esson    | what you learned or do differently now   | 5%                  | "What changed?"             |

Length: **60 to 90 seconds**, about **150 to 200 words**. Longer answers lose the listener; shorter ones lack substance.

## 4. Build your story bank (the most efficient preparation)

You do **not** need 20 stories. Prepare **5 real stories**; each can answer several questions.

| Story                                       | Possible questions it answers                                      |
| ------------------------------------------- | ------------------------------------------------------------------ |
| 1. A **technical problem** you debugged     | hardest problem; troubleshooting; attention to detail; persistence |
| 2. A **disagreement** or difficult teammate | conflict; communication; influence without authority               |
| 3. A **mistake or failure**                 | failure; ownership; learning from feedback                         |
| 4. Learning something **new, fast**         | adaptability; initiative; growth                                   |
| 5. A **deadline, pressure or priorities**   | time management; prioritisation; handling stress                   |

Write one line for each and the outcome, with a number if you can (tests added, time saved, users, speed).

```
Story 1: [what broke] -> [what I did] -> [result + number]
Story 2: ...
```

If you have little work experience, use **projects, college work, open source, volunteering, hackathons or your LearningHub practice build**.

## 5. The core questions

| #   | Question                                  | What they check            | Structure                                                        |
| --- | ----------------------------------------- | -------------------------- | ---------------------------------------------------------------- |
| 1   | **Tell me about yourself**                | communication, relevance   | present, past, future (60 s)                                     |
| 2   | **Why this company / role?**              | motivation, research       | specific reason + fit + what you'll add                          |
| 3   | **A challenging technical problem**       | problem solving, ownership | STAR (story 1)                                                   |
| 4   | **A disagreement with a teammate**        | collaboration, maturity    | STAR (story 2): focus on **listening and resolving**             |
| 5   | **A mistake or failure**                  | honesty, learning          | STAR (story 3): **real** mistake, fixed, lesson                  |
| 6   | **Learning something quickly**            | adaptability               | STAR (story 4)                                                   |
| 7   | **Working under a tight deadline**        | prioritisation             | STAR (story 5)                                                   |
| 8   | **Your strengths**                        | self-awareness             | 2 strengths + a proof for each                                   |
| 9   | **Your weakness**                         | honesty, growth            | a **real** weakness + what you do about it                       |
| 10  | **Why should we hire you?**               | summary of value           | 3 points: skills, evidence, attitude                             |
| 11  | **Where do you see yourself in 5 years?** | ambition, realism          | grow technically, take ownership, mentor; connected to this role |
| 12  | **Do you have questions for us?**         | curiosity                  | always ask 2 to 3 (section 8)                                    |

## 6. Model answers (structure examples)

### 1. Tell me about yourself (about 68 seconds, 159 words)

Formula: **Present** (what you do now) → **Past** (relevant background) → **Future** (what you want here). Not your life story; not your age or family.

> I'm a front-end focused full-stack developer. Over the last few months I've been building and studying the whole path of a web application: React and Next.js with TypeScript on the front end, and a REST API with authentication and a SQL database on the back end.
>
> My main practice project is LearningHub, a course platform where people browse, search and save courses. I built it step by step, and I care about quality, so the API has automated tests and I can trace any feature from the button in the UI down to the row in the database.
>
> Before this, [one sentence about your degree or previous work]. What I enjoy most is turning a vague requirement into a reliable feature, and I learn fastest by building and debugging.
>
> Now I'm looking for a role in a product team where I can contribute from the first month, learn from experienced engineers, and grow toward owning features end to end.

### 3. A challenging technical problem (about 82 seconds, 192 words): _this one is true of the Day 6 build_

> Situation: while testing the API of my LearningHub project, I sent a very large request body to the registration endpoint, and the server answered with a 500 error.
>
> Task: a mistake by the client should produce a clear 4xx response, not a 500. A 500 means "the server has a bug", so it would raise false alarms in monitoring, and the user would get no useful message. I needed to find the cause and fix it properly.
>
> Action: I reproduced it with a small script and read the server log. The body parser had thrown a "payload too large" error, and my error handler only recognised my own error type and JSON syntax errors, so this one fell into the generic 500 branch. I added a case for that error that returns 413 with a stable error code, and I wrote a test that sends a twenty-kilobyte body and expects exactly that response.
>
> Result: the endpoint now returns 413, and the test suite grew from eighteen to nineteen passing tests. It also changed my habit: for every endpoint I now test not only valid input, but also oversized, malformed and missing input.

### 4. A disagreement (about 81 seconds, 189 words)

> Situation: in a team project, a teammate and I disagreed about how to load the course list. He wanted to fetch everything in the browser because it was the approach he knew. I preferred rendering it on the server, because the page is the same for everyone and we cared about load speed and search visibility.
>
> Task: we needed to decide quickly without damaging the working relationship, because other tasks depended on this choice.
>
> Action: first I asked him to explain his reasons, and I realised his main worry was that server rendering would make development slower. I suggested a small experiment instead of an argument: we would build the page both ways in one hour and compare first-load time and the amount of JavaScript sent. I shared the numbers in the team chat and offered to pair with him on the server version.
>
> Result: the server version was clearly faster, so we chose it, and he finished the interactive search part himself. We kept the habit of settling technical disagreements with a small measurement, and I learned to ask about the concern behind an opinion before defending mine.

What makes it good: it shows **listening** ("I asked him to explain"), a **neutral way of deciding** (a measurement), and **no blame**.

### 5. A mistake (about 72 seconds, 168 words)

> Situation: for a small course-list feature I tested the normal case carefully, but I did not test what happens when the list is empty or the request fails.
>
> Task: I was responsible for the feature and had told my reviewer it was ready.
>
> Action: when the reviewer opened the page with the network switched off, it showed a blank white area, with no message and no way to retry. I told them straight away that I had missed it, rather than defending the code. I added explicit loading, empty and error states, a retry button, and a timeout, and I wrote tests for each state. I also made a short checklist for myself: loading, empty, error, retry, and slow network.
>
> Result: the feature passed review the next day. Since then I design the states of every data-driven component before I write the happy path, and I have not shipped a blank screen again. The main lesson is that the unhappy paths are part of the feature, not extras.

What makes it good: a **real, small, fixable** mistake; **ownership** ("I told them straight away"); a **changed habit**. Never say "I never make mistakes", and never pick a mistake that shows poor ethics or a safety problem.

### 6. Learning something quickly (about 75 seconds, 174 words)

> Situation: I needed to use TypeScript in a project, and I had only about a week before I had to deliver a typed course dashboard.
>
> Task: I had to become productive quickly without slowing the rest of the team down or producing code full of "any".
>
> Action: I did not try to read everything. I took one existing JavaScript component and converted it to TypeScript, and I let the compiler errors teach me. For each error I looked up the concept, such as unions, generics or narrowing, and wrote a one-line note. Then I modelled the loading, error and success states with a discriminated union and wrote tests. At the end of each day I explained what I had learned aloud, to check that I really understood it.
>
> Result: I delivered the dashboard on time, with strict mode on and no "any" types. A reviewer's only comment was a naming suggestion. I now use the same method for anything new: start from a small real task, learn from the errors, and then explain it.

### 9. Your weakness (about 50 seconds, 116 words)

> My honest weakness is that I can spend too long perfecting a detail. For example, I once spent an evening polishing the spacing of a card layout when the feature's logic still needed tests.
>
> To manage it, I now work with time limits. I decide up front what "good enough for this step" means, I set a timer for each task, and if I'm stuck for thirty minutes, I ask for help or write down what I tried and move on. I also review my work against the requirements before I polish.
>
> It's working: my last feature was finished in the time I estimated, and I still had time to add tests for the edge cases.

Formula: **a real weakness** that is not essential for the job + **what you do about it** + **evidence it's improving**. Avoid "I'm a perfectionist" or "I work too hard" without substance, and avoid weaknesses that disqualify you ("I can't work in a team").

### 2. Why this company? (fill-in template, do real research first)

```
I read / used [specific product, blog post, open-source project, or engineering article],
and what stood out was [a specific thing: the problem they solve, their tech choice, their culture].
My experience with [your matching skills] fits [a requirement in the job description].
I'd like to grow in [specific area], and I think I can contribute by [specific thing].
```

Spend **30 minutes** reading the company's site, product, careers page and a recent blog post: the specific detail is what makes this answer convincing.

### 10. Why should we hire you? (3 points, about 30 seconds)

> "Three things. First, I have a solid full-stack foundation: React, Next.js, TypeScript, REST APIs, SQL and authentication, and I can explain my decisions and trade-offs. Second, I work in a quality-focused way: I write tests, handle edge cases and trace problems to the root cause. Third, I learn quickly and take feedback well, and I'm motivated to contribute to this team from the first month."

## 7. Other questions (short guidance)

| Question                                    | Guidance                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Salary expectations**                     | Research the market range for the role, location and level first. Say: "Based on my research for this role and my experience, I'm looking at X to Y, and I'm open to discussing the overall package." Give a **range** with your target near the lower-middle of it. Avoid lying or naming a figure before you know the role, if you can ask "what range have you budgeted?" |
| **Notice period / joining date**            | Be exact and honest: "My notice period is X, and it can be shortened/negotiated with my employer."                                                                                                                                                                                                                                                                           |
| **Why are you leaving your job?**           | Positive and forward-looking: "I want more ownership / to work with X technology." Never criticise the employer or colleagues.                                                                                                                                                                                                                                               |
| **Gap in your resume**                      | Short, honest, and about what you **did** (learning, projects, family, health, looking for the right role) and that you're ready now.                                                                                                                                                                                                                                        |
| **Are you interviewing elsewhere?**         | "Yes, I'm talking to a few companies, but this role is a strong fit because [reason]."                                                                                                                                                                                                                                                                                       |
| **Tell me about a time you helped someone** | A teammate you unblocked or a doc you wrote: shows teamwork.                                                                                                                                                                                                                                                                                                                 |
| **How do you handle feedback?**             | A real example: you received feedback, acted on it, and the result.                                                                                                                                                                                                                                                                                                          |
| **How do you prioritise?**                  | "Impact and deadline first; I clarify what's essential, split the rest, and communicate trade-offs early."                                                                                                                                                                                                                                                                   |

## 8. Questions to ask them (always ask 2 to 3)

1. "What does a typical week look like for someone in this role?"
2. "How does the team handle code review, testing and deployments?"
3. "What would a successful first 90 days look like?"
4. "What are the biggest technical challenges the team is facing right now?"
5. "How do you support learning and growth for developers?"

Avoid asking about salary, leave or benefits in a first technical round unless they raise it, and never say "no questions".

## 9. Common mistakes

1. **Rambling**: no structure, 4 minutes, no result. Use STAR and a timer.
2. Saying **"we"** all the time. Say what **you** did.
3. **Blaming** others, or criticising an old employer.
4. A story with **no result** or no lesson.
5. A **fake or exaggerated** story: you will be asked three follow-ups.
6. Choosing a "weakness" that is really a strength in disguise, or a fatal one.
7. Memorising a script word by word. Memorise the **bullet points** of each story.
8. Not knowing the company.
9. Being too negative or too humble: "it was nothing, anyone could do it".
10. Not practising aloud: written answers sound different from spoken ones.

## 10. Predict: what is missing from this answer?

**Q1** "In my last project the API was slow. We looked into it and used caching, and it worked." Which STAR parts are missing or weak?

**Q2** "My weakness is that I work too hard." What is wrong with it, and what would you say instead?

**Q3** "My manager was terrible and didn't listen, so I left." What should you say?

**Q4** An interviewer asks, "What was the result?" and you say "I think it went fine." How would you improve it?

## 11. Answers

- **Q1:** Weak **Situation/Task** (what API? how slow? whose job?), **Action** uses "we" and has no specifics (what did _you_ measure and change?), and **Result** has no number. Better: "The product list endpoint took about 2 seconds. I profiled it and found the same query running per item. I replaced it with one joined query and cached the result for 60 seconds. The response time fell to about 150 ms."
- **Q2:** It sounds like a non-answer and shows no self-awareness. Choose a **real** one with **a mitigation and evidence**, like the "I spend too long perfecting details; now I time-box" answer above.
- **Q3:** Keep it **neutral and forward-looking**: "I'm looking for more ownership and a stronger engineering culture, and this role offers that." Never criticise.
- **Q4:** Give **evidence**: a number, feedback or observable outcome ("the tests went from 18 to 19, and the endpoint now returns 413"). If you don't know the result, say what you measured and what you'd check next.

## Recap

- **STAR + lesson**: 60 to 90 seconds, **I** not "we", end with a **result**.
- **Five real stories** cover almost every question.
- **Prepare**: tell me about yourself, why this company, strengths/weakness, salary, your questions.
- Be honest, specific and positive; never invent or blame.

## Checklist

- [ ] I wrote my 5 stories (one line each, with a number)
- [ ] I wrote STAR notes for 3 of them in my own words
- [ ] I have a 60-second "tell me about yourself"
- [ ] I researched one company and wrote the "why us?" answer
- [ ] I have a salary range and 3 questions to ask
- [ ] I got Q1 to Q4 right without looking
