// Keyword extraction function - extract all meaningful words
export const extractKeywords = (text: string | null | undefined): string[] => {
  if (!text || text.trim().length === 0) return [];

  const words = text.trim().split(/\s+/);
  const keywords = new Set<string>(); // Báo cho TS biết Set này chỉ chứa chuỗi (string)

  // Extract all words with length > 3
  words.forEach((word: string) => {
    const cleanWord = word.replace(/[^\w]/g, ""); // Remove punctuation
    if (cleanWord.length > 3) {
      keywords.add(cleanWord.toLowerCase());
    }
  });

  return Array.from(keywords);
};

// Helper function to get a keyword color
export const getKeywordColor = (keyword: string | null | undefined): string => {
  if (!keyword) return "#CEE8D7";

  // Simple hash to alternate colors in a stable way
  const hash =
    keyword.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) +
    keyword.length;

  return hash % 2 === 0 ? "#CEE8D7" : "#CAE2FF";
};
