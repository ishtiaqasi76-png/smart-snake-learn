// Simple text-to-speech helper using the browser's built-in SpeechSynthesis API.
// Free, no API key, works offline on most devices.

let voicesCache: SpeechSynthesisVoice[] = [];

const loadVoices = () => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  voicesCache = window.speechSynthesis.getVoices();
};

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

const pickVoice = (lang: string) => {
  if (!voicesCache.length) loadVoices();
  // exact match first, then prefix match
  return (
    voicesCache.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ||
    voicesCache.find((v) => v.lang.toLowerCase().startsWith(lang.split("-")[0].toLowerCase()))
  );
};

// Map digits/letters to spoken text
const numberWords: Record<string, string> = {
  "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four",
  "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
  "10": "ten", "11": "eleven", "12": "twelve", "13": "thirteen", "14": "fourteen",
  "15": "fifteen", "16": "sixteen", "17": "seventeen", "18": "eighteen", "19": "nineteen",
  "20": "twenty",
};

const speakUtterance = (text: string, lang: string, rate = 0.85) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    u.pitch = 1.1;
    u.volume = 1;
    const v = pickVoice(lang);
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch {
    // ignore
  }
};

export const speech = {
  // Speak a value based on level category
  speak(value: string, category: "counting" | "abc" | "urdu") {
    if (category === "urdu") {
      // Urdu letter — try ur-PK voice, fall back to default
      speakUtterance(value, "ur-PK", 0.8);
      return;
    }
    if (category === "counting") {
      // For numbers, speak the digit name; browser usually says digits fine,
      // but we map the small ones explicitly for crisp pronunciation.
      const word = numberWords[value] ?? value;
      speakUtterance(word, "en-US", 0.85);
      return;
    }
    // abc — letter
    speakUtterance(value, "en-US", 0.8);
  },
  cancel() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  },
};
