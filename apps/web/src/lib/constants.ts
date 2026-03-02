import type { StepConfig } from "../types/onboarding";

export const TOTAL_STEPS = 16;

export const ONBOARDING_STEPS: StepConfig[] = [
  {
    step: 1,
    key: "gender",
    type: "single-select",
    title: "Let's start with you",
    subtitle: "How do you identify?",
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "non-binary-other", label: "Non-binary / Other" },
    ],
  },
  {
    step: 2,
    key: "ageRange",
    type: "single-select",
    title: "What is your age range?",
    options: [
      { value: "18-30", label: "18 – 30" },
      { value: "31-45", label: "31 – 45" },
      { value: "46-60", label: "46 – 60" },
      { value: "61+", label: "61+" },
    ],
  },
  {
    step: 3,
    key: "knowledgeLevel",
    type: "single-select",
    title: "How familiar are you with ADHD?",
    options: [
      {
        value: "beginner",
        label: "I'm a beginner — I need to learn the basics of ADHD.",
      },
      {
        value: "some-experience",
        label:
          "I understand the diagnosis but struggle with implementation.",
      },
      {
        value: "advanced",
        label:
          "I'm very knowledgeable but need new tools in the toolbox.",
      },
    ],
  },
  {
    step: 4,
    key: "childName",
    type: "text",
    title: "What is your child's name?",
    subtitle: "We'll use this to personalize your experience.",
    placeholder: "Enter their first name",
  },
  {
    step: 5,
    key: "childAge",
    type: "number",
    title: "How old is {childName}?",
    placeholder: "Age",
  },
  {
    step: 6,
    key: "diagnosisStatus",
    type: "single-select",
    title: "What is {childName}'s ADHD diagnosis status?",
    options: [
      {
        value: "combined-type",
        label: "Formally diagnosed (Combined Type)",
      },
      {
        value: "inattentive-type",
        label: "Formally diagnosed (Inattentive Type)",
      },
      {
        value: "hyperactive-impulsive-type",
        label: "Formally diagnosed (Hyperactive-Impulsive Type)",
      },
      {
        value: "suspected-evaluation",
        label: "Suspected / In the process of evaluation",
      },
    ],
  },
  {
    step: 7,
    key: "householdStructure",
    type: "single-select",
    title: "What does your household look like?",
    options: [
      { value: "two-parent", label: "Two-parent household" },
      { value: "single-parent", label: "Single-parent household" },
      {
        value: "co-parenting",
        label: "Co-parenting (separate households)",
      },
      { value: "multi-generational", label: "Multi-generational" },
    ],
  },
  {
    step: 8,
    key: "schoolSupport",
    type: "single-select",
    title: "What school support does {childName} have?",
    options: [
      { value: "iep", label: "IEP" },
      { value: "504-plan", label: "504 Plan" },
      { value: "no-formal", label: "No formal school accommodations" },
      { value: "homeschooled", label: "Homeschooled" },
    ],
  },
  {
    step: 9,
    key: "currentInterventions",
    type: "multi-select",
    title: "What interventions are currently in place?",
    subtitle: "Select all that apply.",
    options: [
      { value: "medication", label: "Medication" },
      { value: "occupational-therapy", label: "Occupational Therapy" },
      {
        value: "behavioral-therapy",
        label: "Behavioral Therapy / Counseling",
      },
      { value: "speech-therapy", label: "Speech Therapy" },
      {
        value: "no-interventions",
        label: "No current outside interventions",
      },
    ],
  },
  {
    step: 10,
    key: "stressfulAreas",
    type: "limited-select",
    title: "What areas feel most stressful right now?",
    subtitle: "Choose up to 3.",
    maxSelections: 3,
    options: [
      { value: "morning-routines", label: "Morning routines" },
      { value: "homework-academics", label: "Homework / Academic performance" },
      { value: "emotional-regulation", label: "Emotional regulation" },
      {
        value: "aggression-meltdowns",
        label: "Physical aggression or meltdowns",
      },
      { value: "social-skills", label: "Social skills" },
      {
        value: "health-nutrition-sleep",
        label: "Health, nutrition & sleep",
      },
      {
        value: "multi-step-directions",
        label: "Following multi-step directions",
      },
    ],
  },
  {
    step: 11,
    key: "executiveFunctioningGaps",
    type: "multi-select",
    title: "Do any of these executive functioning gaps apply?",
    subtitle: "Select all that apply.",
    options: [
      { value: "losing-items", label: "Losing personal items" },
      { value: "time-blindness", label: "Time blindness" },
      { value: "task-initiation", label: "Task initiation" },
      {
        value: "forgetfulness",
        label: "Forgetfulness in daily activities",
      },
    ],
  },
  {
    step: 12,
    key: "physicalActivity",
    type: "multi-select",
    title: "How would you describe {childName}'s physical activity level?",
    subtitle: "Select all that apply.",
    options: [
      { value: "driven-by-motor", label: "Driven by a motor" },
      { value: "fidgets-excessively", label: "Fidgets excessively" },
      { value: "struggles-stay-seated", label: "Struggles to stay seated" },
      { value: "climbs-runs", label: "Frequently climbs or runs" },
      {
        value: "difficulty-playing-quietly",
        label: "Difficulty playing quietly",
      },
      { value: "none", label: "None of the above" },
    ],
  },
  {
    step: 13,
    key: "impulseControlMarkers",
    type: "multi-select",
    title: "Do any of these impulse control markers apply?",
    subtitle: "Select all that apply.",
    options: [
      { value: "blurts-answers", label: "Blurts out answers" },
      { value: "frequently-interrupts", label: "Frequently interrupts" },
      { value: "difficulty-waiting", label: "Difficulty waiting" },
      { value: "acts-without-thinking", label: "Acts without thinking" },
      {
        value: "low-frustration-tolerance",
        label: "Low frustration tolerance",
      },
      { value: "none", label: "None of the above" },
    ],
  },
  {
    step: 14,
    key: "childMotivators",
    type: "multi-select",
    title: "What usually motivates {childName}?",
    subtitle: "Select all that apply.",
    options: [
      { value: "screen-time", label: "Screen time / Video games" },
      { value: "physical-activity", label: "Physical activity / Sports" },
      { value: "creative-arts", label: "Creative arts / Building" },
      { value: "praise", label: "Praise and verbal encouragement" },
      { value: "tangible-rewards", label: "Tangible rewards" },
      {
        value: "nothing-seems-to-work",
        label: "Nothing seems to motivate them",
      },
    ],
  },
  {
    step: 15,
    key: "theReality",
    type: "textarea",
    title: "What does a typical day look like for your family right now?",
    subtitle:
      "Walk us through it — from the moment your child wakes up until bedtime. What transitions feel hardest?",
    placeholder: "Take your time. There are no wrong answers here...",
  },
  {
    step: 16,
    key: "theVision",
    type: "textarea",
    title:
      "If you had a magic wand, how would you wish your typical day looked?",
    subtitle:
      "What would 'success' feel like at the end of the day?",
    placeholder: "Dream big. This is your vision...",
  },
];

export const MICRO_COPY: Record<number, string> = {
  4: "Now let's learn about your child.",
  9: "This helps us understand your family's support system.",
  11: "Transitions can be especially tough. Thank you for sharing that.",
  15: "Almost there. These last two are the most important.",
};

export const ENCOURAGEMENTS = [
  "You're doing great.",
  "This helps us support your family better.",
  "Just a few more.",
];
