import { FlowDefinition, FlowResult } from "../engine/types";

/**
 * Summary-Claw: Extracts key points from text
 * Splits into sentences, scores by keyword density and position,
 * returns top sentences as bullet points with reading time
 */

const BOOST_WORDS = new Set([
  "important", "key", "critical", "essential", "main", "primary",
  "significant", "crucial", "core", "fundamental", "major", "notable",
  "first", "second", "finally", "conclusion", "result", "therefore",
  "however", "because", "must", "should", "need",
]);

function scoreSentence(sentence: string, index: number, total: number): number {
  const words = sentence.toLowerCase().split(/\s+/);
  let score = 0;

  // Longer sentences tend to be more informative (up to a point)
  score += Math.min(words.length * 0.5, 10);

  // Boost words increase relevance
  for (const word of words) {
    if (BOOST_WORDS.has(word)) score += 3;
  }

  // First and last sentences tend to be important
  if (index === 0) score += 5;
  if (index === total - 1) score += 3;

  // Sentences with numbers often contain data
  if (/\d/.test(sentence)) score += 2;

  return Math.round(score * 10) / 10;
}

export const summaryClaw: FlowDefinition = {
  id: "summary",
  name: "Summary-Claw",
  description: "Extracts key points from text using positional and keyword scoring",
  example: "The project aims to build a scalable platform. The key challenge is performance. We must optimize the database layer. Testing should cover edge cases. Finally, deployment needs CI/CD pipelines.",
  icon: "📝",
  color: "#ec4899",
  category: "text",

  execute(input: string): FlowResult {
    const steps: string[] = [
      "Splitting text into sentences",
      "Scoring sentences by relevance",
      "Ranking by keyword density",
      "Applying position weighting",
      "Selecting top key points",
      "Computing reading metrics",
    ];

    const sentences = input
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    const scored = sentences
      .map((sentence, index) => ({
        sentence,
        score: scoreSentence(sentence, index, sentences.length),
      }))
      .sort((a, b) => b.score - a.score);

    const topCount = Math.max(1, Math.min(5, Math.ceil(sentences.length * 0.4)));
    const keyPoints = scored.slice(0, topCount).map((s) => s.sentence);

    const totalWords = input.split(/\s+/).filter((w) => w.length > 0).length;
    const readingTimeMinutes = Math.max(1, Math.round(totalWords / 200));

    return {
      steps,
      result: {
        key_points: keyPoints,
        pipelineInput: keyPoints.join(". "),
        stats: {
          original_sentences: sentences.length,
          extracted_points: keyPoints.length,
          compression_ratio: `${Math.round((keyPoints.length / Math.max(sentences.length, 1)) * 100)}%`,
          word_count: totalWords,
          estimated_read_time: `${readingTimeMinutes} min`,
        },
      },
    };
  },
};
