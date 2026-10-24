# 05 - English: Record a 3 to 5 Minute Mock Interview Answer

> **Time:** ~75 min (3 takes + review) | **Type:** Speaking practice | **Target:** one recorded answer of **3 to 5 minutes**, reviewed with the rubric below
> **Be aware:** I can't hear audio, so **you** record and review. If you type or paste the transcript to me (section 6), I can give written feedback on structure, grammar and word choice. The sample answer below is **544 words, about 3 min 55 s at a calm 140 words per minute** (counted by script).

## 1. The one idea

A good interview answer is not a longer answer; it is an **organised** answer. Interviewers remember **structure** and **specifics**. Your English only needs to be **clear**, not perfect: short sentences, signposts ("first", "the trade-off is"), and a calm pace beat advanced vocabulary.

## 2. Analogy

A road trip with signs. Each sign ("Let me start with...", "The decision I'm proudest of...") tells the listener where they are, so even if your grammar wobbles they never get lost.

## 3. The prompt (pick one)

| Option          | Prompt                                                                                    | Time       |
| --------------- | ----------------------------------------------------------------------------------------- | ---------- |
| **A (default)** | "Tell me about a project you built: the architecture, a key feature, and the trade-offs." | 3 to 5 min |
| B               | "Explain what happens from the moment a user clicks 'Save' until the data is stored."     | 3 min      |
| C               | "Explain JWT authentication to a teammate who has never used it, including its risks."    | 3 min      |

Use Option A for today's target. B and C are for extra takes.

## 4. The structure: 6 blocks (about 4 minutes)

| #   | Block                                     | Time | Words | Starter phrases                                                                                  |
| --- | ----------------------------------------- | ---- | ----- | ------------------------------------------------------------------------------------------------ |
| 1   | **Context**: the problem and who it's for | 30 s | ~70   | "Thanks for the question. I'd like to talk about..." / "The problem it solves is..."             |
| 2   | **Architecture**: layers in one pass      | 50 s | ~120  | "On the front end..." / "On the back end..." / "Data is stored in..."                            |
| 3   | **One feature end to end**                | 60 s | ~140  | "The feature I'd like to walk through is..." / "When the user clicks..., the request goes to..." |
| 4   | **Decisions and trade-offs**              | 60 s | ~130  | "I chose X over Y because... The trade-off is..."                                                |
| 5   | **A bug or challenge** (what you learned) | 30 s | ~70   | "One bug taught me a lot." / "I found it by..."                                                  |
| 6   | **Limits, next steps, close**             | 30 s | ~70   | "I'm also honest about the limits..." / "To summarise..." / "I'm happy to go deeper."            |

## 5. The sample answer (544 words)

**Don't memorise it.** Read it aloud once for rhythm, then close it and tell the story **in your own words** using the 6 blocks. Replace the details with your real project.

> Thanks for the question. I'd like to talk about LearningHub, a learning platform I built to practise full-stack development.
>
> Let me start with the problem it solves. Students need a quick way to find a course, save the ones they like, and track their progress, and admins need a safe way to add new courses. So I built it around those two groups of users.
>
> On the front end I used React with Next.js and TypeScript. The public course catalogue is rendered on the server, so the first page loads quickly and search engines can read it. Only the interactive parts, like the search box and the Save button, are Client Components, which keeps the JavaScript bundle small. I used strict TypeScript, and I model loading, error and success states as a discriminated union, so the compiler stops me from reading data that hasn't arrived yet.
>
> On the back end there is a REST API with JWT authentication and a SQL database. Passwords are stored as salted, slow hashes. A login returns a token that expires after fifteen minutes, and a middleware verifies it and checks the user's role before any protected route runs.
>
> The feature I'd like to walk through is saving a course. When the user clicks Save, the front end sends a PUT request with the token in the Authorization header. The server verifies the token, checks that the course exists, and inserts a row with a parameterised query, so SQL injection isn't possible. I chose PUT, and INSERT OR IGNORE, because the operation is idempotent: if the network fails and the client retries, the user still has exactly one saved row. The database enforces that with a composite primary key, so even two simultaneous requests can't create a duplicate.
>
> There were three decisions I thought carefully about. First, I chose server rendering for the catalogue instead of fetching in the browser. The cost is that content can be stale, so I'd use revalidation after an admin edit. Second, I chose a short-lived JWT over server sessions, because it is stateless and easy to scale. The trade-off is that it's hard to revoke, so the next step would be refresh tokens in an HttpOnly cookie. Third, I put constraints in the database as well as validation in the code, because the database is the last line of defence against race conditions.
>
> One bug taught me a lot. When I tested edge cases, I found that a request with a very large body returned a 500 error instead of a 413. The body parser threw an error that my handler didn't recognise. I fixed it, added a test, and it reminded me that unexpected input is where most bugs live.
>
> I'm also honest about the limits. There's no rate limiting on login yet, search is a simple LIKE query, and pagination is offset-based, which would be slow on a very large table. With more time I'd add refresh tokens, rate limiting, cursor pagination and end-to-end tests in a CI pipeline.
>
> To summarise: LearningHub is a typed, server-rendered React front end on top of a secure, tested REST API, and the main lesson for me was that robustness comes from small, deliberate decisions. I'm happy to go deeper on any part of it.

