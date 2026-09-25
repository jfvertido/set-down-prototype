# User test plan

Five moderated sessions, about 20 minutes each, run in the evening on each person's own phone. The goal is to find out whether the routine actually helps people set the day down, and where the design gets in the way.

## What I want to learn

Each question maps to a design decision I made without evidence.

| Question | The decision it tests | What I'll watch for |
|---|---|---|
| Does the slowing pace read as calming, or as lag? | Tempo goes ×1.0 → ×2.4 across the four stages | Tapping twice, "is it loading?", impatience before Breathe |
| Does parking thoughts help, or feel like homework? | Brain dump before breathing | Hesitation at the empty field, how much they write, what they say after |
| Do people trust the parked list? | Claude rewrites the text, with a check that every item comes from their words | Rereading the list, "that's not what I said", missing items |
| Can people follow 4-7-8 from the circle and labels alone? | No count, no sound, 7s hold with nothing moving | Breathing out of sync, confusion during the hold, skipping |
| Does the dim feel like an ending, or like the app broke? | 60s dim with nothing to do | Tapping the screen, reaching for the brightness, "is that it?" |
| Would they use it again tonight? | The whole routine, about four minutes | The answer, and the reason |

## Who

Five people who sometimes find it hard to switch off at night. Friends and colleagues are fine; avoid other designers where you can, because they tend to critique the UI instead of using it.

- Mix of iPhone and Android if possible. At least one person who uses Reduce Motion or large text, if you know anyone.
- Screen out anyone going through something hard right now. The brain dump invites people to write what's on their mind, and a test session isn't the place for that. See "Safety" below.

## Setup

- **When:** in the evening, ideally after 8pm, so the context is real.
- **Where:** in person, or on a video call with the participant sharing their phone screen (FaceTime screen sharing works on iPhone).
- **Device:** their own phone, in Safari or Chrome, at https://set-down-prototype.vercel.app. Don't install it to the Home Screen first; the first visit is part of the test.
- **Brightness:** their normal evening setting. Ask them not to change it.
- **You need:** this plan, one copy of the notes template per person, and a timer.
- Run one pilot session first (a partner or a friend) and fix anything confusing in the script before the real five.

## Privacy

Tell people this up front, and mean it:

- What they type isn't stored or logged by the app, and you won't read it aloud or write it down.
- They can write something real or something made up. Both are useful.
- If you record the session, record the screen and audio only, with their permission, and delete it after you've written your notes.

In your notes, describe what they wrote in general terms ("three work tasks and a worry about a friend"), never word for word.

## Safety

Don't test the crisis flow with participants. It exists and it's been checked, but asking people to type crisis language to see what happens isn't a fair thing to ask.

If a participant writes something that triggers the support screen anyway, stop the test. Check in with them as a person first, and don't treat it as a finding. Make sure they know the resources on screen are real. Only come back to the test if they want to.

## Script

Read the intro roughly as written. After that, say as little as possible.

### Intro (2 min)

> Thanks for doing this. I'm testing a small app I designed for winding down before bed. I'm testing the app, not you, so there are no wrong answers, and it's really useful when something confuses you or annoys you.
>
> Please think out loud as you go: what you're looking at, what you expect, what surprises you. I'll mostly stay quiet so it's closer to using it alone.
>
> One thing about privacy: when it asks what's on your mind, you can write something real or made up. The app doesn't store it, and I won't read it out or write it down.
>
> It takes about four minutes. Go at whatever pace feels natural. Ready?

### The task (5 to 6 min)

> Imagine it's your normal bedtime, and you want to wind down. Open this link and go through it however feels right.

Then stay quiet. Don't explain anything, even if they get stuck. If they ask you a question, answer with "What would you expect?" or "What would you do if I weren't here?"

Start the timer when they land on the first screen. Note the time at each screen change on the notes template.

Only step in if they've been stuck for more than 30 seconds, or if something's clearly broken. Note that you did.

### Right after (1 min)

Before any questions, ask:

> In a few words, how do you feel right now compared to when we started?

Write down their exact words. This is the most honest answer you'll get all session, before they start being polite.

### Follow-up questions (8 to 10 min)

Ask in this order. Skip any they've already answered.

1. What was that, in your own words? Who is it for?
2. When you wrote what was on your mind and it came back as a list, how did that feel? Was anything on the list wrong, or missing?
3. How did the breathing part go? Could you follow it?
4. How did it feel at the end, when the screen went dark?
5. Was anything too slow, or too fast?
6. Was there a moment you almost stopped, or wanted to skip?
7. Would you use this again? When, or why not?
8. If you could change one thing, what would it be?

Then two quick ratings, 1 to 5:

- How calm did you feel at the end? (1 = not at all, 5 = very)
- How likely are you to use it again this week? (1 = not at all, 5 = very)

### Wrap-up (1 min)

> Thanks, that was really helpful. Is there anything you expected it to do that it didn't?

If they're curious, you can tell them what you were testing now.

## After each session

Fill in the notes template within an hour, while it's fresh. Write what they did and said, not what you think it means. Interpretation happens in the synthesis once all five are done.

## After all five

Fill in [synthesis.md](synthesis.md). An issue that shows up for two or more people is a pattern. An issue that shows up once is a note, unless it's a bug or an accessibility problem, which get fixed anyway.

Then, before the case study:

1. Fix the patterns that are cheap to fix.
2. Write down the ones you won't fix, and why. That part of the case study matters as much as the fixes.
