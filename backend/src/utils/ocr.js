import Tesseract from "tesseract.js";
import sharp from "sharp";

/**
 * Extracts raw text from an image file using a dual-pass OCR strategy with preprocessing.
 * @param {string} imagePath - Absolute path to the local image file
 * @returns {Promise<string>} - Extracted raw text (best result from dual-pass)
 */
export const extractTextFromImage = async (imagePath) => {
  try {
    // Optimized Tesseract configuration
    const tesseractConfig = {
      tessedit_pageseg_mode: "6", // PSM 6: Assume a single uniform block of text
      tessedit_ocr_engine_mode: "1", // OEM 1: LSTM only
    };

    // Pass 1: Preprocessed with Thresholding (Binarization)
    const buffer1 = await sharp(imagePath)
      .resize({ width: 2000 })
      .grayscale()
      .normalize()
      .sharpen()
      .threshold(150)
      .toBuffer();

    const { data: { text: text1 } } = await Tesseract.recognize(buffer1, "eng", tesseractConfig);

    // Pass 2: Naturalized (Normalize + Sharpen only)
    const buffer2 = await sharp(imagePath)
      .resize({ width: 2000 })
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();

    const { data: { text: text2 } } = await Tesseract.recognize(buffer2, "eng", tesseractConfig);

    // Select the "winner" (longest extracted string)
    const finalText = (text1 || "").length >= (text2 || "").length ? text1 : text2;

    console.log("OCR RAW TEXT:", finalText);
    return finalText;
  } catch (error) {
    console.error("OCR Extraction Error:", error);
    throw new Error(`OCR dual-pass extraction failed: ${error.message}`);
  }
};
