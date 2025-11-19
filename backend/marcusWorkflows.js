/**
 * Marcus Workflow Builder
 * Generates personalized workflows for content creators, marketers, and freelancers
 */

const ONBOARDING_QUESTIONS = [
  {
    id: 1,
    question: "What do you do? (freelance creator, agency, in-house, etc.)",
    key: "role",
    options: ["freelance creator", "agency", "in-house", "solo creator", "social media manager", "other"]
  },
  {
    id: 2,
    question: "Which platforms matter most to you? (IG, TikTok, YouTube, LinkedIn, etc.)",
    key: "platforms",
    options: ["Instagram", "TikTok", "YouTube", "LinkedIn", "Twitter/X", "Facebook", "Pinterest", "Other"]
  },
  {
    id: 3,
    question: "How many hours per week can you realistically put into content/marketing?",
    key: "hoursPerWeek",
    options: ["1-5 hours", "5-10 hours", "10-20 hours", "20-40 hours", "40+ hours"]
  },
  {
    id: 4,
    question: "Are you focused more on: (A) getting clients, (B) growing audience, or (C) launching products?",
    key: "primaryGoal",
    options: ["getting clients", "growing audience", "launching products", "building brand", "multiple goals"]
  },
  {
    id: 5,
    question: "Do you already have long-form content (pods, YT vids, lives), or mostly short content?",
    key: "contentType",
    options: ["mostly long-form", "mostly short-form", "mix of both", "just starting out"]
  }
];

function getOnboardingQuestion(answers) {
  const answeredCount = Object.keys(answers).length;
  
  if (answeredCount < ONBOARDING_QUESTIONS.length) {
    return ONBOARDING_QUESTIONS[answeredCount];
  }
  
  return null;
}

function generateWorkflowProposals(answers) {
  const { role, platforms, hoursPerWeek, primaryGoal, contentType } = answers;
  
  const proposals = [];
  
  // Parse hours (handle "5-10 hours" format)
  const hoursMatch = hoursPerWeek?.match(/(\d+)/);
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 10;
  const isLowHours = hours <= 10;
  const isMediumHours = hours > 10 && hours <= 20;
  const isHighHours = hours > 20;
  
  // Determine platform focus
  const platformList = Array.isArray(platforms) ? platforms : [platforms];
  const hasVideo = platformList.some(p => ["TikTok", "YouTube", "Instagram"].includes(p));
  const hasLinkedIn = platformList.includes("LinkedIn");
  const hasMultiple = platformList.length > 2;
  
  // Client-focused workflows
  if (primaryGoal === "getting clients" || role === "agency" || role === "freelance creator") {
    proposals.push({
      name: "Client Content System",
      description: `A streamlined system for managing client content across ${platformList.length} platform(s) within your ${hoursPerWeek} weekly budget.`,
      focus: "client delivery and retention",
      intensity: isLowHours ? "light" : isMediumHours ? "moderate" : "intensive"
    });
  }
  
  // Audience growth workflows
  if (primaryGoal === "growing audience" || role === "solo creator") {
    proposals.push({
      name: "Weekly Content Engine",
      description: `A sustainable ${hoursPerWeek}-hour system for consistent content across ${platformList.join(", ")}.`,
      focus: "consistent posting and engagement",
      intensity: isLowHours ? "light" : isMediumHours ? "moderate" : "intensive"
    });
  }
  
  // Launch-focused workflows
  if (primaryGoal === "launching products") {
    proposals.push({
      name: "Launch Plan",
      description: `A focused ${hoursPerWeek}-hour launch system for ${platformList.join(", ")}.`,
      focus: "pre-launch content and launch day execution",
      intensity: isLowHours ? "light" : isMediumHours ? "moderate" : "intensive"
    });
  }
  
  // Default if no match
  if (proposals.length === 0) {
    proposals.push({
      name: "Weekly Content System",
      description: `A ${hoursPerWeek}-hour weekly system tailored to your ${role} role and ${platformList.join(", ")} platforms.`,
      focus: "consistent content creation and posting",
      intensity: isLowHours ? "light" : isMediumHours ? "moderate" : "intensive"
    });
  }
  
  return proposals;
}

