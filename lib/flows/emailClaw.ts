import { FlowDefinition, FlowResult } from "../engine/types";

export const emailClaw: FlowDefinition = {
  id: "email",
  name: "Email-Claw",
  description: "Drafts a professional email from basic bullet points",
  example: "Meeting next tuesday. Bring reports. Lunch is provided.",
  icon: "📧",
  color: "#3b82f6",
  category: "productivity",

  execute(input: string): FlowResult {
    const steps: string[] = ["Parsing bullet points"];
    
    // Simple parsing to split sentences or bullet points
    const points = input.split(/(?:\. |\n|- )/).map(p => p.trim()).filter(p => p.length > 0);
    
    steps.push("Identifying recipient and tone");
    
    const toMatch = input.match(/to:\s*([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
    const recipient = toMatch ? toMatch[1] : null;
    
    const intro = "I hope this email finds you well. I wanted to reach out regarding a few key points:";
    const body = points.filter(p => !p.toLowerCase().startsWith('to:')).map(p => `• ${p.charAt(0).toUpperCase() + p.slice(1)}`).join('\n');
    const outro = "Please let me know if you have any questions or need further clarification.\n\nBest regards,\n[Your Name]";
    
    steps.push("Generating email draft");
    
    const draft = `${recipient ? `To: ${recipient}\n\n` : ""}${intro}\n\n${body}\n\n${outro}`;

    return {
      steps,
      result: {
        points_extracted: points.length,
        draft: draft,
        pipelineInput: draft,
      },
    };
  },
};
