import { FlowDefinition, FlowResult } from "../engine/types";

export const calendarClaw: FlowDefinition = {
  id: "calendar",
  name: "Calendar-Claw",
  description: "Extracts structured event data from natural language descriptions",
  example: "Meeting with John tomorrow at 3pm to discuss project alpha",
  icon: "📅",
  color: "#f59e0b", // amber
  category: "productivity",

  execute(input: string): FlowResult {
    const steps: string[] = ["Analyzing text for temporal markers"];
    
    // Very basic deterministic parsing for demonstration
    const lower = input.toLowerCase();
    
    // Extract participants
    steps.push("Identifying participants");
    const withMatch = input.match(/with\s+([a-z]+(?:(?!\s+(?:tomorrow|today|next|at|on|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\s+[a-z]+)?)\b/i);
    const participants = withMatch ? [withMatch[1]] : [];
    
    // Extract time
    steps.push("Extracting time references");
    const timeMatch = lower.match(/([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm))/i);
    const time = timeMatch ? timeMatch[1] : "TBD";
    
    // Extract date (relative/absolute)
    steps.push("Resolving relative dates");
    let date = "TBD";
    if (lower.includes("tomorrow")) date = "Tomorrow";
    else if (lower.includes("today")) date = "Today";
    else if (lower.includes("next week")) date = "Next Week";
    else if (lower.includes("monday")) date = "Monday";
    else if (lower.includes("tuesday")) date = "Tuesday";
    else if (lower.includes("wednesday")) date = "Wednesday";
    else if (lower.includes("thursday")) date = "Thursday";
    else if (lower.includes("friday")) date = "Friday";
    else if (lower.includes("saturday")) date = "Saturday";
    else if (lower.includes("sunday")) date = "Sunday";
    else {
      const dayMatch = input.match(/[A-Z][a-z]+ \d{1,2}/i);
      if (dayMatch) date = dayMatch[0];
    }
    
    // Topic extraction
    steps.push("Inferring event topic");
    let topic = "Meeting";
    const discussMatch = input.match(/discuss\s+(.+)/i);
    if (discussMatch) {
      topic = discussMatch[1].charAt(0).toUpperCase() + discussMatch[1].slice(1);
    } else {
      const firstWords = input.split(' ').slice(0, 4).join(' ');
      if (firstWords) topic = firstWords;
    }

    steps.push("Structuring event payload");

    return {
      steps,
      result: {
        event: {
          title: topic,
          date: date,
          time: time,
          participants: participants,
          duration: "1 hour (estimated)",
          type: participants.length > 0 ? "Meeting" : "Reminder",
        },
        raw_input: input
      },
    };
  },
};