Why it works: it opens with the **problem**, uses signposts in every paragraph, gives **one feature** end to end instead of everything, states each decision as **choice + reason + cost**, admits **limits**, and **closes with a summary**.

## 6. How to record (step by step)

1. **Set up (5 min).** Quiet room, phone voice recorder or the laptop's recorder, phone propped up (a video also lets you check posture and eye contact). Notes **not** on screen: only the 6 block names on a sticky note.
2. **Warm up (2 min).** Read the first two paragraphs of the sample aloud, slowly. Drink water.
3. **Take 1 (record, no stopping).** Speak for 3 to 5 minutes. If you make a mistake, **keep going** and fix it in the next sentence: that's what real interviews need.
4. **Review immediately (15 min).** Listen once for **content** (did I cover the 6 blocks?), once for **delivery** (pace, fillers), with the rubric. Write **three** fixes only.
5. **Take 2 and Take 3.** Apply the fixes. Keep the best take.
6. **Make a transcript (optional but powerful).** Use your phone's dictation or any speech-to-text tool on the recording, then **paste the text to me** and ask for feedback on: structure, grammar, clearer word choices, and where you rambled.
7. **Save** the recording with the date. Redo it in 3 days and compare.

### Measure two numbers

| Metric      | How                                                           | Target                                                                                   |
| ----------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Pace**    | words in the transcript / minutes spoken                      | **120 to 160 words per minute** (below 110 sounds hesitant; above 170 is hard to follow) |
| **Fillers** | count "um", "uh", "like", "you know", "basically", "actually" | **fewer than 3 per minute**; replace them with a **silent pause**                        |

## 7. Self-review rubric (score 1 to 5)

| Dimension                 | 1                               | 3                           | 5                                       | My score |
| ------------------------- | ------------------------------- | --------------------------- | --------------------------------------- | -------- |
| **Structure**             | rambling, no order              | most blocks, some jumping   | clear 6 blocks with signposts           |          |
| **Specifics**             | only generic claims             | some details                | concrete example, number, decision      |          |
| **Trade-offs**            | none                            | one, shallow                | choice + reason + cost + when to change |          |
| **Clarity of English**    | hard to follow                  | understandable, some errors | clear, short sentences, correct tenses  |          |
| **Pace and pauses**       | too fast or too slow, no pauses | uneven                      | steady, pauses between blocks           |          |
| **Fillers and restarts**  | constant                        | noticeable                  | rare                                    |          |
| **Technical accuracy**    | errors                          | small slips                 | correct and precise                     |          |
| **Confidence and ending** | trails off                      | ends but weak               | clear summary + invitation to go deeper |          |

**28 to 40** = ready · **20 to 27** = one more take focused on your two lowest rows · **below 20** = re-read `04-project-learninghub-architecture.md` and rebuild the outline before recording again.

## 8. Language toolbox

### Signposts (use one per paragraph)

- Opening: "Thanks for the question." "Let me start with the problem it solves."
- Moving on: "Moving to the back end..." "The next piece is..." "Let me walk you through one feature."
- Decisions: "I chose X over Y because..." "The trade-off is..." "I'd revisit this when..."
- Closing: "To summarise..." "The main lesson for me was..." "I'm happy to go deeper on any part."

### Buying time and handling "I don't know" (very useful)

- "That's a good question. Let me think for a second."
- "I haven't used that in production, but my understanding is..."
- "I'm not sure about the exact detail, but I'd find out by..."
- "Could you clarify whether you mean...?"
- Never invent an answer. **A correct "I don't know, but here's how I'd approach it" beats a confident wrong answer.**