function generateWeeklyStructure(workflowName, answers) {
  const { role, platforms, hoursPerWeek, primaryGoal, contentType } = answers;
  
  const hours = parseInt(hoursPerWeek) || 10;
  const platformList = Array.isArray(platforms) ? platforms : [platforms];
  const isLowHours = hours <= 10;
  const isMediumHours = hours > 10 && hours <= 20;
  
  // Base structure templates
  let structure = [];
  
  if (workflowName.includes("Client")) {
    // Client Content System
    structure = [
      { day: "MON", tasks: ["Review client briefs", "Plan content calendar", "Draft hooks & scripts"], time: "2-3h", priority: "must-do" },
      { day: "TUE", tasks: ["Batch record content", "Client check-ins"], time: isLowHours ? "1-2h" : "2-4h", priority: "must-do" },
      { day: "WED", tasks: ["Edit & finalize", "Schedule posts"], time: "2-3h", priority: "must-do" },
      { day: "THU", tasks: ["Engagement & DMs", "Analytics review"], time: "1h", priority: "nice-to-have" },
      { day: "FRI", tasks: ["Weekly report", "Next week prep"], time: "1h", priority: "must-do" }
    ];
  } else if (workflowName.includes("Launch")) {
    // Launch Plan
    structure = [
      { day: "MON", tasks: ["Plan launch content", "Create launch assets"], time: "2-3h", priority: "must-do" },
      { day: "TUE", tasks: ["Batch create content", "Write captions"], time: isLowHours ? "1-2h" : "2-4h", priority: "must-do" },
      { day: "WED", tasks: ["Edit & schedule", "Prep launch day posts"], time: "2-3h", priority: "must-do" },
      { day: "THU", tasks: ["Launch day execution", "Live engagement"], time: "2-4h", priority: "must-do" },
      { day: "FRI", tasks: ["Post-launch analysis", "Follow-up content"], time: "1-2h", priority: "nice-to-have" }
    ];
  } else {
    // Weekly Content Engine (default)
    structure = [
      { day: "MON", tasks: ["Plan hooks & scripts", "Content ideation"], time: isLowHours ? "1h" : "2h", priority: "must-do" },
      { day: "TUE", tasks: ["Batch record content"], time: isLowHours ? "1-2h" : "2-4h", priority: "must-do" },
      { day: "WED", tasks: ["Edit & schedule posts"], time: isLowHours ? "1h" : "2h", priority: "must-do" },
      { day: "THU", tasks: ["Engagement & DMs", "Community building"], time: isLowHours ? "30min" : "1-2h", priority: "nice-to-have" },
      { day: "FRI", tasks: ["Analytics review", "Next week prep"], time: "30min-1h", priority: "nice-to-have" }
    ];
  }
  
  // Adjust for low hours
  if (isLowHours) {
    structure = structure.filter(s => s.priority === "must-do" || s.day === "THU");
  }
  
  return structure;
}

function generateTaskBreakdown(workflowName, answers) {
  const { platforms, hoursPerWeek, contentType } = answers;
  const platformList = Array.isArray(platforms) ? platforms : [platforms];
  const hours = parseInt(hoursPerWeek) || 10;
  
  const tasks = [];
  
  // Planning tasks
  tasks.push({
    category: "Planning",
    tasks: [
      { task: "Content ideation & hooks", time: "30min-1h", platforms: platformList, priority: "must-do" },
      { task: "Script writing", time: "30min-1h", platforms: platformList.filter(p => ["TikTok", "Instagram", "YouTube"].includes(p)), priority: "must-do" },
      { task: "Content calendar", time: "15-30min", platforms: platformList, priority: "nice-to-have" }
    ]
  });
  
  // Creation tasks
  const creationTasks = [];
  if (contentType === "mostly long-form" || platformList.includes("YouTube")) {
    creationTasks.push({ task: "Record long-form content", time: "1-2h", platforms: ["YouTube"], priority: "must-do" });
  }
  if (contentType === "mostly short-form" || platformList.some(p => ["TikTok", "Instagram"].includes(p))) {
    creationTasks.push({ task: "Batch record short-form", time: "1-2h", platforms: platformList.filter(p => ["TikTok", "Instagram"].includes(p)), priority: "must-do" });
  }
  if (creationTasks.length === 0) {
    creationTasks.push({ task: "Create content", time: "1-2h", platforms: platformList, priority: "must-do" });
  }
  tasks.push({ category: "Creation", tasks: creationTasks });
  
  // Editing & scheduling
  tasks.push({
    category: "Editing & Scheduling",
    tasks: [
      { task: "Edit content", time: "1-2h", platforms: platformList, priority: "must-do" },
      { task: "Write captions", time: "30min-1h", platforms: platformList, priority: "must-do" },
      { task: "Schedule posts", time: "15-30min", platforms: platformList, priority: "must-do" }
    ]
  });
  
  // Engagement
  if (hours >= 10) {
    tasks.push({
      category: "Engagement",
      tasks: [
        { task: "Respond to comments & DMs", time: "30min-1h", platforms: platformList, priority: "nice-to-have" },
        { task: "Engage with community", time: "30min", platforms: platformList, priority: "nice-to-have" }
      ]
    });
  }
  
  // Analytics
  if (hours >= 10) {
    tasks.push({
      category: "Analytics",
      tasks: [
        { task: "Review performance metrics", time: "15-30min", platforms: platformList, priority: "nice-to-have" },
        { task: "Adjust strategy", time: "15-30min", platforms: platformList, priority: "nice-to-have" }
      ]
    });
  }
  
  return tasks;
}

function summarizeAnswers(answers) {
  const { role, platforms, hoursPerWeek, primaryGoal, contentType } = answers;
  const platformList = Array.isArray(platforms) ? platforms : [platforms];
  
  return `So you're a ${role} focused on ${primaryGoal} with ${hoursPerWeek} on ${platformList.join(", ")}.`;
}

module.exports = {
  ONBOARDING_QUESTIONS,
  getOnboardingQuestion,
  generateWorkflowProposals,
  generateWeeklyStructure,
  generateTaskBreakdown,
  summarizeAnswers
};

