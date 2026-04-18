/**
 * Parses raw text from a visiting card into structured JSON using Gemini AI REST API.
 * @param {string} text - The raw text extracted from OCR.
 * @returns {Promise<Object>} - The structured data.
 */
export const parseVisitingCardText = async (text) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `
      Extract information from the business card text provided below.
      Return ONLY a valid JSON object.
      Do NOT include markdown, explanations, or code blocks.
      Ensure the output is strictly JSON parsable.
      Keys: name, phone, email, business, profession, location, gst.
      Use null for missing fields.

      Text: "${text}"
    `;

    const body = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    let content = data.candidates[0].content.parts[0].text.trim();

    // Clean up response if Gemini includes markdown blocks
    if (content.startsWith("```")) {
      content = content.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      throw new Error(`Invalid AI response format: ${parseError.message}`);
    }
  } catch (error) {
    console.error("AI Parsing Error:", error);
    throw new Error(`AI parsing failed: ${error.message}`);
  }
};
