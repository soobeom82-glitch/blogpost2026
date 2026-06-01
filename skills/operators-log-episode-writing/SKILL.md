---
name: operators-log-episode-writing
description: Write, continue, split, and revise interview-based Operator's Log episodes for this project. Use when Codex needs to choose a topic from the project backlog, interview the user one question at a time, turn the answers into an MDX episode, place images and glossary notes in context, or keep episode pacing consistent with the existing series in this repo.
---

# Operator's Log Episode Writing

## Overview

Use this skill for episode work inside this repository only. It covers:

- selecting the next topic from the project's real backlog
- deciding whether the topic should be a single post or a series
- interviewing the user one question at a time
- drafting and revising MDX episodes in the established Operator's Log format
- placing images, glossary notes, and interviewer commentary in the right spots

Before writing, read these project files when needed:

- `README.md`
- `docs/interview-workflow.md`
- representative posts under `content/posts/`

Prefer learning the current tone and structure from the existing episodes before inventing a new format.

## Workflow

### 1. Build context from the repo

Check the current episode files and supporting docs before asking questions or writing.

Look for:

- current title format such as `ep.1`, `ep.2`
- current pacing and paragraph length
- how glossary notes and inline figures are used
- whether the topic already started as an existing series

If the user asks for a continuation, continue the existing series instead of starting a new format.

### 2. Decide the episode scope first

Do not start interviewing until the scope is clear.

Use these rules:

- keep one episode centered on one major event or one to two tightly-related beats
- target the reading length already established by the first parking episode
- split when the story changes from origin to operations, from operations to demand shift, or from demand shift to tax/strategy
- if a topic needs multiple separate explanations for numbers, operations, and aftermath, split it

When splitting, define the next episode boundary explicitly before drafting.

### 3. Interview one question at a time

Always interview in a live back-and-forth style.

Rules:

- ask one question at a time
- do not dump a list of questions
- prefer time-order questions that help the reader follow the story
- ask for background, numbers, judgment, response, and result across the conversation
- focus on why the user judged or acted a certain way, not only what happened

If the answer opens a more useful follow-up path, take that path before moving on.

### 4. Draft in the project's episode style

Write the post in MDX under `content/posts/`.

Required format:

- metadata at the top
- title in `ep.n ...` format
- interview-based body
- quoted user answers in polite Korean
- interviewer-led narrative framing

Use this content pattern:

1. short setup paragraph
2. Q/A sequence
3. one or two short interviewer comments around major turning points
4. closing synthesis paragraph or two
5. forward link to the next episode when appropriate

Do not turn the piece into a pure essay. The Q/A rhythm must remain visible.

### 5. Review before finishing

After drafting, always run a short revision pass on the episode itself.

Check for:

- objective facts that contradict earlier answers or other episodes
- business, tax, or operational claims that seem too strong for the evidence given
- spelling, spacing, and honorific consistency
- awkward or broken sentences

If a point cannot be verified from the interview or repo context:

- do not invent certainty
- soften the wording or mark it as the speaker's interpretation
- ask a follow-up question only when the gap changes the meaning materially

Prefer fixing the prose directly when the issue is clearly linguistic rather than factual.

## Episode style rules

### Commentary rhythm

Do not add commentary after every question.

Preferred rhythm:

- add brief commentary only at turning points
- usually one or two comments in the middle of the episode
- keep a stronger synthesis at the end

Commentary should do one of these jobs:

- show why a detail matters
- mark a shift in risk, judgment, or tone
- connect a user answer to the larger business reality

### Tone

Maintain these traits:

- not a bragging success story
- not flattened AI summary prose
- grounded, observational, and concrete
- numbers and conditions matter more than inspiration
- do not force a moral lesson at the end

### User answer handling

Preserve the user's meaning, but normalize the wording for readability.

Always:

- convert rough spoken fragments into natural written Korean
- keep quoted answers in honorific form
- correct obvious spelling and spacing issues inside quotes
- avoid over-cleaning to the point that the voice disappears

## Images and glossary notes

### Inline figures

Do not rely on a top-of-body hero image.

Use images this way:

- keep metadata image for cards and sharing
- place the actual figure in the body where the event is discussed
- add a caption that explains why the image matters in the story

If multiple images exist for one scene, place them beside the paragraph that mentions the relevant object or action.

### Glossary notes

Use a separate explanation box for unfamiliar operational or tax terms.

Only explain terms that a general reader may not know, such as:

- `공매`
- `LPR`
- `RF 카드`
- `기부채납`
- `운영이행보증금`
- `근로소득과 사업소득 상계`
- similar business, facilities, or tax terms

Rules:

- explain the term only when it first becomes relevant
- never place the glossary note before the term appears in the narrative
- keep the note short and practical
- visually separate it from the interview text

## File and naming rules

- write episode files under `content/posts/`
- continue the slug family for a running series
- update only the necessary episode files
- preserve the project's card and metadata conventions

When revising an existing episode, prefer editing the current file instead of cloning the content into a new one.

## Completion checklist

Before finishing:

1. confirm the episode scope is not too wide
2. confirm the Q/A rhythm still reads like an interview
3. confirm mid-episode commentary is present but not excessive
4. confirm glossary notes appear after the relevant term
5. confirm images appear where the event is discussed
6. confirm the file title and summary match the current series style
7. confirm there are no obvious factual contradictions or unsupported overstatements
8. confirm spelling, spacing, and sentence flow are clean
9. push the changes when the user expects direct publishing workflow
