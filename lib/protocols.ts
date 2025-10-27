export interface EmergencyProtocol {
  id: string
  title: string
  category: "cardiac" | "respiratory" | "trauma" | "neurological" | "obstetric" | "environmental"
  severity: "critical" | "high" | "moderate"
  description: string
  steps: ProtocolStep[]
  videoUrl?: string
  estimatedTime: string
  requiredEquipment: string[]
  warningSignals: string[]
}

export interface ProtocolStep {
  stepNumber: number
  title: string
  instruction: string
  criticalNote?: string
  imageUrl?: string
}

export const EMERGENCY_PROTOCOLS: EmergencyProtocol[] = [
  {
    id: "cardiac-arrest",
    title: "Cardiac Arrest",
    category: "cardiac",
    severity: "critical",
    description: "Immediate response protocol for suspected cardiac arrest",
    estimatedTime: "2-3 minutes",
    requiredEquipment: ["AED", "CPR mask", "Oxygen"],
    warningSignals: ["No pulse", "Not breathing", "Unconscious", "Blue lips or face"],
    videoUrl: "/cpr-demonstration-video.jpg",
    steps: [
      {
        stepNumber: 1,
        title: "Check Responsiveness",
        instruction: 'Tap the patient\'s shoulders firmly and shout "Are you okay?" Check for breathing and pulse.',
        criticalNote: "If no response, immediately call emergency services",
      },
      {
        stepNumber: 2,
        title: "Call for Help",
        instruction: "Call emergency hotline (1669) immediately. Send someone to get an AED if available.",
        criticalNote: "Do not delay - every second counts",
      },
      {
        stepNumber: 3,
        title: "Begin CPR",
        instruction:
          "Place hands in center of chest. Push hard and fast - at least 2 inches deep, 100-120 compressions per minute.",
        criticalNote: "Continue until help arrives or patient responds",
      },
      {
        stepNumber: 4,
        title: "Use AED",
        instruction:
          "Turn on AED and follow voice prompts. Attach pads to bare chest. Do not touch patient during analysis.",
        criticalNote: "Resume CPR immediately after shock delivery",
      },
      {
        stepNumber: 5,
        title: "Continue Care",
        instruction: "Continue CPR cycles of 30 compressions and 2 rescue breaths until emergency services arrive.",
        criticalNote: "Monitor for signs of recovery",
      },
    ],
  },
  {
    id: "stroke",
    title: "Stroke (FAST Protocol)",
    category: "neurological",
    severity: "critical",
    description: "Rapid assessment and response for suspected stroke",
    estimatedTime: "3-5 minutes",
    requiredEquipment: ["Blood pressure monitor", "Glucose meter", "Oxygen"],
    warningSignals: ["Face drooping", "Arm weakness", "Speech difficulty", "Sudden confusion"],
    videoUrl: "/stroke-fast-assessment-video.jpg",
    steps: [
      {
        stepNumber: 1,
        title: "F - Face",
        instruction: "Ask patient to smile. Check if one side of face droops.",
        criticalNote: "Facial asymmetry is a key stroke indicator",
      },
      {
        stepNumber: 2,
        title: "A - Arms",
        instruction: "Ask patient to raise both arms. Check if one arm drifts downward.",
        criticalNote: "Arm weakness indicates possible stroke",
      },
      {
        stepNumber: 3,
        title: "S - Speech",
        instruction: "Ask patient to repeat a simple sentence. Check for slurred or strange speech.",
        criticalNote: "Speech problems require immediate action",
      },
      {
        stepNumber: 4,
        title: "T - Time",
        instruction: "If any signs present, note the time symptoms started and call emergency services immediately.",
        criticalNote: "Time is brain - act within minutes",
      },
      {
        stepNumber: 5,
        title: "Position Patient",
        instruction: "Keep patient calm and lying down with head slightly elevated. Do not give food or water.",
        criticalNote: "Monitor vital signs until help arrives",
      },
    ],
  },
  {
    id: "severe-bleeding",
    title: "Severe Bleeding Control",
    category: "trauma",
    severity: "critical",
    description: "Emergency protocol for controlling severe bleeding",
    estimatedTime: "2-4 minutes",
    requiredEquipment: ["Gauze pads", "Bandages", "Gloves", "Tourniquet"],
    warningSignals: [
      "Blood spurting from wound",
      "Blood soaking through bandages",
      "Loss of consciousness",
      "Pale, cold skin",
    ],
    videoUrl: "/bleeding-control-demonstration.jpg",
    steps: [
      {
        stepNumber: 1,
        title: "Ensure Safety",
        instruction: "Put on gloves. Ensure scene is safe. Call for emergency help immediately.",
        criticalNote: "Protect yourself from bloodborne pathogens",
      },
      {
        stepNumber: 2,
        title: "Apply Direct Pressure",
        instruction: "Place clean gauze or cloth directly on wound. Apply firm, continuous pressure.",
        criticalNote: "Do not remove gauze if it becomes soaked - add more on top",
      },
      {
        stepNumber: 3,
        title: "Elevate if Possible",
        instruction: "If no fracture suspected, elevate injured area above heart level while maintaining pressure.",
        criticalNote: "Continue pressure - do not peek at wound",
      },
      {
        stepNumber: 4,
        title: "Apply Pressure Bandage",
        instruction: "Once bleeding slows, secure gauze with firm bandage. Check circulation beyond bandage.",
        criticalNote: "Bandage should be snug but not cut off circulation",
      },
      {
        stepNumber: 5,
        title: "Monitor Patient",
        instruction: "Watch for signs of shock: pale skin, rapid pulse, confusion. Keep patient warm and calm.",
        criticalNote: "If bleeding continues through bandage, apply tourniquet",
      },
    ],
  },
  {
    id: "choking",
    title: "Choking (Heimlich Maneuver)",
    category: "respiratory",
    severity: "critical",
    description: "Emergency response for choking victim",
    estimatedTime: "1-2 minutes",
    requiredEquipment: ["None required"],
    warningSignals: ["Cannot speak or cough", "Clutching throat", "Blue face or lips", "Wheezing sounds"],
    videoUrl: "/heimlich-maneuver-demonstration.jpg",
    steps: [
      {
        stepNumber: 1,
        title: "Assess Situation",
        instruction: 'Ask "Are you choking?" If person cannot speak, cough, or breathe, begin Heimlich immediately.',
        criticalNote: "If person can cough forcefully, encourage coughing",
      },
      {
        stepNumber: 2,
        title: "Position Yourself",
        instruction: "Stand behind person. Wrap arms around waist. Make a fist with one hand.",
        criticalNote: "For pregnant or obese persons, position hands higher on chest",
      },
      {
        stepNumber: 3,
        title: "Perform Abdominal Thrusts",
        instruction: "Place fist above navel. Grasp fist with other hand. Give quick, upward thrusts.",
        criticalNote: "Each thrust should be separate and forceful",
      },
      {
        stepNumber: 4,
        title: "Continue Until Clear",
        instruction: "Repeat thrusts until object is expelled or person becomes unconscious.",
        criticalNote: "If unconscious, begin CPR and call emergency services",
      },
      {
        stepNumber: 5,
        title: "Seek Medical Care",
        instruction: "Even if object is expelled, person should see doctor. Heimlich can cause internal injuries.",
        criticalNote: "Monitor for breathing difficulties",
      },
    ],
  },
  {
    id: "seizure",
    title: "Seizure Management",
    category: "neurological",
    severity: "high",
    description: "Safe management of seizure episode",
    estimatedTime: "5-10 minutes",
    requiredEquipment: ["Soft padding", "Timer"],
    warningSignals: ["Uncontrolled shaking", "Loss of consciousness", "Stiffening of body", "Loss of bladder control"],
    videoUrl: "/seizure-first-aid-video.jpg",
    steps: [
      {
        stepNumber: 1,
        title: "Protect from Injury",
        instruction: "Clear area of hard or sharp objects. Place something soft under head.",
        criticalNote: "Do NOT restrain person or put anything in mouth",
      },
      {
        stepNumber: 2,
        title: "Time the Seizure",
        instruction: "Note when seizure starts. Call emergency services if seizure lasts more than 5 minutes.",
        criticalNote: "Most seizures stop within 1-2 minutes",
      },
      {
        stepNumber: 3,
        title: "Turn on Side",
        instruction: "Gently turn person on their side to keep airway clear and prevent choking.",
        criticalNote: "Stay with person until fully conscious",
      },
      {
        stepNumber: 4,
        title: "Monitor Breathing",
        instruction: "Check that person is breathing. Loosen tight clothing around neck.",
        criticalNote: "If not breathing after seizure, begin rescue breathing",
      },
      {
        stepNumber: 5,
        title: "Provide Comfort",
        instruction: "After seizure, person may be confused. Speak calmly and stay with them until fully alert.",
        criticalNote: "Do not offer food or drink until fully conscious",
      },
    ],
  },
  {
    id: "diabetic-emergency",
    title: "Diabetic Emergency",
    category: "neurological",
    severity: "high",
    description: "Response to low or high blood sugar emergency",
    estimatedTime: "3-5 minutes",
    requiredEquipment: ["Glucose meter", "Sugar source", "Glucagon kit"],
    warningSignals: ["Confusion or irritability", "Sweating and shakiness", "Rapid heartbeat", "Loss of consciousness"],
    videoUrl: "/diabetic-emergency-response.jpg",
    steps: [
      {
        stepNumber: 1,
        title: "Check Blood Sugar",
        instruction: "If possible, check blood glucose level. Below 70 mg/dL is hypoglycemia.",
        criticalNote: "If unconscious, assume low blood sugar and call emergency",
      },
      {
        stepNumber: 2,
        title: "Give Sugar (If Conscious)",
        instruction: "Give 15-20 grams of fast-acting sugar: juice, candy, or glucose tablets.",
        criticalNote: "Never give food or drink to unconscious person",
      },
      {
        stepNumber: 3,
        title: "Wait and Recheck",
        instruction: "Wait 15 minutes and recheck blood sugar. If still low, give more sugar.",
        criticalNote: "Symptoms should improve within 10-15 minutes",
      },
      {
        stepNumber: 4,
        title: "Call for Help if Needed",
        instruction: "If person is unconscious or not improving, call emergency services immediately.",
        criticalNote: "Glucagon injection may be needed for severe cases",
      },
      {
        stepNumber: 5,
        title: "Follow Up",
        instruction: "Once stable, give a snack with protein and carbs. Ensure person sees their doctor.",
        criticalNote: "Monitor for several hours after episode",
      },
    ],
  },
  {
    id: "burns",
    title: "Burn Treatment",
    category: "trauma",
    severity: "moderate",
    description: "First aid for thermal burns",
    estimatedTime: "5-10 minutes",
    requiredEquipment: ["Cool water", "Clean cloth", "Burn dressing", "Pain medication"],
    warningSignals: [
      "Large burn area",
      "Deep burns (white or charred)",
      "Burns on face, hands, or genitals",
      "Chemical or electrical burns",
    ],
    videoUrl: "/burn-first-aid-treatment.jpg",
    steps: [
      {
        stepNumber: 1,
        title: "Stop the Burning",
        instruction: "Remove person from heat source. Remove jewelry and tight clothing before swelling starts.",
        criticalNote: "Do not remove clothing stuck to burn",
      },
      {
        stepNumber: 2,
        title: "Cool the Burn",
        instruction: "Run cool (not cold) water over burn for 10-20 minutes. Do not use ice.",
        criticalNote: "For large burns, risk of hypothermia - use cool wet cloths",
      },
      {
        stepNumber: 3,
        title: "Assess Severity",
        instruction: "Check burn depth and size. Call emergency for large, deep, or facial burns.",
        criticalNote: "Third-degree burns may appear white or charred",
      },
      {
        stepNumber: 4,
        title: "Cover Burn",
        instruction: "Cover with sterile, non-stick bandage or clean cloth. Do not apply ointments.",
        criticalNote: "Do not break blisters - they protect against infection",
      },
      {
        stepNumber: 5,
        title: "Manage Pain",
        instruction: "Give over-the-counter pain medication. Keep burn elevated if possible.",
        criticalNote: "Watch for signs of infection: increased pain, redness, swelling",
      },
    ],
  },
  {
    id: "anaphylaxis",
    title: "Anaphylaxis (Severe Allergic Reaction)",
    category: "respiratory",
    severity: "critical",
    description: "Emergency response to severe allergic reaction",
    estimatedTime: "1-2 minutes",
    requiredEquipment: ["Epinephrine auto-injector (EpiPen)", "Antihistamine"],
    warningSignals: ["Difficulty breathing", "Swelling of face or throat", "Rapid pulse", "Dizziness or fainting"],
    videoUrl: "/epipen-administration-demonstration.jpg",
    steps: [
      {
        stepNumber: 1,
        title: "Recognize Anaphylaxis",
        instruction: "Look for multiple symptoms: skin reactions, breathing problems, low blood pressure, GI symptoms.",
        criticalNote: "Anaphylaxis can be fatal - act immediately",
      },
      {
        stepNumber: 2,
        title: "Call Emergency Services",
        instruction: "Call emergency hotline immediately. Tell them it's anaphylaxis.",
        criticalNote: "Do not wait to see if symptoms improve",
      },
      {
        stepNumber: 3,
        title: "Give Epinephrine",
        instruction: "Use epinephrine auto-injector immediately. Inject into outer thigh through clothing if needed.",
        criticalNote: "Hold injector in place for 3 seconds",
      },
      {
        stepNumber: 4,
        title: "Position Patient",
        instruction: "Have person lie flat with legs elevated. If vomiting or breathing difficulty, sit them up.",
        criticalNote: "Do not have person stand or walk",
      },
      {
        stepNumber: 5,
        title: "Monitor and Repeat",
        instruction: "Monitor breathing and pulse. If no improvement in 5-15 minutes, give second dose of epinephrine.",
        criticalNote: "Stay with person until emergency services arrive",
      },
    ],
  },
]

export const PROTOCOL_CATEGORIES = [
  { value: "cardiac", label: "Cardiac Emergencies", icon: "❤️" },
  { value: "respiratory", label: "Respiratory Emergencies", icon: "🫁" },
  { value: "trauma", label: "Trauma & Bleeding", icon: "🩹" },
  { value: "neurological", label: "Neurological Emergencies", icon: "🧠" },
  { value: "obstetric", label: "Obstetric Emergencies", icon: "🤰" },
  { value: "environmental", label: "Environmental Emergencies", icon: "🌡️" },
] as const

export const EMERGENCY_HOTLINE = "1669" // Thailand emergency number
