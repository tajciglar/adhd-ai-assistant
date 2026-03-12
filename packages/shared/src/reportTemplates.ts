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

const REPORT_TEMPLATES: Record<string, ArchetypeReportTemplate> = {
  "fox": {
    "fuels": [
      "Clear, specific first steps provided just before the task begins",
      "Structure that makes starting easier than avoiding",
      "Private, non-shaming conversations about what made the task feel too hard",
      "Adults who celebrate [HIS/HER/THEIR] verbal intelligence while addressing the gap underneath",
      "Support systems that make the hard things genuinely more manageable",
      "Being understood as someone whose brain found a clever workaround for a real problem",
      "Explicit, concrete expectations delivered without room for negotiation"
    ],
    "title": "THE CLEVER FOX",
    "drains": [
      "Tasks that feel cognitively overwhelming with no starting support",
      "Environments where avoidance is easy and support is absent",
      "Being caught out and shamed for avoidance behavior",
      "Feeling like [HIS/HER/THEIR] intelligence is being used against [HIM/HER/THEM]",
      "Consequences that don't address the underlying executive struggle",
      "Being labeled as manipulative or dishonest",
      "Unstructured tasks with no clear expectations"
    ],
    "doNotSay": [
      {
        "tryThis": "\"I can see you're trying to get around this. Let's talk about what makes it feel so hard.\"",
        "insteadOf": "\"Stop trying to manipulate me.\""
      },
      {
        "tryThis": "\"I know you're not trying to lie. Your brain is trying to avoid something difficult.\"",
        "insteadOf": "\"You're so dishonest.\""
      },
      {
        "tryThis": "\"You are clever. Let's use that for something that actually helps you.\"",
        "insteadOf": "\"You think you're so clever.\""
      },
      {
        "tryThis": "\"I see what's happening. And I also see how hard this feels. Let's do it together.\"",
        "insteadOf": "\"I can see right through you.\""
      },
      {
        "tryThis": "\"I want to help you get to a place where you don't need to get away with anything.\"",
        "insteadOf": "\"You'll never get away with this forever.\""
      }
    ],
    "dayInLife": {
      "school": "[NAME]'s classroom behavior is a study in social intelligence deployed in service of executive avoidance. [HE/SHE/THEY] asks questions at strategic moments, not always because [HE/SHE/THEY] doesn't know the answer, but because a question buys time and shifts attention. [HE/SHE/THEY] volunteers for tasks that involve talking or presenting, because these activate [HIS/HER/THEIR] genuine strengths, and finds reasons to avoid tasks that require sustained written output or careful sequential work. Teachers often describe [NAME] as bright but inconsistent, engaged but avoidant, charming but frustrating. All of these things are true simultaneously, and they all point to the same underlying dynamic.",
      "bedtime": "[NAME] is often at [HIS/HER/THEIR] most genuinely connected at bedtime, the social performance of the day has wound down, the pressure to manage and navigate has eased, and what remains is often a surprisingly open, thoughtful, emotionally honest child who wants to talk, to connect, and to be known. These moments are worth protecting. The child [NAME] is at 9pm, curious, warm, unguarded, is the child [HE/SHE/THEY] is underneath all the cleverness. Make time for that child every day.",
      "morning": "[NAME] is often one of the smoother morning operators in the house, not because the executive demands of the morning are easier for [HIM/HER/THEM], but because [HE/SHE/THEY] has learned to navigate them socially. A well-timed joke, a redirect of your attention, a charming question that shifts the focus of the conversation, [NAME] has a toolkit for managing morning pressure that doesn't involve actually completing the morning routine. You may find yourself laughing at something [HE/SHE/THEY] said and then realizing five minutes later that [HE/SHE/THEY] still hasn't put [HIS/HER/THEIR] shoes on. This is not deliberate manipulation. It is [NAME]'s most reliable coping strategy operating exactly as it was designed to.",
      "afterSchool": "Homework is where [NAME]'s avoidance strategies are most visible and most persistent. The negotiation, the bargaining, the creative reframing of why the homework doesn't need to be done right now, the sudden urgent need to tell you something important just as you sit down together, these are all [NAME]'s executive system doing what it does best. The task feels genuinely hard. The social route around it feels genuinely easy. Until the environment changes to make avoidance less available and support more present, this dynamic will repeat reliably every afternoon."
    },
    "overwhelm": "[NAME]'s overwhelm is one of the least visible on this list, because [HIS/HER/THEIR] primary response to difficulty is social navigation rather than emotional escalation or physical dysregulation. When [NAME] is overwhelmed, [HE/SHE/THEY] talks more, deflects more, jokes more, negotiates more. The performance intensifies. The charm goes up. And underneath it, quietly, [NAME] is at the limit of what [HIS/HER/THEIR] executive system can manage.\nThe moment when this facade breaks, when the social navigation finally fails, when the task cannot be avoided any longer, when the consequence is unavoidable, can be surprisingly raw. [NAME] may cry, shut down, express genuine shame, or become uncharacteristically quiet. This is [HIM/HER/THEM] without the toolkit. And it is a moment that requires enormous gentleness, because underneath all the cleverness is a child who knows, on some level, that [HE/SHE/THEY] keeps finding ways around things [HE/SHE/THEY] should be able to do, and who carries more shame about that than [HE/SHE/THEY] ever lets on.\nIn these moments the most powerful thing you can do is separate the behavior from the child completely. The avoidance is a strategy. It is not [NAME]. And [NAME] needs to hear that clearly, not just once, but consistently, over time, until [HE/SHE/THEY] begins to believe it.",
    "aboutChild": "[NAME] is the child who can talk [HIMSELF/HERSELF/THEMSELVES] out of almost anything. [HE/SHE/THEY] has an answer for every question, a reason for every situation, and a remarkably persuasive way of presenting both that can leave adults genuinely uncertain about what just happened. [HE/SHE/THEY] is charming, genuinely, naturally, effortlessly charming, in a way that makes people want to give [HIM/HER/THEM] the benefit of the doubt even when the evidence suggests they probably shouldn't. [NAME] is not manipulative in a calculated or malicious sense. [HE/SHE/THEY] is doing what [HIS/HER/THEIR] brain does automatically and extremely well, reading the social situation, identifying the path of least resistance, and using language to navigate toward it.\nWhat drives this behavior is not dishonesty of character. It is the intersection of two neurological realities, a genuine struggle with executive function that makes certain tasks feel insurmountable, and a highly developed social intelligence that has learned, quite effectively, to compensate. When a task feels too hard to start, too overwhelming to organize, or too cognitively demanding to sustain, [NAME]'s brain does not shut down. It finds another route. And the route it has found, charm, persuasion, reframing, works often enough to have become [HIS/HER/THEIR] default response. Understanding this changes everything about how you respond to it.",
    "archetypeId": "fox",
    "closingLine": "[NAME] is a Clever Fox. And the world needs more of them.",
    "affirmations": [
      "\"You are not your avoidance. That's just your brain finding a way around something hard.\"",
      "\"Your cleverness is genuinely one of your best qualities. We're going to use it for bigger things.\"",
      "\"I'm not trying to catch you out. I'm trying to make the hard things easier.\"",
      "\"I know it feels easier to talk your way around things. Let's make doing them feel easier too.\"",
      "\"I see who you are underneath all of this. And that person is extraordinary.\""
    ],
    "brainSections": [
      {
        "title": "Attention",
        "content": "[NAME]'s profile is shaped by two areas where [HIS/HER/THEIR] brain works differently, and understanding both explains the behavior that is most challenging to live with in a way that makes it genuinely easier to respond to. The first is executive function. [NAME]'s brain struggles with the cognitive work of organizing, initiating, and sustaining effort on tasks that feel difficult, boring, or cognitively demanding. This is not laziness, it is a genuine neurological gap in the system that generates the activation energy needed to begin and persist with hard things. When [NAME] encounters a task that triggers this gap, a difficult worksheet, a multi-step project, a demand that exceeds [HIS/HER/THEIR] current executive capacity, the discomfort is real and significant. It is not mild reluctance. It is something closer to genuine cognitive pain. The avoidance that follows is not a choice to be lazy. It is a nervous system protecting itself from an experience it finds genuinely aversive."
      },
      {
        "title": "Hyperactivity",
        "content": "The second is social awareness. [NAME]'s social intelligence is genuinely high, and this is both a strength and, in its current form, a complicating factor. [HE/SHE/THEY] reads people with precision. [HE/SHE/THEY] knows what adults want to hear, what will defuse a situation, what angle will be most persuasive. [HE/SHE/THEY] uses this knowledge fluidly and instinctively in social situations, including situations where the goal is to avoid something [HIS/HER/THEIR] executive system finds too difficult to face. The social intelligence is real. The executive struggle underneath it is equally real. And the charm is, at its core, a coping strategy, one that works in the short term and builds significant problems in the long term if the underlying executive gap is never properly addressed."
      }
    ],
    "innerVoiceQuote": "I didn't lie exactly. I just... reframed the situation.",
    "hiddenSuperpower": "The verbal intelligence, social awareness, and adaptive thinking that [NAME] currently uses to avoid difficult tasks are the same qualities that will one day make [HIM/HER/THEM] exceptional. The ability to read a room, find the right words, adapt to any audience, and think laterally around obstacles is genuinely rare and genuinely valuable. Leaders, negotiators, communicators, entrepreneurs, the qualities [NAME] is already demonstrating at [HIS/HER/THEIR] age are the foundation of extraordinary capability. The goal is not to suppress these qualities. It is to create an environment where [NAME]'s executive struggles are supported enough that [HE/SHE/THEY] no longer needs to rely on charm as a workaround, and can start using these gifts for something bigger.",
    "animalDescription": "The Fox is widely regarded as one of the most intelligent animals in the natural world, not because it is the strongest or the fastest, but because it is the most adaptable. It reads its environment with extraordinary precision, identifies exactly what is needed in any given situation, and finds a way to get there that most other animals would never think of. It doesn't force its way through obstacles. It finds the gap, the angle, the clever route that was always there but invisible to everyone else. This particular Fox is the Clever one, not clever as a compliment, but clever as a defining feature of how [HIS/HER/THEIR] brain operates. [NAME] doesn't just think. [NAME] thinks around things, and that is a quality that will serve [HIM/HER/THEM] extraordinarily well for the rest of [HIS/HER/THEIR] life, once the right environment is found to channel it."
  },
  "hummingbird": {
    "fuels": [
      "Regular movement breaks built into the day",
      "Tasks with novelty, variety or a competitive element",
      "One clear instruction at a time with immediate feedback",
      "Physical activity before demanding cognitive tasks",
      "Being given legitimate ways to move and fidget",
      "Clear signals before every change of activity",
      "An adult who channels [HIS/HER/THEIR] energy rather than suppresses it"
    ],
    "title": "THE FLASH HUMMINGBIRD",
    "drains": [
      "Long periods of required stillness",
      "Repetitive, low-stimulation tasks",
      "Multi-step instructions given all at once",
      "Environments with no outlet for physical energy",
      "Being constantly corrected for movement and noise",
      "Transitions without warning or structure",
      "Feeling like [HIS/HER/THEIR] energy is a problem"
    ],
    "doNotSay": [
      {
        "tryThis": "\"Let's find a way for you to move while we do this.\"",
        "insteadOf": "\"Why can't you just sit still?\""
      },
      {
        "tryThis": "\"Let's pick one thing and finish it together.\"",
        "insteadOf": "\"You never finish anything.\""
      },
      {
        "tryThis": "\"I need a minute. Then I'm all yours.\"",
        "insteadOf": "\"You're so exhausting.\""
      },
      {
        "tryThis": "\"Let me get your full attention for just 30 seconds.\"",
        "insteadOf": "\"Why don't you ever listen?\""
      },
      {
        "tryThis": "\"I can see you're really revved up. Let's get some energy out first.\"",
        "insteadOf": "\"You're driving me crazy.\""
      }
    ],
    "dayInLife": {
      "school": "[NAME]'s classroom is a significant daily challenge. Sitting still for extended periods goes against everything [HIS/HER/THEIR] nervous system needs. [HE/SHE/THEY] fidgets, shifts, taps, gets up, calls out, not to disrupt, but to regulate. [HIS/HER/THEIR] teacher may describe [HIM/HER/THEM] as disruptive, impulsive, or unable to follow instructions. What is actually happening is a child whose brain requires movement and novelty to stay engaged, trapped in an environment designed for stillness and repetition. [NAME] is not the problem in that classroom. The mismatch between [HIS/HER/THEIR] neurological needs and the environment's demands is the problem.",
      "bedtime": "[NAME]'s brain does not have a natural dimmer switch. As the day winds down for everyone else, [HIS/HER/THEIR] nervous system is still running. Getting [NAME] to sleep requires more than just putting [HIM/HER/THEM] to bed, it requires a deliberate, consistent wind-down sequence that gradually reduces stimulation. Screens, roughhousing, and exciting conversations close to bedtime will significantly delay sleep. A predictable, calm routine, the same every night, is one of the most powerful tools you have for this part of the day.",
      "morning": "Getting [NAME] out of the house in the morning is one of the most reliably challenging parts of your day, and it will be until the right systems are in place. [HE/SHE/THEY] wakes up already in motion, already talking, already interested in seventeen things before [HIS/HER/THEIR] feet hit the floor. Each step of the morning routine is an opportunity for [HIS/HER/THEIR] attention to be captured by something more interesting than the last. Getting dressed requires passing the bookshelf. Brushing teeth requires walking past the bedroom where something interesting is happening. Every transition is a potential detour, not because [NAME] is being difficult, but because [HIS/HER/THEIR] brain treats every new stimulus as equally important and equally worthy of immediate attention.",
      "afterSchool": "If you were hoping the energy would be lower after a full day of school, it often isn't, at least not immediately. [NAME] arrives home like a pressure valve releasing. Everything that was held in, sat on, and suppressed during the school day comes out at once, in noise, in movement, in a torrent of words about everything and nothing. This is not [NAME] being difficult. This is [NAME] finally being somewhere safe enough to be fully [HIMSELF/HERSELF/THEMSELVES]. Give [HIM/HER/THEM] time and space to decompress before asking anything of [HIM/HER/THEM]."
    },
    "overwhelm": "[NAME]'s overwhelm looks different from most children's. It rarely arrives as quiet withdrawal, it arrives as escalation. When [NAME]'s nervous system reaches its limit, the movement gets bigger, the noise gets louder, the behavior gets more dysregulated. What looks like [NAME] \"acting up\" is often actually [NAME] at the edge of what [HIS/HER/THEIR] nervous system can manage. The stimulation has become too much, the demands have piled up, and the only available response is to go faster and louder rather than slower and quieter.\nIn these moments the instinct is often to clamp down, to demand stillness, raise your voice, increase consequences. This will almost always make things worse. What [NAME] needs when escalating is a reduction in demands, an increase in space, and if possible a physical outlet, a run outside, a jumping session, something that lets the nervous system discharge rather than implode. Once the physical release has happened, [NAME] will come back to baseline faster than you might expect. The recovery time for a Flash Hummingbird, when handled well, is remarkably short.",
    "aboutChild": "[NAME] is the child who is everywhere and nowhere at the same time. [HE/SHE/THEY] starts breakfast, remembers something funny, slides off the chair, picks up a toy from the floor, begins building something, hears a noise outside, goes to investigate, and is genuinely surprised ten minutes later when you point out that the cereal is still on the table, untouched and soggy. This is not defiance. This is not a lack of caring. This is a brain and a body that are wired to keep moving, keep seeking, keep starting, and that find it genuinely, neurologically difficult to slow down, land, and finish. [NAME] is not scattered because [HE/SHE/THEY] is lazy or careless. [HE/SHE/THEY] is scattered because [HIS/HER/THEIR] brain is running at a speed that the world around [HIM/HER/THEM] simply wasn't designed to match.\nLiving with [NAME] is exhilarating and exhausting in almost equal measure. [HE/SHE/THEY] brings energy, spontaneity and an infectious aliveness to every room [HE/SHE/THEY] enters. [HE/SHE/THEY] also leaves a trail, of unfinished tasks, lost belongings, interrupted conversations, and half-built creations, that can make daily life feel like an endless game of catch-up. That trail is not [HIS/HER/THEIR] fault. It is the natural byproduct of a brain that is always already on to the next thing.",
    "archetypeId": "hummingbird",
    "closingLine": "[NAME] is a Flash Hummingbird. And the world needs more of them.",
    "affirmations": [
      "\"Your energy is not a problem. We just need to find it the right place to go.\"",
      "\"I know sitting still is really hard for you. That's not your fault.\"",
      "\"You are not too much. You are exactly right.\"",
      "\"I love how excited you get about things. That's one of my favorite things about you.\"",
      "\"We'll figure out a system together. I'm not giving up on finding what works.\""
    ],
    "brainSections": [
      {
        "title": "Attention",
        "content": "[NAME]'s profile is shaped by two areas where [HIS/HER/THEIR] brain works differently, and understanding both changes everything about how you interpret [HIS/HER/THEIR] behavior. The first is attention. [NAME]'s brain has a dopamine regulation system that is constantly seeking novelty and stimulation. The moment a task becomes familiar, repetitive, or unstimulating, [HIS/HER/THEIR] brain begins scanning for something more activating, not as a choice, but as an automatic neurological response. This is why [NAME] can be completely absorbed in something exciting one minute and completely disengaged from something routine the next. The issue is never ability or desire. It is whether the task in front of [HIM/HER/THEM] is generating enough neurological stimulation to hold [HIS/HER/THEIR] brain in place. When it isn't, and for most ordinary tasks, it isn't, [HIS/HER/THEIR] attention simply moves on without asking permission."
      },
      {
        "title": "Hyperactivity",
        "content": "The second is hyperactivity. [NAME]'s brain and body are in a state of constant activation. This is not excess energy that can be burned off with enough exercise, though movement absolutely helps. It is a neurological baseline that sits significantly higher than most children [HIS/HER/THEIR] age. [HIS/HER/THEIR] body moves because [HIS/HER/THEIR] nervous system needs it to. Fidgeting, squirming, getting up, touching things, making noise, these are not misbehaviors. They are [NAME]'s nervous system regulating itself the only way it knows how. Stillness, for [NAME], is not restful. It is genuinely effortful, and demanding it without support is like asking someone to hold their breath for an extended period and then being frustrated when they gasp for air."
      }
    ],
    "innerVoiceQuote": "I was doing it. I just also started doing some other things.",
    "hiddenSuperpower": "The same engine that makes [NAME] so hard to keep up with is the engine that makes [HIM/HER/THEM] extraordinary in the right environment. [NAME] generates ideas faster than most people process them. [HE/SHE/THEY] is first, first to try, first to respond, first to notice something new, first to suggest something nobody else thought of. [HIS/HER/THEIR] enthusiasm is genuine and contagious. When [NAME] is interested in something, truly interested, the focus and energy [HE/SHE/THEY] brings to it is unlike anything you have seen from a child. The goal is not to slow [NAME] down. The goal is to build a world around [HIM/HER/THEM] that gives that extraordinary energy somewhere meaningful to land.",
    "animalDescription": "The Hummingbird is the most energetic creature on earth, beating its wings up to 80 times per second, visiting hundreds of flowers in a single day, never fully still, never fully done. It doesn't choose this pace. It is simply built this way, its metabolism demands constant movement and constant input just to survive. This particular Hummingbird is the Flash one, here, gone, already somewhere else before you finished the sentence. Not because it doesn't care about where it just was. Because the next thing is already calling, and the body was moving before the brain had a chance to decide."
  },
  "koala": {
    "fuels": [
      "One instruction at a time, delivered with eye contact",
      "Unstructured creative time with no expected outcome",
      "Gentle re-entry after drifting, without shame",
      "Predictable daily routines that reduce decision fatigue",
      "Being recognized specifically for [HIS/HER/THEIR] imagination and ideas",
      "A 5-minute heads-up before any change of activity",
      "An adult who treats [HIS/HER/THEIR] inner world as an asset, not an obstacle"
    ],
    "title": "THE DREAMY KOALA",
    "drains": [
      "Open-ended tasks with no clear starting point",
      "Long multi-step instructions given all at once",
      "Being rushed or pressured when [HE/SHE/THEY] is mid-thought",
      "Constant background noise or unpredictable environments",
      "Being asked why [HE/SHE/THEY] forgot, [HE/SHE/THEY] genuinely doesn't know",
      "Transitions without any warning or preparation time",
      "Feeling like [HIS/HER/THEIR] natural pace is a problem to be solved"
    ],
    "doNotSay": [
      {
        "tryThis": "\"Let me get your eyes first, and then I'll tell you.\"",
        "insteadOf": "\"You never listen.\""
      },
      {
        "tryThis": "\"Let's build a system together so it's easier next time.\"",
        "insteadOf": "\"How did you forget AGAIN?\""
      },
      {
        "tryThis": "\"Let's find a quiet spot and start this one together.\"",
        "insteadOf": "\"Why can't you just focus?\""
      },
      {
        "tryThis": "\"Welcome back, what were you thinking about?\"",
        "insteadOf": "\"You were daydreaming AGAIN.\""
      },
      {
        "tryThis": "\"I know you care. Your brain just works differently, and that's okay.\"",
        "insteadOf": "\"You'd remember if you actually cared.\""
      }
    ],
    "dayInLife": {
      "school": "[NAME]'s teacher describes [HIM/HER/THEM] as bright but distant. When she begins explaining something, [NAME] starts with the best of intentions. But by the third or fourth sentence, a word she used triggered a thought, which opened a door, which led somewhere else entirely, and now [NAME] is mentally three rooms away while [HIS/HER/THEIR] body sits obediently at [HIS/HER/THEIR] desk. [HE/SHE/THEY] will have no memory of the instructions. Not because [HE/SHE/THEY] wasn't trying. Because the neurological pathway that was supposed to carry that information simply didn't stay open long enough. [HE/SHE/THEY] will look around at what other children are doing and try to piece together what [HE/SHE/THEY] missed, a strategy that works sometimes and quietly exhausts [HIM/HER/THEM] every single day.\n",
      "bedtime": "You might expect that a child who drifts through the day would fall asleep easily. [NAME] does not. The moment the external world goes quiet, [HIS/HER/THEIR] internal world gets louder. Thoughts arrive uninvited, ideas, memories, tomorrow's worries, a song, a question about space, something funny that happened three weeks ago. [HIS/HER/THEIR] brain, freed from the effort of trying to stay present, begins generating freely, and it is very good at it. [NAME] is often the last one asleep. This is not defiance. It is a brain that doesn't have an off switch, and it needs your patience at the end of the day as much as at the beginning.",
      "morning": "You ask [NAME] to get dressed. [HE/SHE/THEY] nods, [HE/SHE/THEY] heard you, [HE/SHE/THEY] intends to do it, and heads to [HIS/HER/THEIR] room. When you come back, [HE/SHE/THEY] is sitting on the edge of [HIS/HER/THEIR] bed in [HIS/HER/THEIR] pajamas, holding a small Lego piece [HE/SHE/THEY] found on the floor, turning it over in [HIS/HER/THEIR] fingers with complete absorption. [HE/SHE/THEY] looks up with genuine surprise when you tell [HIM/HER/THEM] it's been fifteen minutes. [HE/SHE/THEY] is not pretending. [HE/SHE/THEY] has no idea where the time went, because for [NAME], it didn't go anywhere. It simply didn't exist. The task of getting dressed required [HIM/HER/THEM] to hold an intention, initiate a sequence of steps, and resist the pull of everything more interesting that appeared along the way. That is an enormous amount of executive work before 8am.\nWhat helps: give [NAME] one step at a time ('put on your shirt' — wait — 'now your trousers') rather than the whole sequence. Stay nearby. The gentle, repeated re-anchoring is the support, not the nagging.",
      "afterSchool": "You give [NAME] a simple three-step task when [HE/SHE/THEY] gets home: put your bag away, wash your hands, come for a snack. [HE/SHE/THEY] sets off with full intention. On the way to the bathroom [HE/SHE/THEY] notices [HIS/HER/THEIR] favourite book on the hallway shelf and pulls it out just to look at the cover. Twenty-five minutes later you find [HIM/HER/THEM] cross-legged on the floor of [HIS/HER/THEIR] bedroom, deeply immersed in chapter four, genuinely surprised to see you standing in the doorway. [HE/SHE/THEY] did not decide to ignore the instructions. [HE/SHE/THEY] simply got lost on the way, the way [NAME] always gets lost, quietly and completely, in whatever [HIS/HER/THEIR] brain finds most alive in that moment.\n"
    },
    "overwhelm": "When [NAME] Gets Overwhelmed [NAME]'s overwhelm does not usually arrive loudly. There is no explosion, no dramatic signal that something has gone wrong. Instead, [NAME] disappears. Not physically, [HE/SHE/THEY] is still sitting right there, but the lights go off behind [HIS/HER/THEIR] eyes and [HE/SHE/THEY] retreats somewhere unreachable. This is [HIS/HER/THEIR] nervous system's response to a world that has asked too much, too fast, with too little support. When the demands accumulate beyond what [HIS/HER/THEIR] executive system can organize, the only available response is to check out entirely.\nWhat makes this particularly hard for parents is that [NAME]'s overwhelm is invisible until it is complete. One minute [HE/SHE/THEY] seems fine. The next [HE/SHE/THEY] is gone, unresponsive, blank, or quietly tearful in a way that seems to have no identifiable cause. The cause is almost never the thing that happened last. It is the accumulation of everything that happened before it.\nIn these moments, resist the instinct to push through. Do not increase demands. Do not ask [HIM/HER/THEM] to explain [HIMSELF/HERSELF/THEMSELVES]. Instead, move close. Speak quietly and simply. A hand on the shoulder, a single low-stakes question, two minutes of sitting together without agenda, these are the things that bring [NAME] back. Once [HE/SHE/THEY] has returned, [HE/SHE/THEY] will often be ready to connect and even to try again. But that conversation can only happen after the storm, however quiet that storm may have been.\n",
    "aboutChild": "[NAME] is the child who stares out the window during dinner, forgets [HIS/HER/THEIR] shoes three times before leaving the house, and loses track of what [HE/SHE/THEY] was doing before [HE/SHE/THEY] even started. This isn't defiance and it isn't laziness, and it's important that you hear that clearly, because [NAME] has probably already been made to feel like it is both. [HIS/HER/THEIR] brain genuinely struggles to stay anchored in the present moment. It drifts, floats, and wanders into a rich inner world that feels more vivid and natural than the one everyone else seems to be living in. [HE/SHE/THEY] isn't tuning you out. [HE/SHE/THEY] is simply somewhere else entirely, and the journey back takes real effort every single time. Living with [NAME] can feel like trying to hold a conversation with someone who is perpetually just slightly out of reach. That gap is not emotional distance. It is neurological, and it is not [HIS/HER/THEIR] fault.",
    "archetypeId": "koala",
    "closingLine": "[NAME] is a Dreamy Koala. And the world needs more of them.",
    "affirmations": [
      "\"I know it's hard to come back. Take your time.\"",
      "\"Forgetting doesn't mean you don't care. I know that.\"",
      "\"Your imagination is one of the best things about you.\"",
      "\"I'm not frustrated with you. I'm right here with you.\"",
      "\"You don't have to be different. You just need the right support, and we'll find it together.\""
    ],
    "brainSections": [
      {
        "title": "Attention",
        "content": "The first is attention. [NAME]'s brain produces lower levels of dopamine in the prefrontal cortex, the region responsible for keeping us mentally present and engaged. In practical terms, this means [HIS/HER/THEIR] brain's anchor to the present moment is significantly looser than most people's. It's not that [HE/SHE/THEY] doesn't care about what you're saying. It's that without sufficient stimulation or novelty, [HIS/HER/THEIR] brain quite literally cannot maintain its grip on the now, it slides, quietly and without warning, into internal thought. When [NAME] seems to have not heard you, [HE/SHE/THEY] very likely didn't. Not because [HE/SHE/THEY] chose to ignore you, but because the signal never fully arrived. [HIS/HER/THEIR] brain had already drifted before the sentence was finished. This happens at school, at the dinner table, mid-conversation, and mid-task, not occasionally, but as a consistent and exhausting feature of [HIS/HER/THEIR] daily experience."
      },
      {
        "title": "Executive function",
        "content": "the brain's internal management system, housed in that same prefrontal region. Executive function governs the ability to start tasks, hold instructions in working memory, manage time, transition between activities, and follow through on intentions. For [NAME], this system requires significantly more external support than it does for most children [HIS/HER/THEIR] age. The gap between knowing what to do and actually beginning it can feel enormous and genuinely insurmountable without help. This is why [NAME] can tell you exactly what [HE/SHE/THEY] needs to do and still sit motionless in front of a blank page for twenty minutes. It is not procrastination. It is not stubbornness. It is a brain that needs a co-pilot to get off the ground, and there is no shame in that whatsoever.\n"
      }
    ],
    "innerVoiceQuote": "I didn't mean to forget. I was just... somewhere else for a minute.\n",
    "hiddenSuperpower": "[NAME]'s Hidden Superpower Here is what the school reports and the frustrated mornings don't tell you: [NAME]'s drifting mind is the same mind that makes unexpected creative leaps, notices details others walk straight past, and imagines things that simply haven't existed yet. The brain that cannot stay on task is the same brain that can spend three uninterrupted hours completely absorbed in building, drawing, inventing, or storytelling, without ever needing to be told what to do next, without ever checking if anyone is watching, without ever running out of ideas. That quality of deep, self-directed focus is genuinely rare. Most people spend their entire adult lives trying to find it. [NAME] was born with it. [HE/SHE/THEY] doesn't need to be fixed. [HE/SHE/THEY] needs a world that makes room for the way [HE/SHE/THEY] naturally thinks, and a parent who understands the difference.",
    "animalDescription": "The Koala In the eucalyptus forests of eastern Australia, the Koala moves through the world at its own unhurried pace. While other animals rush and compete and react, the Koala is still, not because it lacks awareness, but because its inner world is simply more absorbing than the noise outside. It sleeps up to twenty hours a day, not out of laziness, but because its brain requires extraordinary amounts of rest to process everything it takes in. This particular Koala is the Dreamy one, the one whose inner world is so rich, so vivid, and so endlessly absorbing that the outside world can barely compete. Where others see a child who is absent, we see a mind that is simply elsewhere. And elsewhere, for [NAME], is a very interesting place."
  },
  "meerkat": {
    "fuels": [
      "Calm, low-stimulation spaces with predictable sensory input",
      "Soft, seamless clothing chosen with [HIS/HER/THEIR] input",
      "Warning before transitions or changes in environment",
      "Gentle, low-pressure re-entry with no immediate demands",
      "Protected quiet time after school before any activities",
      "An adult who takes [HIS/HER/THEIR] sensory experience seriously",
      "Being understood as someone whose nervous system works differently"
    ],
    "title": "THE OBSERVING MEERKAT",
    "drains": [
      "Loud, unpredictable, or crowded environments",
      "Clothing with uncomfortable textures, tags, or tight fits",
      "Sudden loud noises or unexpected sensory surprises",
      "Being pulled out of internal retreat without warning",
      "Busy after-school schedules with no decompression time",
      "Environments where sensory needs are dismissed or minimized",
      "Being described as \"too sensitive\" or \"overreacting\""
    ],
    "doNotSay": [
      {
        "tryThis": "\"Your nervous system works differently. Let's figure out what helps.\"",
        "insteadOf": "\"You're too sensitive.\""
      },
      {
        "tryThis": "\"I know that's uncomfortable. Let's find a way to make it easier.\"",
        "insteadOf": "\"Just ignore it.\""
      },
      {
        "tryThis": "\"I believe you that it's too much. Let's find some quiet.\"",
        "insteadOf": "\"There's nothing to be overwhelmed about.\""
      },
      {
        "tryThis": "\"Welcome back. Take your time, I'll wait.\"",
        "insteadOf": "\"Stop daydreaming and pay attention.\""
      },
      {
        "tryThis": "\"You're not weak. You're wired differently, and that's okay.\"",
        "insteadOf": "\"You need to toughen up.\""
      }
    ],
    "dayInLife": {
      "school": "The classroom is [NAME]'s most challenging environment. It is bright, noisy, unpredictable, and full of competing sensory demands, all of which [NAME]'s nervous system is processing at high intensity while simultaneously trying to learn, follow instructions, and manage social interactions. The result is that [NAME] retreats. [HE/SHE/THEY] goes quiet, looks away, appears to switch off. Teachers often interpret this as disengagement or lack of effort. What is actually happening is a child whose sensory system has reached its processing limit and has made the only available decision, redirect inward, reduce external input, protect what remains of the available cognitive capacity.",
      "bedtime": "Bedtime can actually be one of the easier parts of [NAME]'s day, if the environment is right. Low light, familiar textures, quiet and predictable surroundings are exactly what [HIS/HER/THEIR] nervous system needs to settle. The challenge is the transition to that environment, moving from the sensory demands of the evening to the calm of bed requires a gradual, consistent wind-down that reduces stimulation incrementally. Abrupt transitions, screens close to bedtime, or unexpected changes to the routine will make settling significantly harder for [NAME] than it needs to be.",
      "morning": "[NAME]'s morning is often derailed before it begins, not by explosive behavior or physical distraction, but by the quiet accumulation of sensory information that starts the moment [HE/SHE/THEY] wakes up. The texture of [HIS/HER/THEIR] clothing. The brightness of the kitchen light. The noise of the radio or a sibling's voice. The smell of breakfast. Each of these is a small sensory input that most people process automatically and unconsciously. For [NAME], each one requires active neurological processing, and by the time [HE/SHE/THEY] reaches the breakfast table, [HIS/HER/THEIR] system is already carrying a load that most children won't reach until mid-morning. The drift and the withdrawal that follow are not attitude. They are a nervous system already working at capacity.",
      "afterSchool": "[NAME] needs significant decompression time after school, more than most children, and more than most parents expect. The school day represents hours of sustained sensory and cognitive effort that is largely invisible to everyone around [HIM/HER/THEM]. Arriving home and being immediately asked questions, given tasks, or placed in another stimulating environment will often push [NAME] past the point of functional capacity. What [NAME] needs first is quiet. A low-stimulation space, minimal demands, and time to let [HIS/HER/THEIR] nervous system settle before anything else is asked of it."
    },
    "overwhelm": "[NAME]'s overwhelm is almost always quiet, and that is precisely what makes it easy to miss until it is complete. There is no explosion, no dramatic escalation, no obvious warning signal. Instead [NAME] simply goes further inside. The withdrawal deepens. [HE/SHE/THEY] becomes unreachable, not uncooperative, not defiant, just genuinely unavailable. [HIS/HER/THEIR] nervous system has reached the limit of what it can process and has shut the door on further input.\nPushing through this withdrawal, demanding engagement, increasing verbal instruction, raising expectations, will almost always extend it. [NAME]'s nervous system cannot be argued or reasoned back to baseline. It needs time, reduced stimulation, and the absence of demand. A quiet space, familiar sensory comfort, a weighted blanket, a preferred texture, a known smell, and a patient adult nearby without agenda are the most effective tools available. The return will happen. It cannot be forced. And when [NAME] does come back, [HE/SHE/THEY] will often be surprisingly present, warm, and ready to connect, because the nervous system, having been allowed to reset, is genuinely available again.",
    "aboutChild": "[NAME] is one of the most quietly observant children you will ever meet. [HE/SHE/THEY] notices things others walk straight past, the shift in someone's mood, the hum of the fluorescent light, the texture of the chair, the conversation happening three tables away. [HIS/HER/THEIR] senses are turned up higher than most people's, which means the world delivers significantly more information to [NAME] per minute than it does to the average child. For a nervous system already working hard to process that volume of input, noisy classrooms, busy shopping centres, and unpredictable social environments are not just uncomfortable, they are genuinely exhausting.\n[NAME]'s response to this is to go inside. Not physically, [HE/SHE/THEY] is still sitting right there, but mentally, [HE/SHE/THEY] retreats to a quieter, safer internal world where the input is manageable and the noise can't reach. This looks like daydreaming. It looks like inattention. It looks, sometimes, like a child who simply isn't interested or isn't trying. None of those things are true. [NAME] is trying harder than most people realize, to manage a sensory experience that is significantly more intense than average, while also appearing to function normally in environments that were not designed with [HIS/HER/THEIR] nervous system in mind.",
    "archetypeId": "meerkat",
    "closingLine": "[NAME] is an Observing Meerkat. And the world needs more of them.",
    "affirmations": [
      "\"You don't have to be on all the time. It's okay to need quiet.\"",
      "\"I know the world feels loud sometimes. We'll find the quiet together.\"",
      "\"Being sensitive is not a weakness. It's just how your brain is built.\"",
      "\"I'm not going to push you. I'll be here when you're ready.\"",
      "\"You notice things most people never see. That's actually remarkable.\""
    ],
    "brainSections": [
      {
        "title": "Attention",
        "content": "[NAME]'s profile is shaped by two areas where [HIS/HER/THEIR] brain works differently, and understanding both transforms the way you interpret [HIS/HER/THEIR] daily behavior. The first is attention. [NAME]'s brain struggles to stay anchored in the present moment, but unlike children whose inattention is driven purely by novelty-seeking, [NAME]'s drift is strongly linked to sensory load. When the environment becomes too stimulating, [HIS/HER/THEIR] brain makes an automatic protective decision to disengage from external input and redirect attention inward. This is not a voluntary choice. It is a neurological self-preservation response, the brain managing an input load it cannot sustainably process by simply reducing the amount of external information it is trying to handle. The daydream is not laziness. It is the brain's pressure valve."
      },
      {
        "title": "Hyperactivity",
        "content": "The second is sensory processing. [NAME]'s nervous system processes sensory information, sound, light, touch, smell, texture, movement, with a sensitivity that sits significantly above the typical range. The technical term is sensory over-responsivity, and research shows it is present in approximately 40-60% of children with ADHD. For [NAME], this means that environments which feel perfectly comfortable to most children can feel genuinely overwhelming, not as a matter of preference or sensitivity of character, but as a matter of neurological wiring. The classroom that feels normal to twenty-five other children may feel, to [NAME], like trying to concentrate in the middle of a crowded, noisy, bright, unpredictable space with no way to turn down the volume."
      }
    ],
    "innerVoiceQuote": "It's safer and quieter inside my own head.",
    "hiddenSuperpower": "The same heightened sensory awareness that makes busy environments so difficult for [NAME] is the source of some of [HIS/HER/THEIR] most extraordinary qualities. [NAME] notices nuance that others miss entirely. [HE/SHE/THEY] is deeply attuned to the emotional atmosphere of a room, the unspoken feelings of the people around [HIM/HER/THEM], the beauty in small details that most people walk past without seeing. [HIS/HER/THEIR] inner world is rich, detailed, and genuinely creative, built from years of retreating inside and finding that there is extraordinary territory there. Given the right environment, calm, predictable, low-stimulation, [NAME] is one of the most perceptive, thoughtful, and quietly brilliant children in the room.",
    "animalDescription": "The Meerkat is one of the most watchful creatures on earth. It stands perfectly still at the entrance to its burrow, eyes scanning the horizon in every direction simultaneously, processing the environment with a level of alertness that most animals never reach. It notices everything, every sound, every movement, every shift in the air. And when what it finds is too much, when the threat is real or the input is overwhelming, it disappears underground, into the quiet and the dark and the safety of its own space. This particular Meerkat is the Observing one, not passive, not absent, but watching everything, processing everything, and retreating inside when the world outside becomes more than [HIS/HER/THEIR] nervous system can comfortably hold."
  },
  "stallion": {
    "fuels": [
      "Visual timers and countdowns that make time physically present",
      "A specific, immediate first step with a clear time attached",
      "Experiencing natural consequences in real time where safe to do so",
      "Consistent advance warning before any change of activity",
      "Understanding that the gap is neurological, not a character flaw",
      "Systems designed specifically for the way [HIS/HER/THEIR] brain experiences time",
      "Immediate, concrete, real rewards connected directly to action"
    ],
    "title": "THE BOLD STALLION",
    "drains": [
      "Deadlines that exist only as spoken words or abstract dates",
      "Open-ended tasks with no clear starting point or urgency",
      "Being told consequences repeatedly without new information",
      "Transitions between activities without warning or structure",
      "Feeling ashamed about the gap between intention and action",
      "Being compared to siblings or peers who manage time well",
      "Vague, future-oriented motivators"
    ],
    "doNotSay": [
      {
        "tryThis": "\"Let's build in an earlier starting point together.\"",
        "insteadOf": "\"You always leave everything to the last minute.\""
      },
      {
        "tryThis": "\"I know it didn't feel urgent. Let's make it feel more real earlier next time.\"",
        "insteadOf": "\"You had all day, why didn't you just do it?\""
      },
      {
        "tryThis": "\"Your brain needs different tools for time. Let's find them.\"",
        "insteadOf": "\"You're so irresponsible.\""
      },
      {
        "tryThis": "\"Okay. We're here now. What's the first thing we can do right now?\"",
        "insteadOf": "\"I told you this would happen.\""
      },
      {
        "tryThis": "\"This is a pattern we can change. Not by trying harder, by trying differently.\"",
        "insteadOf": "\"Why do you always do this?\""
      }
    ],
    "dayInLife": {
      "school": "[NAME]'s teacher reports that [HE/SHE/THEY] frequently fails to begin assignments, leaves work unfinished, and seems unmotivated despite clearly understanding the material. What the teacher is observing is task initiation failure, the gap between knowing what to do and being able to make [HIMSELF/HERSELF/THEMSELVES] begin it. For [NAME], starting a task requires a level of activation energy that most children generate automatically. Without genuine interest, external pressure, or a very clear and immediate starting point, that activation simply doesn't arrive. [NAME] sits. Time passes. The task remains untouched. Not because [HE/SHE/THEY] doesn't care, but because the neurological signal that says \"begin now\" isn't firing.",
      "bedtime": "[NAME] often experiences a surge of emotional weight at bedtime, the things undone, the things said, the things that went wrong during the day landing with full force now that the busyness of the day has stopped. This is the emotional regulation piece of [NAME]'s profile expressing itself, feelings that were too abstract during the day becoming suddenly, vividly real in the quiet. [NAME] may want to talk, may become anxious, may find sleep genuinely difficult. A brief, calm check-in before lights out, not to problem-solve but simply to acknowledge, can make a significant difference to how settled [NAME] feels going into the night.",
      "morning": "The morning routine is a consistent challenge for [NAME], not because [HE/SHE/THEY] is resistant, but because the urgency of \"we need to leave in ten minutes\" does not land with the same emotional weight for [NAME] as it does for you. Ten minutes is \"not now.\" Five minutes is still \"not now.\" Two minutes begins to feel like \"now\", but by then it is too late. [NAME] is not ignoring the clock. [NAME]'s brain is simply not generating the anticipatory urgency that would translate time pressure into action before the last possible moment. External tools, visual timers, alarms, countdowns, that make time physically visible rather than abstractly spoken are not just helpful for [NAME]. They are neurologically necessary.",
      "afterSchool": "Homework is the most reliable daily battleground for [NAME], and the dynamic is almost always the same. There is time. [NAME] knows there is time. The homework will get done. Later. After dinner. Before bed. The time keeps moving and the homework keeps existing comfortably in \"not now\" until suddenly it is 9pm and the crisis is real and [NAME] is doing in forty frantic minutes what could have been done calmly in twenty at 4pm. This is not a strategy [NAME] is choosing. It is the predictable output of a brain that cannot generate urgency until urgency is undeniable, and the solution is external structure that creates artificial \"now\" moments earlier in the afternoon."
    },
    "overwhelm": "[NAME]'s overwhelm has a very specific shape, it arrives when \"not now\" suddenly becomes \"now\" with insufficient preparation time. The emotional crash of a missed deadline, an unexpected consequence, or a sudden realization that time has run out is genuinely dysregulating for [NAME], not because [HE/SHE/THEY] is being dramatic, but because the emotional impact of that moment is hitting [HIS/HER/THEIR] nervous system all at once, without the gradual build-up that advance awareness would have provided.\nIn these moments [NAME] may become tearful, angry, shut down, or overwhelmed in ways that seem disproportionate to the situation. They are not disproportionate to [NAME]'s experience of the situation, which is of a future that just arrived without warning and brought all of its emotional weight with it simultaneously. The most helpful response is not to focus on what went wrong or what should have been done differently. That conversation can happen later, calmly, when [NAME]'s nervous system has settled. In the immediate moment [NAME] needs acknowledgment, reduced pressure, and a clear, simple path forward, what can we do right now, with what we have, from where we are.",
    "aboutChild": "[NAME] is the child who fully intends to do everything that is asked of [HIM/HER/THEM]. This is important to understand clearly, the intention is genuine. [HE/SHE/THEY] is not avoiding tasks out of laziness or defiance. [HE/SHE/THEY] genuinely plans to do it. Later. After this. In a minute. The problem is that for [NAME], \"later\" exists in a future that doesn't feel real yet, and \"now\" is the only time that has any neurological weight. The consequence that will happen tomorrow, the deadline that arrives next week, the disappointment that will follow if the task isn't done, these things exist intellectually for [NAME] but carry almost no emotional urgency. They are abstract. They are distant. They are not now.\nAnd then suddenly they are now. The deadline has arrived. The consequence is immediate. The future has collapsed into the present with no warning, or rather, with warnings that [NAME]'s brain was not built to receive. The Stallion hears the starting gun and launches, brilliantly, boldly, with everything it has. But the starting gun should have fired an hour ago. And the gap between when [NAME] needed to begin and when [NAME] actually began is not a character flaw. It is a neurological one, and it is one of the most misunderstood features of this profile.",
    "archetypeId": "stallion",
    "closingLine": "[NAME] is a Bold Stallion. And the world needs more of them.",
    "affirmations": [
      "\"I know you meant to do it. I believe you.\"",
      "\"Your brain experiences time differently. That's not an excuse, it's an explanation.\"",
      "\"We're going to build systems that make this easier. Not just expect it to improve on its own.\"",
      "\"The fact that you can perform under pressure means the capability is absolutely there.\"",
      "\"I'm not giving up on finding what works for you. Neither should you.\""
    ],
    "brainSections": [
      {
        "title": "Attention",
        "content": "[NAME]'s profile is shaped by two areas where [HIS/HER/THEIR] brain works differently, and understanding both reframes what looks like willful avoidance as something far more neurological and far more manageable. The first is emotional regulation, specifically the way [NAME]'s brain processes the emotional weight of future events. Most people experience a form of anticipatory emotion, a feeling of mild urgency, mild anxiety, or mild motivation when thinking about an upcoming deadline or obligation. This feeling is what activates action before the deadline arrives. For [NAME], this anticipatory emotional signal is significantly weaker than average. The future deadline does not generate enough emotional weight to compete with the very real, very immediate pull of whatever is happening right now. This is not a moral failure. It is a neurological difference in how the brain's emotional forecasting system operates, and it explains almost everything about [NAME]'s relationship with time, tasks, and consequences."
      },
      {
        "title": "Hyperactivity",
        "content": "The second is executive function, specifically time awareness and task initiation. [NAME]'s brain has a genuinely impaired sense of time passing. Research describes this as \"time blindness\", a condition in which the ADHD brain experiences time not as a continuous flow but as two states: now and not now. Everything in the future exists in \"not now\", and \"not now\" has no urgency, no weight, and no ability to motivate action until it suddenly becomes \"now.\" This explains why [NAME] can be told about a deadline repeatedly and still not begin, the deadline lives in \"not now\" until the last possible moment, at which point it crashes into \"now\" with full force and [NAME] responds with everything [HE/SHE/THEY] has. The response is genuine. The timing is the problem. And the timing is neurological."
      }
    ],
    "innerVoiceQuote": "I was going to do it. I just... didn't know it was already so late.",
    "hiddenSuperpower": "What looks like chronic procrastination is actually something more complex and more interesting than it appears. [NAME]'s brain, when finally activated by genuine urgency, performs at a level that surprises everyone, including [NAME]. The focus that arrives under pressure is real, powerful, and productive. [NAME] can produce in one hour of genuine deadline pressure what takes most children an entire afternoon. That capacity is not nothing. It is a form of performance that, with the right understanding and the right systems, can be channeled rather than constantly fought. [NAME] is not a procrastinator who needs to try harder. [NAME] is someone whose brain runs on a different kind of fuel, and the goal is to find ways to generate that fuel without always requiring a crisis.",
    "animalDescription": "The Stallion is one of the most powerful animals on earth, muscular, fast, and capable of extraordinary bursts of speed and endurance when the moment demands it. But watch a Stallion in an open field and you will notice something else entirely. It stands still. It grazes. It moves unhurriedly from one patch of grass to the next, completely unbothered by the passage of time, completely unaware that anything is pressing or urgent, until something startles it. And then, instantly, it is everything it was always capable of being. Pure power, full speed, total commitment. This particular Stallion is the Bold one, not bold because it is fearless, but because when it finally moves, it moves with everything it has. The challenge is that the starting gun has to be very, very loud before this Stallion hears it."
  },
  "tiger": {
    "fuels": [
      "Tasks broken into very small, manageable steps",
      "Private, gentle redirection delivered without shame",
      "Knowing exactly what is coming and when",
      "Being named and validated before being redirected",
      "Co-regulation, a calm adult presence alongside [HIM/HER/THEM]",
      "Regular emotional check-ins throughout the day",
      "An adult who treats [HIS/HER/THEIR] emotional depth as a gift"
    ],
    "title": "THE FIERCE TIGER ",
    "drains": [
      "Tasks that feel too big with no visible starting point",
      "Being corrected or criticized in front of others",
      "Unpredictable changes to routine or expectations",
      "Feeling misunderstood or dismissed when upset",
      "Being told to \"calm down\" without being helped to",
      "Accumulating small frustrations with no release",
      "Feeling like [HIS/HER/THEIR] feelings are too much"
    ],
    "doNotSay": [
      {
        "tryThis": "\"I'm right here. We'll get through this together.\"",
        "insteadOf": "\"Calm down.\""
      },
      {
        "tryThis": "\"That felt really big, didn't it. I get it.\"",
        "insteadOf": "\"You're overreacting.\""
      },
      {
        "tryThis": "\"I can see you're really upset. Let's find a quiet spot.\"",
        "insteadOf": "\"Why does everything have to be so dramatic?\""
      },
      {
        "tryThis": "\"That was a hard start. Let's reset and try again.\"",
        "insteadOf": "\"You ruined the whole morning.\""
      },
      {
        "tryThis": "\"Your feelings are real. Let's just sit here for a minute.\"",
        "insteadOf": "\"You're being ridiculous.\""
      }
    ],
    "dayInLife": {
      "school": "A worksheet lands on [NAME]'s desk. [HE/SHE/THEY] looks at it and feels an immediate wave of something that sits between dread and panic, not because [HE/SHE/THEY] can't do the work, but because [HIS/HER/THEIR] brain has registered this task as threatening. The moment that emotional response arrives, [HIS/HER/THEIR] attention collapses and the task becomes even harder than it already was. [NAME] may cry, refuse, put [HIS/HER/THEIR] head on the desk, or react with anger that seems completely disproportionate. The teacher sees defiance or dysregulation. [NAME] is experiencing something much closer to genuine overwhelm, and needs support, not consequences.",
      "bedtime": "[NAME] replays the day. The thing someone said at lunch. The moment [HE/SHE/THEY] got in trouble. The homework that felt impossible. The friendship that felt uncertain. [HIS/HER/THEIR] brain does not release these moments easily, they sit heavy and vivid long after everyone else has moved on. Bedtime for [NAME] often requires more emotional support than the rest of the day combined. A few minutes of quiet connection, no agenda, no problem-solving, just presence, can make the difference between a settled night and a very long one.",
      "morning": "The wrong cereal. A shirt that feels slightly uncomfortable. A sibling who said something thoughtless. A permission slip that can't be found. Any one of these alone would be manageable, but for [NAME], by 7:30am the emotional load is already approaching full. Each small frustration adds to the last. When you ask [HIM/HER/THEM] to hurry up and [HE/SHE/THEY] still can't find the permission slip, the mug overflows. What looks from the outside like a meltdown about a piece of paper is actually the accumulated weight of an already overwhelming morning meeting one demand too many. [NAME] is not being dramatic. [HE/SHE/THEY] is at capacity, and capacity was reached before breakfast was finished.",
      "afterSchool": "[NAME] holds it together at school, running on willpower, social pressure, and the constant effort of managing [HIMSELF/HERSELF/THEMSELVES] in a demanding environment. When [HE/SHE/THEY] walks through your front door, that effort ends and everything that was held in releases at once. This is known as afterschool restraint collapse, and it is one of the most reliable features of [NAME]'s day. It is exhausting for everyone. It is also, in its own way, a sign of trust. [NAME] falls apart with you because you are the safest person in [HIS/HER/THEIR] world. That is not nothing."
    },
    "overwhelm": "[NAME]'s overwhelm arrives fast and takes over completely. It may look like a meltdown, a flat refusal, tears that seem wildly out of proportion, or an explosion of anger that appears to come from nowhere. What is happening underneath is a nervous system that has been flooded, logic is temporarily offline and [NAME] genuinely cannot access reason, perspective, or calm until the flood begins to recede. The window between trigger and full overwhelm is very short. The window between full overwhelm and return to baseline is much longer than it looks like it should be.\nTrying to reason, discipline, or problem-solve during this moment will make it worse, not because [NAME] is being stubborn, but because the part of [HIS/HER/THEIR] brain that can receive and process that input is temporarily unavailable. What [NAME] needs in these moments is a regulated adult nearby, minimal language, no new demands, and time. The conversation, the learning, the repair, the connection, can only happen after the storm has passed. And it should always happen. Coming back together after a hard moment is one of the most powerful things you can do for [NAME]'s long term emotional development.",
    "aboutChild": "[NAME] is a child of enormous inner weather. [HE/SHE/THEY] can be laughing and connected one moment and completely undone the next, not because [HE/SHE/THEY] is dramatic or manipulative, but because [HIS/HER/THEIR] emotional experience is genuinely more intense than most people will ever fully understand. When [NAME] faces a task that feels too big, [HIS/HER/THEIR] brain doesn't just feel frustrated, it registers a threat. When something goes wrong socially, it doesn't just feel bad, it feels catastrophic. And when something is wonderful, it is the most wonderful thing that has ever happened to anyone, ever. [NAME] lives at full emotional volume, in every direction, all the time.\nWhat makes this particularly complex is that [NAME] also struggles to stay mentally present. The combination of emotional intensity and inattention means that when feelings arrive, and they arrive fast, [HIS/HER/THEIR] already loosely anchored attention is completely swept away. There is nothing left for logic, for reasoning, for perspective. The feeling takes the whole room. This is not a behaviour problem. This is a brain that feels everything at once and hasn't yet developed the neurological tools to carry it all, and it needs your understanding far more than it needs your correction.",
    "archetypeId": "tiger",
    "closingLine": "[NAME] is a Fierce Tiger. And the world needs more of them.",
    "affirmations": [
      "\"Your feelings make sense. All of them.\"",
      "\"I'm not going anywhere. I'll be right here until it passes.\"",
      "\"You don't have to be calm to be loved.\"",
      "\"That was really hard. I saw how hard you tried.\"",
      "\"We can talk about it when you're ready. There's no rush.\""
    ],
    "brainSections": [
      {
        "title": "Attention",
        "content": "[NAME]'s profile is shaped by two areas where [HIS/HER/THEIR] brain works differently, and understanding both of them changes everything about how you see [HIS/HER/THEIR] behavior. The first is attention. [NAME]'s brain struggles to stay anchored in the present moment under ordinary circumstances, but when emotions are involved, that struggle becomes significantly more acute. The prefrontal cortex, which manages both attention and emotional regulation, is the area most affected in [NAME]'s brain. When an emotion is triggered, frustration, disappointment, excitement, shame, the emotional response floods the prefrontal cortex and attention collapses entirely. This is why [NAME] can seem to be managing reasonably well and then, after one difficult moment, become completely unreachable. The emotion didn't cause a distraction. It caused a neurological shutdown of the very system [NAME] needs to stay present, think clearly, and regulate [HIMSELF/HERSELF/THEMSELVES]."
      },
      {
        "title": "Hyperactivity",
        "content": "The second is emotional regulation. [NAME]'s emotional responses arrive faster and hit harder than [HIS/HER/THEIR] logical brain can manage. Research shows that children with this profile can experience emotions with an intensity two to three times greater than their peers, and take significantly longer to return to baseline once dysregulated. There is very little gap between feeling and reaction. By the time [NAME] is aware of the emotion, it has already taken over. This is not a choice and it is not a character flaw. It is a neurological pattern, one that responds to consistency, co-regulation, and time, not to punishment or reasoning in the heat of the moment."
      }
    ],
    "innerVoiceQuote": "Everything just felt too big and too much all at once.",
    "hiddenSuperpower": "The same emotional intensity that makes [NAME]'s hard moments so hard is the very source of [HIS/HER/THEIR] greatest gifts. [NAME] loves fiercely, creates passionately, and connects with others at a depth that most adults spend a lifetime trying to reach. [HE/SHE/THEY] will be the first to notice when someone in the room is quietly sad. The first to stand up for someone being treated unfairly. The first to pour [HIS/HER/THEIR] whole heart into something [HE/SHE/THEY] believes in, a drawing, a friendship, a cause, an idea. [NAME]'s feelings are not the problem. They are [HIS/HER/THEIR] greatest strength, waiting for the right environment to be channeled rather than contained.",
    "animalDescription": "The Tiger is one of the most powerful and capable animals on earth, and also one of the most misunderstood. It does not move in packs or perform for an audience. It carries its strength quietly, privately, and entirely on its own terms. When the Tiger is calm, it is breathtaking, focused, graceful, deeply present. When the Tiger is overwhelmed, everything changes. The response is immediate, total, and impossible to ignore. This particular Tiger is the Fierce one, not fierce because it wants to frighten anyone, but because everything it feels, it feels completely. There is no halfway with this Tiger. There is only all of it, all at once."
  }
  "rabbit": {
    "fuels": [
      "A clear, specific first step delivered just before it's needed",
      "One step at a time, confirmed before the next is given",
      "Regular, legitimate movement built into the structure of the day",
      "External organisational tools — checklists, timers, visual schedules",
      "Systems that make organisation easier, not just expectations that it improves",
      "Consistent transition routines that remove the executive load",
      "An environment that channels energy rather than suppresses it"
    ],
    "title": "THE BUSY RABBIT",
    "drains": [
      "Open-ended tasks with no clear structure or starting point",
      "Multi-step instructions given all at once",
      "Environments that require prolonged stillness",
      "Being asked to plan or organise independently",
      "Consequences for disorganisation without support",
      "Transitions without clear structure or warning",
      "Feeling like [HIS/HER/THEIR] energy is the problem"
    ],
    "doNotSay": [
      {
        "tryThis": "\"Let's build a system together that works for your brain.\"",
        "insteadOf": "\"Why can't you just get organised?\""
      },
      {
        "tryThis": "\"Let's pick one thing and finish just that one thing today.\"",
        "insteadOf": "\"You never finish anything.\""
      },
      {
        "tryThis": "\"Knowing and doing are different things. Let's bridge that gap together.\"",
        "insteadOf": "\"You knew what you had to do.\""
      },
      {
        "tryThis": "\"Let's find a good way for you to move right now.\"",
        "insteadOf": "\"Why are you always running around?\""
      },
      {
        "tryThis": "\"I know you're trying. Let's find what makes it easier.\"",
        "insteadOf": "\"You'd get it done if you actually tried.\""
      }
    ],
    "dayInLife": {
      "morning": "You tell [NAME] to get ready for school. [HE/SHE/THEY] launches into motion immediately — there is never a shortage of willingness or energy. The problem is that \"get ready for school\" is a multi-step sequence that requires [NAME] to hold several tasks in working memory simultaneously, prioritise them, and execute them in order. By the time [HE/SHE/THEY] has found one shoe, noticed something interesting, started a completely unrelated physical activity, remembered the shoe, lost the shoe again, and arrived at the front door with no bag and one sock, the time available has run out. [NAME] is not slow. [NAME] moved constantly for twenty minutes. The movement just didn't connect to the goal. What helps: give one instruction at a time (\"shoes on\" then wait, then \"bag by the door\"). A visual checklist on the wall with pictures or words keeps the sequence visible. Your presence during the routine helps anchor the steps. Over time, you can gradually step back as the habit builds.",
      "school": "[NAME]'s teacher sees a child who cannot stay in [HIS/HER/THEIR] seat, struggles to begin assignments without direct one-on-one prompting, leaves tasks unfinished, loses materials regularly, and seems to have no awareness of time passing. All of this is accurate — and all of it is executive function, not attitude. The classroom environment, which assumes a working internal organisational system, is one of the most demanding environments for [NAME]. Every request the classroom makes — sit, plan, begin, sequence, finish, transition — is a direct request on the system that is [NAME]'s greatest area of neurological difference. [NAME] is not failing to try. [NAME] is trying enormously hard in an environment that requires the one thing [HIS/HER/THEIR] brain finds hardest. What helps: ask [NAME]'s teacher to provide a clear first step when giving assignments (\"Start by writing your name and reading question one\"), allow movement breaks, and use a visual timer for transitions.",
      "afterSchool": "Free time for [NAME] is genuinely free — unstructured, unplanned, and driven entirely by whatever presents itself first. This can look like chaos to an observer. To [NAME] it feels like relief. The absence of executive demands is genuinely restorative. However, without some gentle structure, even free time can become frustrating — [NAME] may cycle through many activities without settling, not because [HE/SHE/THEY] is bored but because [HIS/HER/THEIR] brain finds it hard to self-direct even in play. A loose framework — two or three options to choose from rather than infinite open space — often helps more than it constrains. What helps: offer a simple choice (\"Do you want to ride your bike or build with Lego?\") rather than asking \"What do you want to do?\" Open-ended questions require the executive planning that is [NAME]'s hardest skill.",
      "bedtime": "The transition to bed is a significant executive challenge for [NAME]. It requires [HIM/HER/THEM] to stop a current activity, follow a sequence of steps, and arrive at sleep — all of which demand exactly the skills [HIS/HER/THEIR] brain finds hardest. A visual routine — pictures or a checklist of the bedtime steps in order — is a genuine cognitive support that removes the working memory load from a brain that is already tired and running low on regulatory capacity. A sample structure: physical wind-down 30 minutes before bed, followed by bath or shower, then 20 minutes of quiet time (reading together or calm music, no screens), then lights out. Consistency matters more than perfection."
    },
    "overwhelm": "[NAME]'s overwhelm shows up physically before anything else. When the executive demands of a situation exceed what [HIS/HER/THEIR] brain can manage — too many steps, too much to hold, too much expected without enough support — the response is escalating physical dysregulation. The movement gets bigger. The behaviour gets more erratic. The ability to follow even simple instructions fades. This is not defiance. It is a nervous system that has reached its organisational ceiling and is discharging the overload through the only channel reliably available to it — physical movement.\nIn these moments, adding more verbal instruction will not help. [NAME]'s working memory is already full. More words are simply more load on a system that is already overwhelmed. What helps is reducing demands to zero, providing a physical outlet, and waiting. Once [HIS/HER/THEIR] nervous system has discharged and returned to baseline, [NAME] will be genuinely ready to try again — and will often do so with complete willingness, as if the previous storm never happened. That reset is real. Trust it.\nIf you find this pattern happening daily, it may help to build in more physical release earlier in the day — before the demands stack up. A 15-minute burst of intense movement (running, trampolining, climbing) before homework or transitions can lower the baseline enough to prevent the overflow.",
    "aboutChild": "[NAME] is a child of extraordinary physical energy and genuine organisational challenges. [HE/SHE/THEY] is always moving, always doing, always in the middle of something — but ask [HIM/HER/THEM] what [HE/SHE/THEY] is working toward and [HE/SHE/THEY] will look at you with complete sincerity and absolutely no answer. It is not that [NAME] lacks intelligence or motivation. It is that the internal system that takes energy and points it in a useful direction — the system that creates plans, sequences steps, and tracks progress toward a goal — is not yet working the way it will one day. [NAME] has the engine of a racing car and the steering is still developing. The speed is real. The power is real. The destination is genuinely unclear.\nThis can be deeply frustrating for the adults around [NAME] — who see all that capability and energy and cannot understand why it doesn't seem to translate into anything finished, organised, or on time. It is equally frustrating for [NAME], who genuinely wants to do well, genuinely intends to complete things, and genuinely cannot understand why the gap between intention and execution is so consistently wide. [NAME] is not lazy. [NAME] is not defiant. [NAME] is running as fast as [HE/SHE/THEY] can in a direction [HE/SHE/THEY] hasn't quite figured out yet. That gap is neurological, not a character flaw.",
    "archetypeId": "rabbit",
    "closingLine": "[NAME] is a Busy Rabbit. And the world needs more of them.",
    "affirmations": [
      "\"You're not disorganised because you don't care. Your brain just needs a different system.\"",
      "\"Let's figure out the first step together. Just the first one.\"",
      "\"Your energy is one of the best things about you. We just need to give it somewhere to go.\"",
      "\"I'm not frustrated with you. I'm frustrated with the situation. There's a difference.\"",
      "\"You don't have to have it all figured out. We'll build the map together.\""
    ],
    "brainSections": [
      {
        "title": "Hyperactivity",
        "content": "[NAME]'s nervous system operates at a consistently elevated baseline. Movement is not a choice — it is a neurological requirement. [HIS/HER/THEIR] brain regulates itself through physical activity in a way that most brains do not. Fidgeting, jumping, running, bouncing, touching — these are not misbehaviours. They are [NAME]'s nervous system doing what it needs to do to stay functional. Asking [NAME] to sit still without providing an alternative way to move is like asking someone to think clearly while holding their breath. It is technically possible for very short periods. It is not sustainable. And it comes at a significant cognitive cost."
      },
      {
        "title": "Executive Function",
        "content": "Executive function is the brain's internal management system — the cognitive architecture that allows a person to make a plan, hold it in working memory, sequence the steps, initiate the first one, monitor progress, adjust when things go wrong, and follow through to completion. For [NAME], this system is still developing relative to [HIS/HER/THEIR] age and intelligence. This is not about trying harder. The research is clear that executive function in ADHD brains develops on a different timeline than neurotypical peers — meaning a ten-year-old with this profile may have the executive function capacity of a seven-year-old, regardless of how intelligent or capable they are in other areas. [NAME] does not need more motivation. [NAME] needs external scaffolding that temporarily supports the internal system that is not yet fully online."
      }
    ],
    "innerVoiceQuote": "I'm definitely doing something. I'm just not sure what yet.",
    "hiddenSuperpower": "The same explosive energy that makes structure so difficult for [NAME] is the quality that makes [HIM/HER/THEM] extraordinary in the right environment. [NAME] is fast — fast to respond, fast to act, fast to throw [HIMSELF/HERSELF/THEMSELVES] into something new with total physical commitment. [HE/SHE/THEY] is fearless in a way that genuinely careful, organised children rarely are. When the right external structure is provided — a clear starting point, a defined path, a specific goal — [NAME]'s energy becomes one of the most powerful forces in the room. This child doesn't need to be slowed down. [HE/SHE/THEY] needs to be given a track to run on. And when that track exists, [NAME] will outrun almost everyone.",
    "animalDescription": "The Rabbit is one of the fastest land animals relative to its size — capable of explosive bursts of speed, sharp directional changes, and seemingly endless physical energy. It doesn't plan its route. It doesn't need to. It simply moves — fast, instinctively, and with total commitment to whatever direction it is currently pointed in. The Rabbit is not lost. It is just never entirely sure where it is going until it gets there. This particular Rabbit is the Busy one — pure explosive energy, firing in any direction, at any moment, with no advance warning and no internal map. Not reckless. Just running on a system that was built for speed and hasn't quite got the navigation software installed yet."
  }
  "elephant": {
    "fuels": [
      "Clear, consistent rules applied the same way every time",
      "Being heard fully before any redirection or reframing",
      "Explicit social expectations delivered in advance",
      "Genuine acknowledgment of what went wrong without minimising",
      "Time and space to process before being asked to move on",
      "Adults who are consistent, transparent, and willing to explain their reasoning",
      "Being recognised as someone with genuine courage and principle"
    ],
    "title": "THE JUSTICE ELEPHANT",
    "drains": [
      "Rules that are applied inconsistently or without explanation",
      "Feeling dismissed or minimised when raising a genuine concern",
      "Social situations with unwritten or shifting rules",
      "Apologies that feel incomplete or insincere",
      "Being told to \"let it go\" before [HE/SHE/THEY] has processed it",
      "Environments where power is used arbitrarily",
      "Feeling like [HIS/HER/THEIR] moral compass is a problem"
    ],
    "doNotSay": [
      {
        "tryThis": "\"You're right that it wasn't fair. That's genuinely hard.\"",
        "insteadOf": "\"Life isn't fair. Get over it.\""
      },
      {
        "tryThis": "\"I can see this really matters to you. Tell me what happened.\"",
        "insteadOf": "\"You're always arguing about something.\""
      },
      {
        "tryThis": "\"I know this feels big. Let's sit with it for a minute.\"",
        "insteadOf": "\"Why do you have to make everything such a big deal?\""
      },
      {
        "tryThis": "\"I know it's hard to put down. Take the time you need.\"",
        "insteadOf": "\"Just let it go.\""
      },
      {
        "tryThis": "\"Your feelings about this make complete sense. Let's talk it through.\"",
        "insteadOf": "\"You're being too sensitive.\""
      }
    ],
    "dayInLife": {
      "morning": "The morning can derail quickly for [NAME] if something feels wrong before it has even properly begun. A perceived unfairness — a sibling who got more of something, a rule that was applied differently yesterday, a promise from last night that hasn't been honoured — lands immediately and fully on [NAME]'s emotional radar. [HE/SHE/THEY] will not be able to move past it until it has been acknowledged. Not necessarily resolved — acknowledged. [NAME] does not always need the wrong to be fixed. [HE/SHE/THEY] needs to know that you know it happened and that it matters. That acknowledgment, delivered early and genuinely, can prevent an entire morning from unravelling. What helps: a brief, calm sentence like \"I hear you. That wasn't fair, and it matters. We'll come back to it after school.\" This gives [NAME] the acknowledgment [HE/SHE/THEY] needs without opening a full discussion when time is short.",
      "school": "The classroom is a daily source of both connection and conflict for [NAME]. [HE/SHE/THEY] is acutely aware of how rules are applied — and when they are applied inconsistently, [NAME] will say so. When a classmate is treated unfairly, [NAME] will respond — sometimes helpfully, sometimes in ways that create new problems. [HE/SHE/THEY] finds it hard to let small unfairnesses pass, to understand that rules sometimes have exceptions, and to navigate the grey areas of social interaction that don't conform to clear principles. [NAME] operates in black and white in a world that is almost entirely grey — and the friction that creates is daily and genuine. What helps: if your school is receptive, ask for a pre-agreed signal between [NAME] and the teacher — a quiet hand gesture or a note card — that means \"I've noticed something unfair and I need to talk about it later.\" This gives [NAME] a legitimate channel without disrupting the class.",
      "afterSchool": "[NAME] arrives home carrying the day's injustices with full emotional intensity. The thing the teacher said that wasn't fair. The game at lunch that was rigged. The friend who broke an agreement. Each of these is as present and as heavy as it was when it happened — and [NAME] needs to put them down before [HE/SHE/THEY] can engage with anything else. This is not venting for the sake of it. This is [NAME]'s emotional processing system doing the work it needs to do to move forward. The most helpful response is to listen fully, validate genuinely, and resist the urge to minimise or reframe until [NAME] has finished. A practical approach: give [NAME] 15 minutes of your undivided listening when [HE/SHE/THEY] gets home. No advice, no corrections — just \"Tell me.\" Once [HE/SHE/THEY] has been heard, the emotional load lightens and homework or other demands become possible.",
      "bedtime": "[NAME] replays the day at bedtime with extraordinary detail and emotional fidelity. The injustice from this morning is still present. The unresolved social situation from lunch is still unresolved. [NAME]'s brain does not release the day's emotional content easily — it holds it, processes it, returns to it. A short, calm bedtime conversation that allows [NAME] to voice what is still sitting with [HIM/HER/THEM] — without agenda, without problem-solving, just listening — is one of the most powerful investments you can make in [HIS/HER/THEIR] long-term emotional regulation. A sample structure: five minutes of \"What's still on your mind?\" followed by a grounding ritual (reading together, a calming breathing exercise, or quiet music). This gives [NAME]'s brain permission to set things down for the night."
    },
    "overwhelm": "[NAME]'s overwhelm is almost always triggered by a perceived injustice — real or misread — and it arrives with the full force of every similar experience [HE/SHE/THEY] has ever had stored in that extraordinary emotional memory. What looks like a strong reaction to a small event is often the accumulated weight of many similar events landing simultaneously. [NAME] is not just reacting to what happened today. [HE/SHE/THEY] is reacting to today plus every time this has happened before, carried forward with full emotional intensity.\nIn these moments [NAME] needs one thing above all else before anything else is possible — to be heard. Not agreed with. Not validated in every detail. Simply heard. An adult who listens fully, acknowledges genuinely, and resists the urge to immediately correct, reframe, or minimise will find that [NAME]'s overwhelm de-escalates faster than almost any other intervention. The argument, the explanation, the teaching moment — all of these are available and valuable, but only after [NAME] has felt genuinely heard. Before that moment, no amount of reasoning will reach [HIM/HER/THEM]. After it, [NAME] is often surprisingly open, reflective, and willing to consider other perspectives.\nIf this pattern is happening frequently, it can help to build a \"fairness journal\" with [NAME] — a notebook where [HE/SHE/THEY] writes or draws what felt unfair that day. This gives the emotional memory somewhere to land other than bedtime, and over time helps [NAME] see patterns and develop [HIS/HER/THEIR] own perspective on which injustices need action and which can be set down.",
    "aboutChild": "[NAME] is the child who will never let an injustice pass without comment. Not because [HE/SHE/THEY] is looking for trouble, not because [HE/SHE/THEY] enjoys conflict, but because [HIS/HER/THEIR] brain is wired to notice unfairness with a precision and intensity that most people simply don't experience. When something is wrong — when the rules are applied inconsistently, when someone is treated badly, when a promise is broken, when the outcome doesn't match what was agreed — [NAME] feels it as a physical reality. Not as mild irritation. As something that must be addressed, right now, regardless of the social cost of addressing it.\n[NAME] also carries things. A wrong done three weeks ago is as present to [HIM/HER/THEM] today as it was when it happened. An apology that felt incomplete is still incomplete. A friendship that ended badly is still being processed long after everyone else has moved on. [NAME]'s emotional memory is extraordinarily long and extraordinarily vivid — and the feelings stored in that memory do not fade with time the way they do for most people. This is not stubbornness or holding a grudge. It is the way [NAME]'s emotional and social brain stores and retrieves experience — completely, vividly, and with full emotional intensity intact.",
    "archetypeId": "elephant",
    "closingLine": "[NAME] is a Justice Elephant. And the world needs more of them.",
    "affirmations": [
      "\"I hear you. That does sound unfair.\"",
      "\"Your sense of right and wrong is one of the things I admire most about you.\"",
      "\"You don't have to agree with everything. But let's find a way through it together.\"",
      "\"I know you're still carrying that. We can talk about it for as long as you need.\"",
      "\"The world needs people who notice what you notice. Don't ever stop noticing.\""
    ],
    "brainSections": [
      {
        "title": "Emotional Regulation",
        "content": "[NAME]'s brain processes emotionally significant events — particularly events involving fairness, loyalty, and social trust — with a significantly higher intensity than most children [HIS/HER/THEIR] age. The emotional response to perceived injustice is not chosen or performed. It arrives automatically, fully formed, and at a volume that bypasses [NAME]'s ability to moderate it before it is already expressed. Research on emotional dysregulation in ADHD consistently shows that the gap between emotional trigger and emotional response is significantly narrower in children with this profile — meaning [NAME] is reacting before the moderating brain systems have had time to engage. The passion is neurological. The intensity is real. And it deserves to be met with understanding rather than dismissal."
      },
      {
        "title": "Social Awareness",
        "content": "[NAME]'s social awareness is in some ways extraordinarily high. [HE/SHE/THEY] notices social dynamics, power imbalances, inconsistencies in how rules are applied, and subtle unfairnesses that most children walk straight past. The challenge is not that [NAME] lacks social awareness — it is that [HIS/HER/THEIR] social processing is focused on a specific dimension of social experience: fairness, consistency, and adherence to agreed rules. This makes [NAME] a fierce and reliable ally and a formidable advocate in any situation where the rules are being bent — and makes navigating the genuinely messy, inconsistent, unwritten social landscape of childhood genuinely difficult."
      }
    ],
    "innerVoiceQuote": "It's not that I'm being difficult. It's that this is genuinely not fair.",
    "hiddenSuperpower": "The qualities that make [NAME] so intense in moments of conflict are the same qualities that will make [HIM/HER/THEM] an extraordinary force for good in the world. [NAME] will not stay quiet when someone is being treated unfairly — not as a child, and not as an adult. [HE/SHE/THEY] will be the person who speaks up in the meeting, who stands beside the person being left out, who refuses to let a wrong go unacknowledged simply because addressing it is socially uncomfortable. The world needs people who feel injustice this acutely and respond to it this consistently. [NAME] is one of those people — already, at [HIS/HER/THEIR] age, operating with a moral clarity and a social courage that most adults spend their entire lives working toward.",
    "animalDescription": "The Elephant never forgets. This is not a myth — it is one of the most well-documented features of elephant cognition, and it shapes everything about how the Elephant moves through the world. It remembers every kindness and every wrong. It remembers the path taken years ago and the face of someone it hasn't seen in a decade. It carries its history with it completely — every experience, every interaction, every moment of connection stored with extraordinary fidelity. The Elephant also lives in community more deeply than almost any other animal — its social bonds are fierce, its loyalty absolute, its grief when those bonds are broken genuinely profound. This particular Elephant is the Justice one — the one for whom fairness is not a preference but a principle, and for whom the world's failure to operate according to that principle is not an inconvenience but a genuine, daily source of pain."
  },
  "dolphin": {
    "fuels": [
      "A specific, legitimate time when talking will be welcomed",
      "Explicit social coaching delivered privately and without shame",
      "Gentle, specific feedback about what to try differently next time",
      "Regular, structured opportunities for genuine social connection",
      "Concrete, practised social skills — turn-taking, waiting, reading cues",
      "Help understanding what happened and what [HE/SHE/THEY] can learn from it",
      "An adult who celebrates [HIS/HER/THEIR] warmth while building [HIS/HER/THEIR] regulation"
    ],
    "title": "THE SPLASHY DOLPHIN",
    "drains": [
      "Being told to stop talking without being given an alternative",
      "Social situations where the rules of engagement are unclear",
      "Feeling rejected or excluded after a social misstep",
      "Environments that require prolonged silence or social withdrawal",
      "Being told [HE/SHE/THEY] is \"too much\" without being told what to do differently",
      "Friendships that end without explanation",
      "Feeling like [HIS/HER/THEIR] social energy is a problem"
    ],
    "doNotSay": [
      {
        "tryThis": "\"Let's practise waiting. I'll show you what to look for.\"",
        "insteadOf": "\"Stop interrupting — let people talk.\""
      },
      {
        "tryThis": "\"Your energy is real and it's wonderful. Let's find it the right place to go.\"",
        "insteadOf": "\"Why can't you just be calm?\""
      },
      {
        "tryThis": "\"Let's find the right moment for this. I want to hear it then.\"",
        "insteadOf": "\"Nobody wants to hear you all the time.\""
      },
      {
        "tryThis": "\"I know you love connecting. Let's make sure others get a turn too.\"",
        "insteadOf": "\"You always have to be the centre of attention.\""
      },
      {
        "tryThis": "\"That one was hard. Let's talk about what happened and what to try next time.\"",
        "insteadOf": "\"You pushed them away again.\""
      }
    ],
    "dayInLife": {
      "morning": "[NAME] wakes up ready to connect. Before breakfast is finished [HE/SHE/THEY] has already told you three things, asked four questions, interrupted a conversation twice, and begun a story that is still unfinished when it is time to leave for school. None of this is designed to be disruptive. [NAME]'s brain woke up full — full of thoughts, full of energy, full of things that need to be shared — and the morning is the first available outlet. The challenge is that the morning also has a schedule, and [NAME]'s social momentum and the morning's practical demands are almost always in direct conflict. What helps: give [NAME] a specific \"talk time\" during breakfast (\"Tell me your best thing while we eat\") and then a clear transition signal (\"Now it's get-ready time. We'll talk more in the car\"). This channels the social energy rather than fighting it.",
      "school": "The classroom is where [NAME]'s social profile creates the most consistent difficulty. [HE/SHE/THEY] calls out answers before being asked. [HE/SHE/THEY] interrupts the teacher mid-sentence — not defiantly, but because the thought arrived and the thought felt urgent. [HE/SHE/THEY] turns to talk to a classmate at precisely the moment the classmate is trying to focus. In group work [HE/SHE/THEY] leads with energy — not to exclude others, but because [HIS/HER/THEIR] ideas are coming faster than the group can receive them. Teachers see disruption. [NAME] sees connection. The mismatch between these two realities is one of the most painful features of [NAME]'s school experience. What helps: a \"thought parking lot\" — a small notebook where [NAME] jots ideas to share later instead of blurting them. This honours the thought without disrupting the class.\nSocially, [NAME] often finds that [HIS/HER/THEIR] peer relationships are warm but uneven. [HE/SHE/THEY] is liked — [HIS/HER/THEIR] energy and enthusiasm are genuinely appealing — but [HE/SHE/THEY] can also be found tiring by children who need a slower, quieter pace. [NAME] may cycle through friendships more quickly than most, not because [HE/SHE/THEY] is unkind but because the sustained regulation required to maintain reciprocal friendships over time is one of [HIS/HER/THEIR] most significant challenges. What helps: coach [NAME] on one specific social skill at a time. This week's skill might be \"ask one question, then wait for the full answer.\" Practise it at home, role-play it, celebrate when it happens. Small, specific, repeated.",
      "afterSchool": "[NAME] arrives home at full social volume — the containment of the school day releasing immediately. [HE/SHE/THEY] needs to debrief, to tell you everything, to process the day through conversation at high speed. This is genuine need, not performance — [NAME]'s brain processes experience through social sharing in a way that is neurologically real and important. Where possible, give [HIM/HER/THEM] this time before anything else is asked. The debrief is not a distraction from the afternoon. It is [NAME] doing the emotional and cognitive work of landing from the school day — and it will make everything that follows significantly more manageable.",
      "bedtime": "Getting [NAME] to wind down at bedtime is one of the most reliably challenging parts of the day. [HIS/HER/THEIR] brain is still generating — still connecting, still processing, still finding things that need to be said. A structured wind-down that gradually reduces social stimulation — moving from conversation to reading to quiet — works better than an abrupt transition to silence, which [NAME]'s brain will resist. A brief, contained final conversation — two minutes, then lights out, no extensions — gives [NAME]'s social brain the closing it needs without opening the door to another hour of talking. What helps: set a timer for the final conversation. When it ends, say \"Save the rest for tomorrow morning. I want to hear it then.\" This gives [NAME] permission to stop without feeling unheard."
    },
    "overwhelm": "[NAME]'s overwhelm is social at its core — it arrives when connection goes wrong, when [HE/SHE/THEY] has been rejected, excluded, or told one too many times that [HE/SHE/THEY] is too much. The response is rarely quiet. [NAME]'s distress, like [HIS/HER/THEIR] joy, is expressed externally — in tears, in escalating bids for connection, in increased volume and increased urgency that can look like deliberate disruption but is actually a nervous system in genuine pain.\nWhat [NAME] needs in these moments is connection — not distance. The instinct to withdraw [HIM/HER/THEM] from social situations when [HIS/HER/THEIR] behaviour escalates can make things significantly worse, because removal from connection is the very thing [NAME]'s nervous system experiences as most threatening. A calm, close, regulated adult who offers genuine presence — not to talk, not to problem-solve, just to be there — will de-escalate [NAME] faster than almost any other intervention. Once [HIS/HER/THEIR] nervous system has felt genuinely received, [NAME] will come back to baseline with remarkable speed. The need for connection that drives the overwhelm is the same need that, when met, resolves it.\nIf social rejection is a recurring trigger, it helps to build a \"social replay\" routine with [NAME]. After a difficult interaction, walk through it together: \"What happened? What did you want to happen? What could you try next time?\" This builds the self-monitoring skills [NAME]'s brain is still developing, without shame.",
    "aboutChild": "[NAME] is one of the most socially motivated children you will ever meet. [HE/SHE/THEY] genuinely, deeply, fundamentally needs other people — not as a preference but as a neurological requirement. Connection is not something [NAME] enjoys. It is something [NAME] runs on. The energy, the ideas, the joy that [HE/SHE/THEY] brings to every social interaction is entirely real — and it is also entirely unregulated. [NAME] interrupts not because [HE/SHE/THEY] doesn't care about the person speaking, but because the thought that just arrived feels so urgent, so alive, so certain to vanish if not spoken immediately, that waiting feels genuinely neurologically impossible. The interruption is not rudeness. It is the urgency of a brain that knows its ideas are fleeting and has learned, through experience, that the only way to keep them is to say them right now.\nThis creates a painful paradox at the heart of [NAME]'s social life. The thing [NAME] wants most — genuine, sustained connection with peers — is made harder by the very quality that drives [HIS/HER/THEIR] desire for it. [HE/SHE/THEY] comes on with full energy, full warmth, full enthusiasm. [HE/SHE/THEY] can dominate conversations without meaning to. [HE/SHE/THEY] misses the moment when the other person has had enough — not because [HE/SHE/THEY] doesn't care, but because [HIS/HER/THEIR] social accelerator is fully engaged and [HIS/HER/THEIR] brakes are still developing. The child who wants connection more than almost anything is the child who sometimes accidentally overwhelms it. And [NAME] feels that gap every single time.",
    "archetypeId": "dolphin",
    "closingLine": "[NAME] is a Splashy Dolphin. And the world needs more of them.",
    "affirmations": [
      "\"I love how much you love people. That is one of your greatest gifts.\"",
      "\"The right friends are out there. We'll find them together.\"",
      "\"You're not too much. You just need people who can keep up.\"",
      "\"I know it hurt when that didn't go the way you wanted. That makes complete sense.\"",
      "\"You're learning. Every time is practice. You're getting better.\""
    ],
    "brainSections": [
      {
        "title": "Hyperactivity",
        "content": "For [NAME], hyperactivity runs through [HIS/HER/THEIR] social and verbal world. The thoughts come fast, the words come faster, and the gap between thinking and speaking is almost nonexistent. This is not impulsivity as a character trait. It is the neurological reality of a brain whose inhibitory systems — the systems that create the pause between thought and action, between impulse and expression — are still developing relative to [HIS/HER/THEIR] age. [NAME] is not choosing not to wait. The neurological infrastructure for waiting is not yet fully in place."
      },
      {
        "title": "Social Awareness",
        "content": "[NAME]'s social desire is extraordinarily high. [HIS/HER/THEIR] social intelligence — [HIS/HER/THEIR] ability to read emotions, to care genuinely about others, to form deep bonds — is also genuinely high. The gap is specifically in the area of social timing and social regulation — knowing when to speak, when to wait, when the other person has had enough, when the energy in the room has shifted. These are skills that require the brain's inhibitory and self-monitoring systems to work in real time during social interaction — and these are precisely the systems most affected in [NAME]'s profile. [NAME] wants to get it right. [HIS/HER/THEIR] brain just isn't yet giving [HIM/HER/THEM] the information [HE/SHE/THEY] needs to do so consistently."
      }
    ],
    "innerVoiceQuote": "I had to say it right then. It was going to disappear.",
    "hiddenSuperpower": "The social energy that makes [NAME]'s relationships so complex is the same energy that makes [HIM/HER/THEM] one of the most genuinely warm, enthusiastic, and life-giving people in any room. [NAME] makes people feel seen, wanted, and exciting — because to [NAME], they genuinely are. [HIS/HER/THEIR] enthusiasm is not performance. [HIS/HER/THEIR] interest is not strategic. When [NAME] is excited about you, about your idea, about what you just said — that excitement is completely real and completely infectious. The right friends — the ones who can match [HIS/HER/THEIR] energy, who find [HIS/HER/THEIR] pace exhilarating rather than tiring — will love [NAME] with an intensity that most people never experience. Those friendships exist. [NAME] just needs support finding them and keeping them.",
    "animalDescription": "The Dolphin is one of the most socially sophisticated creatures on earth. It lives in pods, communicates constantly, plays with genuine joy, and forms bonds that last a lifetime. It does not choose solitude. It does not function well without connection. The social world is not something the Dolphin navigates — it is something the Dolphin is made of, at every level, all the way down. And it moves through that social world at extraordinary speed — splashing, diving, circling, always in motion, always communicating, always already on to the next thing before the last thing has fully landed. This particular Dolphin is the Splashy one — the one whose energy lands with a splash every time, who is already talking before [HE/SHE/THEY] has decided to speak, already in the middle of the connection before [HE/SHE/THEY] has checked whether the other person is ready to receive it."
  }
  "hedgehog": {
    "archetypeId": "hedgehog",
    "title": "THE STORM HEDGEHOG",
    "innerVoiceQuote": "That sound actually hurts me. I'm not being dramatic.",
    "animalDescription": "The Hedgehog is one of nature's most misunderstood creatures. From the outside it appears prickly, defensive, difficult to get close to. But underneath those spines is one of the softest, most gentle animals you will ever encounter. The spines are not aggression. They are protection — a nervous system's response to a world that arrives too fast, too loud, and too sharp. When the Hedgehog feels safe — truly safe — it uncurls, shows its belly, and is warm, curious, and remarkably trusting. This particular Hedgehog is the Storm one — the one whose sensory world and emotional world amplify each other, creating an inner weather system that can shift from calm to storm with very little warning. The spines go up not because [HE/SHE/THEY] wants them to, but because the world just got too loud, too bright, too rough, or too unfair — and the only safe response [HIS/HER/THEIR] nervous system knows is to curl inward and protect what is soft underneath.",
    "aboutChild": "[NAME] is the child who flinches at a hand dryer, who refuses to wear the school jumper because the label feels like sandpaper, who melts down in a crowded supermarket not because [HE/SHE/THEY] is being difficult but because every sound, every light, every unexpected touch is arriving at a volume the rest of us simply cannot hear. [NAME]'s sensory system is turned up higher than most people's. What registers as background noise for other children registers as genuine physical discomfort for [NAME]. A scratchy tag is not an inconvenience. It is a persistent, unavoidable source of pain. A sudden loud noise is not startling. It is physically distressing. The world, for [NAME], is simply louder, brighter, rougher, and more overwhelming than it is for most people — and [HE/SHE/THEY] has been navigating that gap for [HIS/HER/THEIR] entire life.\nWhat makes [NAME]'s experience particularly intense is that the sensory overload does not stay in the body. It travels directly to the emotional system. When [NAME]'s senses are overwhelmed, the emotional response is immediate, intense, and often looks completely out of proportion to whatever triggered it. A noisy classroom doesn't just make [NAME] uncomfortable — it makes [HIM/HER/THEM] irritable, tearful, or explosive, in ways that look like moodiness or defiance but are actually the emotional overflow of a sensory system that has been pushed past its limit. This is not a choice. It is not a behaviour problem. It is the way [NAME]'s nervous system processes a world that was not designed for the sensitivity [HE/SHE/THEY] was born with.",
    "hiddenSuperpower": "The same sensitivity that makes the world so overwhelming for [NAME] is also the source of [HIS/HER/THEIR] most extraordinary qualities. [NAME] notices things other children walk straight past — the shift in a friend's mood, the beauty of light through a window, the wrong note in a piece of music, the subtle unfairness in a conversation. [HIS/HER/THEIR] emotional depth is genuine and remarkable. In a calm, safe environment [NAME] is one of the warmest, funniest, most deeply loyal children you will ever meet. [HE/SHE/THEY] feels things fully — joy as much as pain, connection as much as overwhelm. The empathy that comes from living in a world turned up to full volume is real, and it is rare. [NAME] doesn't need to be toughened up. [HE/SHE/THEY] needs a world that makes enough room for the depth of feeling [HE/SHE/THEY] was born with. Many of the most gifted artists, musicians, writers, and caregivers share exactly this profile. [NAME]'s sensitivity is not a flaw to be managed. It is a capacity to be supported.",
    "brainSections": [
      {
        "title": "Sensory Processing",
        "content": "[NAME]'s brain receives sensory input — sound, touch, light, movement, texture — at a significantly higher intensity than most children [HIS/HER/THEIR] age. This is not a sensitivity that can be reasoned away or toughened out. It is neurological. The volume knob on [NAME]'s sensory system is set higher than average, and it does not have a manual override. Sounds that other children barely notice can feel physically painful. Textures that other children tolerate without thought can feel unbearable. Busy, crowded, noisy environments that other children find exciting can feel genuinely threatening to [NAME]'s nervous system. This is real. It is measurable. And it deserves to be taken as seriously as any other physical experience."
      },
      {
        "title": "Emotional Regulation",
        "content": "The second is emotional regulation — specifically the intensity and speed of [NAME]'s emotional responses. On its own, emotional intensity is already part of [NAME]'s wiring. But when it combines with sensory overload, the two systems amplify each other. A sensory trigger (a loud noise, an unexpected touch, a chaotic environment) creates physical distress. That physical distress immediately activates the emotional system. The emotional system responds with an intensity that matches the sensory pain — not the external event. So what looks to the outside world like an overreaction to a door slamming is actually [NAME]'s nervous system responding to genuine physical pain with a proportionate emotional response. The reaction makes sense once you understand what [NAME] is actually experiencing. The challenge is that the rest of the world cannot feel what [NAME] feels, so the response looks disproportionate from the outside."
      }
    ],
    "dayInLife": {
      "morning": "Getting dressed is often the first challenge of [NAME]'s day. The seam on a sock feels wrong. The waistband is too tight. The label in the shirt is scratching. These are not preferences or fussiness — they are genuine sensory experiences that feel as urgent and uncomfortable to [NAME] as a stone in your shoe feels to you, except there are several of them at once and they don't go away. When you add the time pressure of a school morning, the sensory discomfort meets emotional overload and the result can be tears, refusal, or a full shutdown before the day has even started. What helps: lay out clothes the night before, ideally ones [NAME] has already approved as comfortable. Remove all labels. Choose soft fabrics and seamless socks. If a particular item is refused on the day, trust the sensory experience and switch it — the battle is not worth the cost to [NAME]'s nervous system.",
      "school": "The school environment is one of the most sensorily demanding places [NAME] spends time. Fluorescent lights, echoing corridors, the noise of thirty children in a classroom, the chaos of the canteen, the unexpected fire drill — each of these is a significant sensory event for [NAME], and they stack up across the day. By mid-morning, [NAME]'s sensory budget may already be running low. What teachers see is a child who is increasingly irritable, withdrawn, or reactive — what is actually happening is a nervous system that has been absorbing more input than it can process. What helps: if your school is receptive, ask for noise-cancelling headphones during independent work, a quiet space [NAME] can access when overwhelmed, and a five-minute heads-up before transitions like assemblies or PE. These are not indulgences. They are the tools that allow [NAME] to access learning.",
      "afterSchool": "[NAME] arrives home having spent the entire day managing a sensory environment that was not designed for [HIS/HER/THEIR] nervous system. The spines may already be up. [HE/SHE/THEY] may be irritable, tearful, or completely shut down — not because anything bad happened, but because the accumulated sensory load of a normal school day has used up every bit of [HIS/HER/THEIR] regulatory capacity. What [NAME] needs in this moment is sensory relief — not questions about the day, not homework, not siblings being loud. What helps: create a predictable decompression routine. A quiet room, dim lighting, a favourite blanket or soft toy, maybe calm music or an audiobook. Give [NAME] 20 to 30 minutes of low-sensory time before asking anything of [HIM/HER/THEM]. This is not spoiling. This is allowing [NAME]'s nervous system to reset so that the rest of the evening is possible.",
      "bedtime": "Bedtime can be either the easiest or the hardest part of [NAME]'s day, depending on how much sensory load has accumulated. On a good day, the quiet and predictability of bedtime is exactly what [NAME]'s nervous system craves — and [HE/SHE/THEY] will settle with surprising ease. On a hard day, the emotions that were held in all day finally arrive, and bedtime becomes the moment when everything surfaces — the noise that hurt, the touch that startled, the moment that felt unfair. What helps: a consistent, low-stimulation bedtime routine that [NAME] can predict completely. Dim lighting, soft pyjamas, the same sequence every night. If emotions arrive, sit with them quietly rather than trying to fix them. A simple \"That was a hard day for your body and your feelings. You're safe now\" can be enough to help [NAME] let go and rest."
    },
    "drains": [
      "Loud, unpredictable, or chaotic environments",
      "Clothing or textures that feel physically uncomfortable",
      "Being told [HIS/HER/THEIR] sensory experience isn't real or is exaggerated",
      "Sudden changes, surprises, or transitions without warning",
      "Being asked to \"calm down\" when overwhelmed",
      "Crowded social situations with high sensory demand",
      "Feeling like [HIS/HER/THEIR] sensitivity is a problem"
    ],
    "fuels": [
      "Calm, predictable spaces with controlled sensory input",
      "Soft, familiar fabrics and the freedom to choose what feels right",
      "Adults who take [HIS/HER/THEIR] sensory needs seriously without question",
      "Advance notice of what is coming and time to prepare",
      "A safe, quiet space to decompress without demands",
      "One-on-one time or small groups in quiet settings",
      "Being valued for [HIS/HER/THEIR] depth, empathy, and perception"
    ],
    "overwhelm": "[NAME]'s overwhelm typically follows a recognisable pattern: sensory input builds, the emotional system activates, and the spines go up. What this looks like from the outside varies — it might be tears, anger, withdrawal, refusal, or a combination of all four in quick succession. What is happening on the inside is always the same: [NAME]'s nervous system has received more input than it can process, and the emotional response to that overload is arriving at full intensity.\nIn these moments, the single most important thing is to reduce sensory input immediately. Turn off the lights or move to a quieter space. Lower your voice. Stop talking if possible — words are additional sensory input. Offer physical comfort only if [NAME] wants it (some children in sensory overload cannot tolerate touch; others crave deep pressure like a tight hug). Do not ask [NAME] to explain what is wrong. [HIS/HER/THEIR] brain does not have the capacity to narrate the experience while it is still happening. Wait. Stay close. Be calm. The storm will pass.\nAfter the overwhelm has passed, a brief, gentle conversation can help: \"That was a lot for your body. What was the hardest part?\" Over time, this builds [NAME]'s ability to identify [HIS/HER/THEIR] own triggers — which is the foundation for eventually managing them independently. If overwhelm is happening daily, it is worth auditing [NAME]'s environment for specific sensory triggers you can reduce or remove. Keep a simple log for a week: what happened before the overwhelm? What sensory input was present? Patterns will emerge, and those patterns are your roadmap.",
    "affirmations": [
      "\"I believe you. If it hurts, it hurts.\"",
      "\"Your sensitivity is one of the things that makes you extraordinary.\"",
      "\"We'll find things that feel right for your body. We don't have to force it.\"",
      "\"It's okay to need a quiet space. That's not weakness. That's self-care.\"",
      "\"The world is louder for you than it is for most people. That's real, and I see it.\""
    ],
    "doNotSay": [
      { "insteadOf": "It's just a noise. You're overreacting.", "tryThis": "That was really loud for you. Let's move somewhere quieter." },
      { "insteadOf": "Every other child wears the uniform. Just put it on.", "tryThis": "Let's find a way to make it comfortable. What part feels worst?" },
      { "insteadOf": "You need to toughen up.", "tryThis": "Your sensitivity picks up things other people miss. That's a real strength." },
      { "insteadOf": "Stop being so moody.", "tryThis": "Something is bothering your body or your feelings. Can you help me understand what?" },
      { "insteadOf": "It's not a big deal.", "tryThis": "It feels like a big deal to you, and that matters." }
    ],
    "closingLine": "[NAME] is a Storm Hedgehog. And the world needs more of them."
  },
  "bull": {
    "archetypeId": "bull",
    "title": "THE FEARLESS BULL",
    "innerVoiceQuote": "I didn't think — I just went. I always just go.",
    "animalDescription": "The Bull is one of the most powerful animals on earth — built for action, built for force, built to charge. It does not pause at the edge of the field to consider its options. It does not weigh the consequences of moving forward. It sees something that needs a response and it responds — immediately, completely, and with every ounce of energy it has. The Bull is not reckless in its own mind. It is simply doing what its body and its instincts were designed to do: act. This particular Bull is the Fearless one — the one who is already moving before the thought has finished forming, already in the middle of the action before anyone else has decided whether the action is a good idea. Not careless. Not looking for trouble. Just wired to go, and wired to go now, with a body and an emotional system that follow through before the logical brain has had time to weigh in.",
    "aboutChild": "[NAME] is the child who jumps before looking, speaks before thinking, and is halfway across the room before you have finished saying \"don't.\" This is not defiance. It is not a lack of respect. It is the neurological reality of a brain where the gap between impulse and action is extraordinarily narrow — so narrow that by the time the thought \"maybe I shouldn't\" arrives, the body has already committed. [NAME] is genuinely surprised, every time, by the consequences of [HIS/HER/THEIR] actions. Not because [HE/SHE/THEY] doesn't understand consequences in theory. But because consequences feel abstract and distant to [NAME]'s brain until they are actually happening. The future, for [NAME], is not real enough to compete with the present moment. And the present moment is very, very loud.\nThis means accidents are frequent and genuinely unintended. The broken glass, the scraped knee, the knocked-over sibling, the blurted comment that hurt someone's feelings — none of these were planned. [NAME] did not decide to be careless. [HIS/HER/THEIR] brain simply moved faster than [HIS/HER/THEIR] ability to anticipate what would happen next. The remorse afterward is real. The confusion about how it happened is real. And the cycle of act-consequence-regret-repeat is one of the most exhausting features of [NAME]'s daily life, for [NAME] and for the adults around [HIM/HER/THEM]. What [NAME] needs is not more warnings. [HE/SHE/THEY] needs external structures that slow the gap between impulse and action — and adults who understand that the impulse is neurological, not a character flaw.",
    "hiddenSuperpower": "The same impulsivity that creates so much difficulty in structured environments is also one of [NAME]'s most extraordinary qualities. [NAME] is genuinely brave. Not performatively brave — genuinely, instinctively, physically brave in a way that most children are not. [HE/SHE/THEY] will try the thing no one else will try. [HE/SHE/THEY] will go first. [HE/SHE/THEY] will say the honest thing in a room full of people dancing around it. [HE/SHE/THEY] will throw [HIMSELF/HERSELF/THEMSELVES] into a new experience with total commitment and zero hesitation. This is not recklessness — it is courage that has not yet learned its own boundaries. In the right environment, with the right support, [NAME]'s fearlessness becomes leadership. [HIS/HER/THEIR] directness becomes integrity. [HIS/HER/THEIR] bias toward action becomes the ability to get things done when everyone else is still deliberating. The world does not have enough people willing to move first. [NAME] was born to be one of them.",
    "brainSections": [
      {
        "title": "Hyperactivity and Impulsivity",
        "content": "[NAME]'s brain operates with a significantly reduced gap between impulse and action. In most children, there is a brief neurological pause between \"I want to do this\" and actually doing it — a fraction of a second where the brain checks the idea against likely outcomes. In [NAME]'s brain, that pause is either very short or effectively absent. The impulse arrives and the body follows, often simultaneously. This is not a choice. It is the way [NAME]'s inhibitory system is wired. Research on ADHD consistently shows that the brain's braking system — the prefrontal cortex's ability to interrupt an impulse before it becomes an action — develops on a different timeline in children with this profile. [NAME] is not choosing to act without thinking. [NAME]'s brain is acting before the thinking part has been consulted."
      },
      {
        "title": "Emotional Regulation",
        "content": "The second is emotional regulation — specifically the way emotions amplify impulses. When [NAME] is excited, the excitement fuels the impulsivity: the idea feels so good, so urgent, so alive that waiting becomes neurologically impossible. When [NAME] is frustrated, the frustration bypasses reasoning entirely and goes straight to action — a thrown object, a shoved sibling, a door slammed with full force. When [NAME] is joyful, the joy is expressed physically, loudly, and with total abandon. In every case, the emotional system is adding fuel to an engine that already has no brakes. The behaviour is not the problem. The behaviour is the symptom of two neurological systems — impulsivity and emotional intensity — working together without sufficient moderation. Understanding this changes everything about how you respond."
      }
    ],
    "dayInLife": {
      "morning": "[NAME] wakes up ready to move. Within minutes of being awake [HE/SHE/THEY] has already done something at full speed — jumped off the bed, run into a sibling's room, knocked something over on the way to the kitchen. None of this is intentional disruption. [NAME]'s body is simply online before [HIS/HER/THEIR] executive brain is, and the morning is a series of impulses acted on before anyone — including [NAME] — has had time to think. Breakfast may involve a spill, a blurted statement, or a conflict with a sibling that escalated from zero to ten in under a second. What helps: reduce the number of decisions and physical obstacles in the morning. A clear, short routine (eat, dress, bag, door) with one step at a time keeps the impulses channelled. If [NAME] has physical energy to burn, a brief burst of intense movement before leaving the house (star jumps, running up and down the hallway, skipping) can take the edge off. Channel the energy rather than trying to contain it.",
      "school": "The classroom asks [NAME] to do the thing [HIS/HER/THEIR] brain finds hardest: wait. Wait to be called on. Wait for instructions to finish. Wait for [HIS/HER/THEIR] turn. Wait before starting. Every one of these waiting moments is a direct demand on the braking system that is [NAME]'s greatest area of neurological difference. [HE/SHE/THEY] will call out answers, leave [HIS/HER/THEIR] seat, touch things without permission, and start activities before the instructions are finished — not to be disruptive, but because the impulse to act is genuinely stronger than the ability to wait. What helps: if your school is receptive, ask for movement breaks built into the day, a fidget tool at [NAME]'s desk, and a private signal between [NAME] and the teacher that means \"pause and check in with me before you act.\" Seating near the teacher also helps — proximity provides the external braking that [NAME]'s internal system is still building.",
      "afterSchool": "[NAME] has spent the entire school day suppressing impulses, and when [HE/SHE/THEY] arrives home, the containment ends. The energy and the impulsivity that were held in all day release at once. This might look like running through the house, roughhousing with siblings, or an immediate emotional reaction to something minor. This is not [NAME] choosing to be difficult at home. This is a nervous system that has been holding itself together all day and has finally reached a safe space to let go. What helps: provide a physical outlet immediately. Before homework, before questions about the day, before any demands. Twenty minutes of vigorous, unstructured physical activity (trampoline, bike ride, ball games, running) gives [NAME]'s body what it has been needing all day. After the physical release, [NAME] will be significantly more regulated and capable of sitting down for calmer activities.",
      "bedtime": "Bedtime requires [NAME] to do something [HIS/HER/THEIR] brain finds deeply unnatural: transition from high energy to stillness. The impulse to keep going — one more game, one more story, one more thing — is genuine, not strategic. [NAME]'s brain does not have a natural wind-down sequence in the way that many children's brains do. What helps: a physical wind-down 30 minutes before bed (stretching, yoga, a warm bath) followed by a predictable, low-stimulation routine. Keep the steps the same every night so [NAME]'s brain begins to associate the sequence with sleep. If [NAME] is still physically restless in bed, deep pressure (a weighted blanket, firm back rub, or tight tuck-in) can help the nervous system settle. A brief bedtime check-in — \"What was the best part of today? What was the hardest?\" — gives [NAME] a contained space to process without the conversation expanding into something that re-energises [HIM/HER/THEM]."
    },
    "drains": [
      "Being expected to wait without something to do",
      "Consequences delivered as punishment rather than learning",
      "Environments that require stillness and silence for long periods",
      "Being labelled as \"the naughty one\" or \"the rough one\"",
      "Multi-step instructions with no physical engagement",
      "Feeling like [HIS/HER/THEIR] energy and directness are problems",
      "Shame after an accident or impulsive moment"
    ],
    "fuels": [
      "Movement and action built into the structure of the day",
      "Adults who separate the impulse from the intention",
      "Regular, legitimate physical outlets throughout the day",
      "Being recognised for courage, honesty, and willingness to try",
      "Hands-on, active learning with clear, immediate steps",
      "An environment that values action, bravery, and honest expression",
      "An adult who says \"I know you didn't mean for that to happen. Let's fix it together.\""
    ],
    "overwhelm": "[NAME]'s overwhelm is fast, physical, and often alarming to the adults around [HIM/HER/THEM]. When the emotional and impulsive systems overload at the same time — a frustration that is too big, a consequence that feels too unfair, an excitement that has nowhere to go — the result is an explosion of physical energy that can look like aggression but is actually a nervous system discharging at full capacity. Thrown objects, physical outbursts, shouted words that [NAME] does not mean and will genuinely regret — all of these are the impulsive system operating without any braking at all, fuelled by an emotional intensity that has overwhelmed every moderating system [NAME] has.\nIn these moments, safety comes first. Remove anything dangerous from reach. Create physical space. Do not try to reason, lecture, or ask questions — [NAME]'s reasoning brain is offline. Lower your voice rather than raising it. If [NAME] will accept it, firm physical grounding (a tight hug, hands on shoulders, or sitting together on the floor) can help the nervous system find a baseline. If [NAME] does not want touch, simply stay close, stay calm, and wait. The storm will pass. It always does.\nAfter the overwhelm has passed, repair matters enormously. [NAME] almost certainly feels ashamed of what happened, even if [HE/SHE/THEY] cannot say so. A calm, connecting conversation — \"That was a big moment. Your body took over. That happens sometimes. Let's talk about what we can try next time\" — teaches [NAME] that the impulse is not who [HE/SHE/THEY] is, and that the relationship is not broken by the explosion. Over time, you can build a shared vocabulary: \"I can see the bull starting to charge. Do you want to take a break before it gets too big?\" This gives [NAME] an early-warning system and a dignified exit before the overwhelm takes over.",
    "affirmations": [
      "\"Your body moved before your brain could catch up. That's how your wiring works. It doesn't make you bad.\"",
      "\"Your courage is one of the things I love most about you.\"",
      "\"We're going to build a braking system together. It takes time and that's okay.\"",
      "\"I know you didn't mean for that to happen. Let's fix it together.\"",
      "\"You don't have to be less. You just need the right track to run on.\""
    ],
    "doNotSay": [
      { "insteadOf": "Why didn't you think before you did that?", "tryThis": "Your brain moved fast. Let's talk about what happened and what to try next time." },
      { "insteadOf": "You're always breaking things.", "tryThis": "That was an accident. Let's clean it up together." },
      { "insteadOf": "You need to learn to control yourself.", "tryThis": "Your body has a lot of energy. Let's find it somewhere safe to go." },
      { "insteadOf": "How many times do I have to tell you?", "tryThis": "Your brain needs a different kind of reminder. Let's figure out what works." },
      { "insteadOf": "You're going to seriously hurt someone one day.", "tryThis": "I want to keep everyone safe, including you. Let's build a plan for when things move too fast." }
    ],
    "closingLine": "[NAME] is a Fearless Bull. And the world needs more of them."
  }
} as Record<string, ArchetypeReportTemplate>;

export function getReportTemplate(
  archetypeId: string,
): ArchetypeReportTemplate | null {
  return REPORT_TEMPLATES[archetypeId] ?? null;
}
