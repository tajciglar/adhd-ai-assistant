// ─── Report Template Interface ──────────────────────────────────────────────

export interface ArchetypeReportTemplate {
  archetypeId: string;
  title: string;
  innerVoiceQuote: string;
  animalDescription: string;
  aboutChild: string;
  hiddenSuperpower: string;
  brainSections: Array<{
    title: string;
    content: string;
  }>;
  dayInLife: {
    morning: string;
    school: string;
    afterSchool: string;
    bedtime: string;
  };
  drains: string[];
  fuels: string[];
  overwhelm: string;
  affirmations: string[];
  doNotSay: Array<{
    insteadOf: string;
    tryThis: string;
  }>;
  closingLine: string;
}

// ─── Koala Template ─────────────────────────────────────────────────────────

const koalaTemplate: ArchetypeReportTemplate = {
  archetypeId: "koala",
  title: "The Dreamy Koala",

  innerVoiceQuote:
    `"I didn't mean to forget. I was just... somewhere else for a minute." - [NAME]`,

  animalDescription:
    "In the eucalyptus forests of eastern Australia, the Koala moves through the world at its own unhurried pace. While other animals rush and compete and react, the Koala is still — not because it lacks awareness, but because its inner world is simply more absorbing than the noise outside. It sleeps up to twenty hours a day, not out of laziness, but because its brain requires extraordinary amounts of rest to process everything it takes in. This particular Koala is the Dreamy one — the one whose inner world is so rich, so vivid, and so endlessly absorbing that the outside world can barely compete. Where others see a child who is absent, we see a mind that is simply elsewhere. And elsewhere, for [NAME], is a very interesting place.",

  aboutChild:
    "[NAME] is the child who stares out the window during dinner, forgets [HIS/HER/THEIR] shoes three times before leaving the house, and loses track of what [HE/SHE/THEY] was doing before [HE/SHE/THEY] even started. This isn't defiance and it isn't laziness — and it's important that you hear that clearly, because [NAME] has probably already been made to feel like it is both. [HIS/HER/THEIR] brain genuinely struggles to stay anchored in the present moment. It drifts, floats, and wanders into a rich inner world that feels more vivid and natural than the one everyone else seems to be living in. [HE/SHE/THEY] isn't tuning you out. [HE/SHE/THEY] is simply somewhere else entirely — and the journey back takes real effort every single time. Living with [NAME] can feel like trying to hold a conversation with someone who is perpetually just slightly out of reach. That gap is not emotional distance. It is neurological — and it is not [HIS/HER/THEIR] fault.",

  hiddenSuperpower:
    "Here is what the school reports and the frustrated mornings don't tell you: [NAME]'s drifting mind is the same mind that makes unexpected creative leaps, notices details others walk straight past, and imagines things that simply haven't existed yet. The brain that cannot stay on task is the same brain that can spend three uninterrupted hours completely absorbed in building, drawing, inventing, or storytelling — without ever needing to be told what to do next, without ever checking if anyone is watching, without ever running out of ideas. That quality of deep, self-directed focus is genuinely rare. Most people spend their entire adult lives trying to find it. [NAME] was born with it. [HE/SHE/THEY] doesn't need to be fixed. [HE/SHE/THEY] needs a world that makes room for the way [HE/SHE/THEY] naturally thinks — and a parent who understands the difference.",

  brainSections: [
    {
      title: "Attention",
      content:
        "[NAME]'s brain produces lower levels of dopamine in the prefrontal cortex — the region responsible for keeping us mentally present and engaged. In practical terms, this means [HIS/HER/THEIR] brain's anchor to the present moment is significantly looser than most people's. It's not that [HE/SHE/THEY] doesn't care about what you're saying. It's that without sufficient stimulation or novelty, [HIS/HER/THEIR] brain quite literally cannot maintain its grip on the now — it slides, quietly and without warning, into internal thought. When [NAME] seems to have not heard you, [HE/SHE/THEY] very likely didn't. Not because [HE/SHE/THEY] chose to ignore you, but because the signal never fully arrived. [HIS/HER/THEIR] brain had already drifted before the sentence was finished. This happens at school, at the dinner table, mid-conversation, and mid-task — not occasionally, but as a consistent and exhausting feature of [HIS/HER/THEIR] daily experience.",
    },
    {
      title: "Executive Function",
      content:
        "Executive function governs the ability to start tasks, hold instructions in working memory, manage time, transition between activities, and follow through on intentions. For [NAME], this system requires significantly more external support than it does for most children [HIS/HER/THEIR] age. The gap between knowing what to do and actually beginning it can feel enormous and genuinely insurmountable without help. This is why [NAME] can tell you exactly what [HE/SHE/THEY] needs to do and still sit motionless in front of a blank page for twenty minutes. It is not procrastination. It is not stubbornness. It is a brain that needs a co-pilot to get off the ground — and there is no shame in that whatsoever.",
    },
  ],

  dayInLife: {
    morning:
      "You ask [NAME] to get dressed. [HE/SHE/THEY] nods — [HE/SHE/THEY] heard you, [HE/SHE/THEY] intends to do it — and heads to [HIS/HER/THEIR] room. When you come back, [HE/SHE/THEY] is sitting on the edge of [HIS/HER/THEIR] bed in [HIS/HER/THEIR] pajamas, holding a small Lego piece [HE/SHE/THEY] found on the floor, turning it over in [HIS/HER/THEIR] fingers with complete absorption. [HE/SHE/THEY] looks up with genuine surprise when you tell [HIM/HER/THEM] it's been fifteen minutes. [HE/SHE/THEY] is not pretending. [HE/SHE/THEY] has no idea where the time went — because for [NAME], it didn't go anywhere. It simply didn't exist. The task of getting dressed required [HIM/HER/THEM] to hold an intention, initiate a sequence of steps, and resist the pull of everything more interesting that appeared along the way. That is an enormous amount of executive work before 8am.",

    school:
      "[NAME]'s teacher describes [HIM/HER/THEM] as bright but distant. When she begins explaining something, [NAME] starts with the best of intentions. But by the third or fourth sentence, a word she used triggered a thought, which opened a door, which led somewhere else entirely — and now [NAME] is mentally three rooms away while [HIS/HER/THEIR] body sits obediently at [HIS/HER/THEIR] desk. [HE/SHE/THEY] will have no memory of the instructions. Not because [HE/SHE/THEY] wasn't trying. Because the neurological pathway that was supposed to carry that information simply didn't stay open long enough. [HE/SHE/THEY] will look around at what other children are doing and try to piece together what [HE/SHE/THEY] missed — a strategy that works sometimes and quietly exhausts [HIM/HER/THEM] every single day.",

    afterSchool:
      "You give [NAME] a simple three-step task when [HE/SHE/THEY] gets home: put your bag away, wash your hands, come for a snack. [HE/SHE/THEY] sets off with full intention. On the way to the bathroom [HE/SHE/THEY] notices [HIS/HER/THEIR] favourite book on the hallway shelf and pulls it out just to look at the cover. Twenty-five minutes later you find [HIM/HER/THEM] cross-legged on the floor of [HIS/HER/THEIR] bedroom, deeply immersed in chapter four, genuinely surprised to see you standing in the doorway. [HE/SHE/THEY] did not decide to ignore the instructions. [HE/SHE/THEY] simply got lost on the way — the way [NAME] always gets lost, quietly and completely, in whatever [HIS/HER/THEIR] brain finds most alive in that moment.",

    bedtime:
      "You might expect that a child who drifts through the day would fall asleep easily. [NAME] does not. The moment the external world goes quiet, [HIS/HER/THEIR] internal world gets louder. Thoughts arrive uninvited — ideas, memories, tomorrow's worries, a song, a question about space, something funny that happened three weeks ago. [HIS/HER/THEIR] brain, freed from the effort of trying to stay present, begins generating freely — and it is very good at it. [NAME] is often the last one asleep. This is not defiance. It is a brain that doesn't have an off switch — and it needs your patience at the end of the day as much as at the beginning.",
  },

  drains: [
    "Open-ended tasks with no clear starting point",
    "Long multi-step instructions given all at once",
    "Being rushed or pressured when [HE/SHE/THEY] is mid-thought",
    "Constant background noise or unpredictable environments",
    "Being asked why [HE/SHE/THEY] forgot — [HE/SHE/THEY] genuinely doesn't know",
    "Transitions without any warning or preparation time",
    "Feeling like [HIS/HER/THEIR] natural pace is a problem to be solved",
  ],

  fuels: [
    "One instruction at a time, delivered with eye contact",
    "Unstructured creative time with no expected outcome",
    "Gentle re-entry after drifting — without shame",
    "Predictable daily routines that reduce decision fatigue",
    "Being recognized specifically for [HIS/HER/THEIR] imagination and ideas",
    "A 5-minute heads-up before any change of activity",
    "An adult who treats [HIS/HER/THEIR] inner world as an asset, not an obstacle",
  ],

  overwhelm:
    "[NAME]'s overwhelm does not usually arrive loudly. There is no explosion, no dramatic signal that something has gone wrong. Instead, [NAME] disappears. Not physically — [HE/SHE/THEY] is still sitting right there — but the lights go off behind [HIS/HER/THEIR] eyes and [HE/SHE/THEY] retreats somewhere unreachable. This is [HIS/HER/THEIR] nervous system's response to a world that has asked too much, too fast, with too little support. When the demands accumulate beyond what [HIS/HER/THEIR] executive system can organize, the only available response is to check out entirely.\n\nWhat makes this particularly hard for parents is that [NAME]'s overwhelm is invisible until it is complete. One minute [HE/SHE/THEY] seems fine. The next [HE/SHE/THEY] is gone — unresponsive, blank, or quietly tearful in a way that seems to have no identifiable cause. The cause is almost never the thing that happened last. It is the accumulation of everything that happened before it.\n\nIn these moments, resist the instinct to push through. Do not increase demands. Do not ask [HIM/HER/THEM] to explain [HIMSELF/HERSELF/THEMSELVES]. Instead, move close. Speak quietly and simply. A hand on the shoulder, a single low-stakes question, two minutes of sitting together without agenda — these are the things that bring [NAME] back. Once [HE/SHE/THEY] has returned, [HE/SHE/THEY] will often be ready to connect and even to try again. But that conversation can only happen after the storm — however quiet that storm may have been.",

  affirmations: [
    "I know it's hard to come back. Take your time.",
    "Forgetting doesn't mean you don't care. I know that.",
    "Your imagination is one of the best things about you.",
    "I'm not frustrated with you. I'm right here with you.",
    "You don't have to be different. You just need the right support — and we'll find it together.",
  ],

  doNotSay: [
    {
      insteadOf: "You never listen.",
      tryThis: "Let me get your eyes first, and then I'll tell you.",
    },
    {
      insteadOf: "How did you forget AGAIN?",
      tryThis: "Let's build a system together so it's easier next time.",
    },
    {
      insteadOf: "Why can't you just focus?",
      tryThis: "Let's find a quiet spot and start this one together.",
    },
    {
      insteadOf: "You were daydreaming AGAIN.",
      tryThis: "Welcome back — what were you thinking about?",
    },
    {
      insteadOf: "You'd remember if you actually cared.",
      tryThis:
        "I know you care. Your brain just works differently — and that's okay.",
    },
  ],

  closingLine:
    "[NAME] is a Dreamy Koala. And the world needs more of them.",
};

// ─── Template Registry ──────────────────────────────────────────────────────

const REPORT_TEMPLATES: ArchetypeReportTemplate[] = [koalaTemplate];

/**
 * Look up a report template by archetype ID.
 * Returns null if no template exists yet for that archetype.
 */
export function getReportTemplate(
  archetypeId: string,
): ArchetypeReportTemplate | null {
  return (
    REPORT_TEMPLATES.find((t) => t.archetypeId === archetypeId) ?? null
  );
}