### Say it simply: replace complex words

| Instead of                                    | Say                              |
| --------------------------------------------- | -------------------------------- |
| "utilise"                                     | "use"                            |
| "in order to"                                 | "to"                             |
| "it is the case that"                         | (delete)                         |
| "I was responsible for the implementation of" | "I built"                        |
| "Due to the fact that"                        | "because"                        |
| "We did X, Y and Z" (vague)                   | "I built X; my teammate built Y" |

### Grammar traps for technical speaking

| Trap                                          | Wrong                         | Right                                                                                  |
| --------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| Uncountable "data", "information", "feedback" | "datas", "informations"       | "the data is stored", "some information"                                               |
| Tense when telling a story                    | mixing past and present       | past for what you did ("I built"), present for facts ("the server verifies the token") |
| Articles                                      | "I used React library"        | "I used the React library" / "I used React"                                            |
| "Explain" takes no "about"                    | "explain about JWT"           | "explain JWT"                                                                          |
| Prepositions                                  | "depends of", "discuss about" | "depends on", "discuss"                                                                |
| Third person "-s"                             | "the server return"           | "the server returns"                                                                   |

### Pronunciation of words from this course

| Word                              | Say it like                                      |
| --------------------------------- | ------------------------------------------------ |
| **idempotent**                    | eye-dem-POH-tent                                 |
| **asynchronous**                  | ay-SIN-kruh-nus                                  |
| **cache**                         | "cash"                                           |
| **JWT**                           | "jot" or letter by letter, J-W-T (both are fine) |
| **SQL**                           | S-Q-L or "sequel" (both are fine; be consistent) |
| **hydration**                     | hy-DRAY-shun                                     |
| **middleware**                    | MID-ul-wair                                      |
| **parameterised / parameterized** | puh-RAM-uh-tuh-rized                             |
| **cursor**                        | KUR-sur                                          |

## 9. Common mistakes

1. **Memorising the script**: you sound robotic and panic when you forget a word. Memorise the **blocks**, not the sentences.
2. Starting with "So basically..." and a 2-minute tour of the tech stack before the problem.
3. Speaking too fast when nervous. **Pause at the end of every block**; silence feels longer to you than to the listener.
4. Only describing, never **deciding**: no "because", no trade-off.
5. Apologising ("sorry, my English is bad"). Say nothing; just speak clearly.
6. Going over 5 minutes: you lose the listener. Practise the **cut list**: what would you drop first? (the bug story, then the limits).
7. Ending with "yeah, that's it". End with a **summary sentence** and an invitation.
8. Not listening to the recording. The review is where the improvement happens.

## 10. Predict: what would you say?

**Q1** The interviewer interrupts: "Why JWT and not sessions?" You have 20 seconds. What do you say?

**Q2** You forget a term in the middle of a sentence. What do you do?

**Q3** You notice you've been talking for 5 minutes and you're only on block 3. What do you do?

## 11. Model answers

- **Q1:** "I wanted the API to be stateless so any server instance can verify the token without a shared session store. The trade-off is that a token is hard to revoke before it expires, so I made it short-lived, fifteen minutes, and I'd add refresh tokens next."
- **Q2:** **Describe it** instead of freezing: "the thing that... delays a function until the user stops typing" (that is _debounce_). Interviewers value that you can explain the idea. Then continue.
- **Q3:** **Compress.** Say "Let me jump to the key decision", skip the details of the remaining feature, and move to block 4 and the close. A complete short answer beats a half-finished long one.

## Recap

- **Structure beats vocabulary**: 6 blocks (context, architecture, one feature, trade-offs, a bug, limits and close).
- Target **3 to 5 minutes** and **120 to 160 words per minute**, with pauses instead of fillers.
- Record, **listen**, fix **three** things, record again. Three takes beat one perfect attempt.
- "I don't know, but here's how I'd approach it" is a strong answer.

## Checklist

- [ ] I recorded at least 3 takes of 3 to 5 minutes
- [ ] I measured my pace (words per minute) and counted my fillers
- [ ] I scored myself with the rubric and wrote my 3 fixes
- [ ] My final take covers all 6 blocks and ends with a summary
- [ ] I rehearsed three "buy time" phrases and two "I don't know" phrases
- [ ] (Optional) I pasted my transcript for written feedback
