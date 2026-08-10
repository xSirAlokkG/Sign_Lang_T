export type GuideCategory =
  | 'Greetings'
  | 'Common Words'
  | 'Politeness'
  | 'Emergency'
  | 'Basic Needs'
  | 'Emotions'
  | 'Sentence';

export type Difficulty = 'Starter' | 'Easy' | 'Practice';

export type GuideGesture = {
  name: string;
  display: string;
  category: GuideCategory;
  description: string;
  hand: string;
  palm: string;
  fingers: string;
  motion: string;
  type: 'Static' | 'Dynamic';
  difficulty: Difficulty;
  steps: string[];
  tips: string[];
  mistakes: string[];
  similar: string[];
  fingerCues: { label: string; state: 'extended' | 'folded' | 'together' | 'spread' | 'curled' }[];
};

export const GUIDE_GESTURES: GuideGesture[] = [
  {
    name: 'HELLO', display: 'Hello', category: 'Greetings',
    description: 'A friendly wave with an open hand.',
    hand: 'Dominant hand', palm: 'Palm faces outward.', fingers: 'Open all five fingers.',
    motion: 'Wave gently side to side two or three times.', type: 'Dynamic', difficulty: 'Starter',
    steps: ['Open your hand with fingers spread.', 'Raise your hand to shoulder height.', 'Wave side to side gently.'],
    tips: ['Keep the wave small.', 'Do not rotate the wrist too sharply.'],
    mistakes: ['Closing the hand', 'Waving too fast'],
    similar: ['GOODBYE'], fingerCues: [],
  },
  {
    name: 'GOODBYE', display: 'Goodbye', category: 'Greetings',
    description: 'A wave with fingers spread, similar to Hello.',
    hand: 'Dominant hand', palm: 'Palm faces outward.', fingers: 'Open all five fingers.',
    motion: 'Wave side to side or flick fingers outward.', type: 'Dynamic', difficulty: 'Starter',
    steps: ['Open your hand with fingers spread.', 'Raise your hand to shoulder height.', 'Wave or flick fingers outward.'],
    tips: ['Keep fingers spread clearly.', 'Make the motion distinct from Hello.'],
    mistakes: ['Closing the hand', 'Not moving the hand'],
    similar: ['HELLO'], fingerCues: [],
  },
  {
    name: 'YES', display: 'Yes', category: 'Common Words',
    description: 'A closed fist nods like a small head saying yes.',
    hand: 'Dominant hand', palm: 'Palm faces inward.', fingers: 'Make a loose fist with the thumb over fingers.',
    motion: 'Bend the fist down and up twice.', type: 'Dynamic', difficulty: 'Starter',
    steps: ['Make a loose fist.', 'Nod it down and up twice.', 'Keep the elbow relaxed.'],
    tips: ['Use a small nodding motion.'],
    mistakes: ['Shaking side to side', 'Opening the fist'],
    similar: ['NO'], fingerCues: [],
  },
  {
    name: 'NO', display: 'No', category: 'Common Words',
    description: 'Thumb and pinky extended, like saying no.',
    hand: 'Dominant hand', palm: 'Palm faces outward.', fingers: 'Thumb and pinky extend; middle three fold in.',
    motion: 'Hold the handshape still or shake gently.', type: 'Static', difficulty: 'Easy',
    steps: ['Extend your thumb out to the side.', 'Extend your pinky out the other way.', 'Fold index, middle, ring into your palm.'],
    tips: ['Keep the shape clear.', 'Do not confuse with Y.'],
    mistakes: ['Letting middle fingers stick out', 'Bending the thumb'],
    similar: ['YES'], fingerCues: [],
  },
  {
    name: 'PLEASE', display: 'Please', category: 'Politeness',
    description: 'A flat open hand circles over the chest.',
    hand: 'Dominant hand', palm: 'Palm faces your chest.', fingers: 'Keep fingers together and thumb extended.',
    motion: 'Make a small clockwise circle on your upper chest.', type: 'Dynamic', difficulty: 'Easy',
    steps: ['Place a flat hand on your chest.', 'Make a small clockwise circle.', 'Keep the motion smooth.'],
    tips: ['Use the chest, not the stomach.', 'Make one smooth circle.'],
    mistakes: ['Circling too wide', 'Using a fist instead of a flat hand'],
    similar: ['THANK_YOU'], fingerCues: [],
  },
  {
    name: 'THANK_YOU', display: 'Thank You', category: 'Politeness',
    description: 'Fingertips near the chin, moving forward and down.',
    hand: 'Dominant hand', palm: 'Palm angles toward your face, then outward.', fingers: 'Index and middle extend together; thumb alongside.',
    motion: 'Start at the chin and move forward and slightly down.', type: 'Dynamic', difficulty: 'Easy',
    steps: ['Bring fingertips to your chin.', 'Move your hand forward.', 'Finish away from your body.'],
    tips: ['Begin at the chin.', 'Finish away from the body.'],
    mistakes: ['Starting at the mouth', 'Not moving forward'],
    similar: ['PLEASE'], fingerCues: [],
  },
  {
    name: 'HELP', display: 'Help', category: 'Emergency',
    description: 'A fist resting on a flat palm, lifted upward.',
    hand: 'Dominant hand', palm: 'Bottom hand faces upward.', fingers: 'One hand is a fist; the other is flat.',
    motion: 'Lift both hands together from waist height.', type: 'Dynamic', difficulty: 'Practice',
    steps: ['Place a flat palm face up.', 'Rest a fist on the palm.', 'Lift both hands upward.'],
    tips: ['Keep both hands visible.', 'Use a clear upward movement.'],
    mistakes: ['Only using one hand', 'Not moving up'],
    similar: ['STOP'], fingerCues: [],
  },
  {
    name: 'WATER', display: 'Water', category: 'Basic Needs',
    description: 'A W handshape (three fingers) taps the chin.',
    hand: 'Dominant hand', palm: 'Palm faces outward.', fingers: 'Thumb, index, and middle extend; ring and pinky fold.',
    motion: 'Tap the chin two or three times.', type: 'Dynamic', difficulty: 'Easy',
    steps: ['Form a W with thumb, index, middle.', 'Tap your chin.', 'Repeat two or three times.'],
    tips: ['Keep the W handshape open.'],
    mistakes: ['Tapping the cheek', 'Not forming a W'],
    similar: ['EAT'], fingerCues: [],
  },
  {
    name: 'EAT', display: 'Eat', category: 'Basic Needs',
    description: 'Fingertips brought together, moving toward the mouth.',
    hand: 'Dominant hand', palm: 'Palm faces upward.', fingers: 'Index and middle extend; thumb alongside.',
    motion: 'Touch fingertips to the mouth once.', type: 'Dynamic', difficulty: 'Easy',
    steps: ['Bring fingertips together.', 'Touch them to your mouth.', 'Keep fingers together.'],
    tips: ['Move toward the mouth, not away.'],
    mistakes: ['Using a fist', 'Moving away from the mouth'],
    similar: ['WATER'], fingerCues: [],
  },
  {
    name: 'LOVE', display: 'Love', category: 'Emotions',
    description: 'Thumb, index, and pinky extended together (I-L-Y shape).',
    hand: 'Dominant hand', palm: 'Palm faces outward.', fingers: 'Thumb, index, pinky extend; middle and ring fold.',
    motion: 'Hold the handshape still.', type: 'Static', difficulty: 'Starter',
    steps: ['Extend thumb, index, pinky.', 'Fold middle and ring fingers.', 'Face your palm outward.'],
    tips: ['Do not confuse this with Y.'],
    mistakes: ['Confusing with Y', 'Letting middle finger up'],
    similar: ['HAPPY'], fingerCues: [],
  },
  {
    name: 'SAD', display: 'Sad', category: 'Emotions',
    description: 'Open hands slide down the face from eyes to cheeks.',
    hand: 'Both hands', palm: 'Palms face inward.', fingers: 'Ring and pinky extended; index and middle fold.',
    motion: 'Slide hands down from eyes to cheeks.', type: 'Dynamic', difficulty: 'Practice',
    steps: ['Place hands near your eyes.', 'Slide them down your face.', 'Keep palms facing in.'],
    tips: ['Use a slow downward motion.'],
    mistakes: ['Moving up instead of down', 'Using fists'],
    similar: ['HAPPY'], fingerCues: [],
  },
  {
    name: 'HAPPY', display: 'Happy', category: 'Emotions',
    description: 'Thumb, index, and pinky extended, like the I-L-Y handshape.',
    hand: 'Dominant hand', palm: 'Palm faces outward.', fingers: 'Thumb, index, pinky extend; middle and ring fold.',
    motion: 'Hold the handshape still.', type: 'Static', difficulty: 'Easy',
    steps: ['Extend thumb, index, pinky.', 'Fold middle and ring fingers.', 'Face your palm outward.'],
    tips: ['Keep the handshape steady.'],
    mistakes: ['Letting middle finger up', 'Confusing with LOVE'],
    similar: ['LOVE'], fingerCues: [],
  },
  {
    name: 'STOP', display: 'Stop', category: 'Common Words',
    description: 'An open hand with all fingers spread, palm facing forward.',
    hand: 'Dominant hand', palm: 'Palm faces outward.', fingers: 'All four fingers extend; thumb folds in.',
    motion: 'Hold the handshape firmly.', type: 'Static', difficulty: 'Starter',
    steps: ['Open your hand with fingers spread.', 'Fold your thumb across the palm.', 'Face your palm forward.'],
    tips: ['Keep fingers tight together.'],
    mistakes: ['Letting the thumb stick out', 'Spreading fingers too wide'],
    similar: ['HELP'], fingerCues: [],
  },
  {
    name: 'I', display: 'I', category: 'Sentence',
    description: 'Point the index finger at yourself.',
    hand: 'Dominant hand', palm: 'Palm faces inward.', fingers: 'Thumb only extends; others fold.',
    motion: 'Point toward your own chest.', type: 'Static', difficulty: 'Starter',
    steps: ['Extend your thumb.', 'Fold other fingers into your palm.', 'Point at yourself.'],
    tips: ['Point at your chest.'],
    mistakes: ['Pointing at someone else', 'Using the whole hand'],
    similar: ['YOU'], fingerCues: [],
  },
  {
    name: 'YOU', display: 'You', category: 'Sentence',
    description: 'Point the index finger toward the person.',
    hand: 'Dominant hand', palm: 'Palm faces inward.', fingers: 'Index extends; others fold with thumb over them.',
    motion: 'Point forward toward the viewer.', type: 'Static', difficulty: 'Starter',
    steps: ['Extend your index finger.', 'Fold other fingers with thumb over them.', 'Point forward.'],
    tips: ['Point toward the person.'],
    mistakes: ['Using the whole hand', 'Pointing up'],
    similar: ['I'], fingerCues: [],
  },
];

export const GUIDE_CATEGORIES: GuideCategory[] = [
  'Greetings',
  'Common Words',
  'Politeness',
  'Emergency',
  'Basic Needs',
  'Emotions',
  'Sentence',
];

export function gestureByName(name: string): GuideGesture | undefined {
  return GUIDE_GESTURES.find((g) => g.name === name);
}
