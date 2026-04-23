import { FlowDefinition, FlowResult } from "../engine/types";

export const sentimentClaw: FlowDefinition = {
  id: "sentiment",
  name: "Sentiment-Claw",
  description: "Analyzes emotional tone of the input text",
  example: "I am absolutely thrilled with the new update! It works perfectly.",
  icon: "🎭",
  color: "#ec4899",
  category: "text",

  execute(input: string): FlowResult {
    const steps: string[] = ["Tokenizing input text"];
    
    const positiveWords = new Set(["good", "great", "awesome", "excellent", "happy", "thrilled", "perfect", "perfectly", "love", "amazing"]);
    const negativeWords = new Set(["bad", "terrible", "awful", "sad", "angry", "hate", "worst", "broken", "failed", "error"]);
    
    const words = input.toLowerCase().match(/\b\w+\b/g) || [];
    
    steps.push("Scoring emotional keywords");
    
    let posCount = 0;
    let negCount = 0;
    
    words.forEach(w => {
      if (positiveWords.has(w)) posCount++;
      if (negativeWords.has(w)) negCount++;
    });
    
    let sentiment = "Neutral";
    let score = 0; // -100 to 100
    
    if (words.length > 0) {
      score = Math.round(((posCount - negCount) / Math.max(posCount + negCount, 1)) * 100);
      if (score > 20) sentiment = "Positive";
      else if (score < -20) sentiment = "Negative";
    }
    
    steps.push(`Calculated sentiment score: ${score}`);

    return {
      steps,
      result: {
        sentiment,
        score,
        metrics: {
          positive_keywords: posCount,
          negative_keywords: negCount,
          total_words: words.length
        }
      },
    };
  },
};
