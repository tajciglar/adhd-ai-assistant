import { motion } from "framer-motion";
import type { OnboardingResponses } from "../../types/onboarding";
import Button from "../ui/Button";

interface FamilySnapshotProps {
  responses: OnboardingResponses;
  onComplete: () => void;
}

const LABEL_MAP: Record<string, string> = {
  male: "Male",
  female: "Female",
  "non-binary-other": "Non-binary / Other",
  "18-30": "18 – 30",
  "31-45": "31 – 45",
  "46-60": "46 – 60",
  "61+": "61+",
  beginner: "Learning the basics",
  "some-experience": "Understands diagnosis, needs implementation help",
  advanced: "Knowledgeable, seeking new tools",
  "combined-type": "Combined Type",
  "inattentive-type": "Inattentive Type",
  "hyperactive-impulsive-type": "Hyperactive-Impulsive Type",
  "suspected-evaluation": "Suspected / Under evaluation",
  "two-parent": "Two-parent household",
  "single-parent": "Single-parent household",
  "co-parenting": "Co-parenting (separate households)",
  "multi-generational": "Multi-generational",
  iep: "IEP",
  "504-plan": "504 Plan",
  "no-formal": "No formal school accommodations",
  homeschooled: "Homeschooled",
  medication: "Medication",
  "occupational-therapy": "Occupational Therapy",
  "behavioral-therapy": "Behavioral Therapy / Counseling",
  "speech-therapy": "Speech Therapy",
  "no-interventions": "No current outside interventions",
  "morning-routines": "Morning routines",
  "homework-academics": "Homework / Academics",
  "emotional-regulation": "Emotional regulation",
  "aggression-meltdowns": "Aggression or meltdowns",
  "social-skills": "Social skills",
  "health-nutrition-sleep": "Health, nutrition & sleep",
  "multi-step-directions": "Multi-step directions",
  "losing-items": "Losing personal items",
  "time-blindness": "Time blindness",
  "task-initiation": "Task initiation",
  forgetfulness: "Forgetfulness in daily activities",
  "driven-by-motor": "Driven by a motor",
  "fidgets-excessively": "Fidgets excessively",
  "struggles-stay-seated": "Struggles to stay seated",
  "climbs-runs": "Frequently climbs or runs",
  "difficulty-playing-quietly": "Difficulty playing quietly",
  "blurts-answers": "Blurts out answers",
  "frequently-interrupts": "Frequently interrupts",
  "difficulty-waiting": "Difficulty waiting",
  "acts-without-thinking": "Acts without thinking",
  "low-frustration-tolerance": "Low frustration tolerance",
  "screen-time": "Screen time / Video games",
  "physical-activity": "Physical activity / Sports",
  "creative-arts": "Creative arts / Building",
  praise: "Praise and encouragement",
  "tangible-rewards": "Tangible rewards",
  "nothing-seems-to-work": "Nothing seems to motivate them",
  none: "None noted",
};

function label(val: string): string {
  return LABEL_MAP[val] || val;
}

function labels(arr?: string[]): string {
  if (!arr || arr.length === 0) return "None specified";
  return arr.map(label).join(", ");
}

function Section({
  title,
  children,
  index,
}: {
  title: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white rounded-2xl shadow-sm p-6 mb-4"
    >
      <h3 className="text-sm font-semibold text-harbor-accent uppercase tracking-wider mb-4">
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

function Field({ label: l, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <span className="text-harbor-text/50 text-sm">{l}</span>
      <p className="text-harbor-text font-medium">{value}</p>
    </div>
  );
}

export default function FamilySnapshot({
  responses,
  onComplete,
}: FamilySnapshotProps) {
  const childName = responses.childName || "Your child";

  return (
    <div className="min-h-screen bg-harbor-bg">
      <div className="max-w-xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-bold text-harbor-primary mb-2">
            Your Family Snapshot
          </h1>
          <p className="text-harbor-text/50 text-lg">
            Here's what we learned. This will guide everything Harbor does for
            you.
          </p>
        </motion.div>

        <Section title="About You" index={0}>
          <Field label="Gender" value={label(responses.gender ?? "")} />
          <Field label="Age range" value={label(responses.ageRange ?? "")} />
          <Field
            label="ADHD knowledge"
            value={label(responses.knowledgeLevel ?? "")}
          />
        </Section>

        <Section title={`About ${childName}`} index={1}>
          <Field label="Age" value={String(responses.childAge ?? "")} />
          <Field
            label="Diagnosis"
            value={label(responses.diagnosisStatus ?? "")}
          />
          <Field
            label="What motivates them"
            value={labels(responses.childMotivators)}
          />
        </Section>

        <Section title="Your Household" index={2}>
          <Field
            label="Structure"
            value={label(responses.householdStructure ?? "")}
          />
          <Field
            label="School support"
            value={label(responses.schoolSupport ?? "")}
          />
          <Field
            label="Current interventions"
            value={labels(responses.currentInterventions)}
          />
        </Section>

        <Section title="Current Challenges" index={3}>
          <Field
            label="Top stressors"
            value={labels(responses.stressfulAreas)}
          />
          <Field
            label="Executive functioning gaps"
            value={labels(responses.executiveFunctioningGaps)}
          />
          <Field
            label="Impulse control"
            value={labels(responses.impulseControlMarkers)}
          />
          <Field
            label="Physical activity"
            value={labels(responses.physicalActivity)}
          />
        </Section>

        {(responses.theReality || responses.theVision) && (
          <Section title="In Your Words" index={4}>
            {responses.theReality && (
              <div className="mb-4">
                <span className="text-harbor-text/50 text-sm">
                  Your current reality
                </span>
                <p className="text-harbor-text mt-1 leading-relaxed whitespace-pre-wrap">
                  {responses.theReality}
                </p>
              </div>
            )}
            {responses.theVision && (
              <div>
                <span className="text-harbor-text/50 text-sm">Your vision</span>
                <p className="text-harbor-text mt-1 leading-relaxed whitespace-pre-wrap">
                  {responses.theVision}
                </p>
              </div>
            )}
          </Section>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-10"
        >
          <p className="text-harbor-text/50 mb-6 italic">
            Thank you for trusting us with your story. We're here for you.
          </p>
          <Button onClick={onComplete}>Start using Harbor</Button>
        </motion.div>
      </div>
    </div>
  );
}
