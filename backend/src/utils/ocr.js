import Tesseract from "tesseract.js";

/**
 * Extracts raw text from an image file using Tesseract.js
 * @param {string} imagePath - Absolute path to the local image file
 * @returns {Promise<string>} - Extracted raw text
 */
export const extractTextFromImage = async (imagePath) => {
  try {
    const { data: { text } } = await Tesseract.recognize(imagePath, "eng");
    return text;
  } catch (error) {
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
};
