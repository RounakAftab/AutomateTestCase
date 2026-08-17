import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { createWorker } from 'tesseract.js';
import type { AISettings } from '../types';

/**
 * Extracts clean, human-readable plain text from any uploaded file:
 * - Microsoft Word (.docx, .doc)
 * - Excel Spreadsheets (.xlsx, .xls)
 * - Images via OCR / Vision (.png, .jpg, .jpeg, .webp, .bmp)
 * - Plain Text & Markdown (.txt, .md, .csv, .json, .feature, .spec.ts)
 */
export async function extractTextFromFile(
  file: File,
  aiSettings?: AISettings,
  onProgress?: (status: string) => void
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // 1. Handle Images (.png, .jpg, .jpeg, .webp, .bmp)
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'svg'].includes(ext) || file.type.startsWith('image/')) {
    return await extractTextFromImage(file, aiSettings, onProgress);
  }

  // 2. Handle Microsoft Word (.docx) Files
  if (ext === 'docx' || ext === 'doc') {
    onProgress?.('Extracting text from Word document...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value && result.value.trim().length > 0) {
        return result.value.trim();
      }
    } catch (e) {
      console.warn('Mammoth extraction failed, falling back to JSZip XML parser:', e);
    }

    // Fallback via JSZip to extract word/document.xml
    try {
      const zip = await JSZip.loadAsync(file);
      const docXml = await zip.file('word/document.xml')?.async('string');
      if (docXml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(docXml, 'application/xml');
        const paragraphs = Array.from(xmlDoc.getElementsByTagName('w:p'));
        const extracted = paragraphs
          .map((p) => {
            const textNodes = Array.from(p.getElementsByTagName('w:t'));
            return textNodes.map((t) => t.textContent || '').join('');
          })
          .filter(Boolean)
          .join('\n');

        if (extracted.trim().length > 0) {
          return extracted.trim();
        }
      }
    } catch (zipErr) {
      console.error('JSZip docx fallback failed:', zipErr);
    }
  }

  // 3. Handle Excel Spreadsheets (.xlsx, .xls)
  if (ext === 'xlsx' || ext === 'xls') {
    onProgress?.('Extracting data from Excel spreadsheet...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      if (firstSheetName) {
        const sheet = wb.Sheets[firstSheetName];
        const csvText = XLSX.utils.sheet_to_csv(sheet);
        return `Scenario Data from Excel Sheet (${firstSheetName}):\n${csvText}`;
      }
    } catch (xlsErr) {
      console.error('Excel extraction error:', xlsErr);
    }
  }

  // 4. Handle Plain Text, Markdown, CSV, JSON, Feature Files
  onProgress?.('Reading text file...');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      resolve(content || '');
    };
    reader.onerror = () => reject(new Error('Failed to read plain text file'));
    reader.readAsText(file);
  });
}

/**
 * Extracts text and test scenario requirements from an Image using:
 * 1. Gemini Vision API (if Gemini API Key is configured in settings)
 * 2. High-Accuracy Client-Side Tesseract.js OCR (100% offline & local)
 */
export async function extractTextFromImage(
  imageFile: File | Blob,
  aiSettings?: AISettings,
  onProgress?: (status: string) => void
): Promise<string> {
  // Option A: Gemini Vision API with automatic model fallback
  if (aiSettings?.apiKey && aiSettings.provider === 'gemini') {
    const VISION_MODEL_CHAIN = [
      'gemini-flash-lite-latest',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
      'gemini-flash-latest',
      'gemini-pro-vision',
    ];

    // Preferred model first, then the rest of the chain
    const preferredModel = aiSettings.model;
    const modelsToTry = preferredModel
      ? [preferredModel, ...VISION_MODEL_CHAIN.filter((m) => m !== preferredModel)]
      : VISION_MODEL_CHAIN;

    try {
      onProgress?.('AI Vision analyzing screenshot & UI elements...');
      const base64Data = await blobToBase64(imageFile);
      const mimeType = imageFile.type || 'image/png';
      const prompt = `Analyze this image (UI screenshot, test scenario diagram, or spec ticket) and extract all test scenarios, form fields, constraints, business rules, and acceptance criteria in clean English text.`;

      for (const model of modelsToTry) {
        try {
          console.info(`[Gemini Vision] Trying model: ${model}`);
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiSettings.apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: prompt },
                      {
                        inlineData: {
                          mimeType: mimeType,
                          data: base64Data.split(',')[1],
                        },
                      },
                    ],
                  },
                ],
              }),
            }
          );

          if (response.status === 404 || response.status === 400) {
            console.warn(`[Gemini Vision] Model "${model}" unavailable (HTTP ${response.status}), trying next...`);
            continue;
          }

          if (response.ok) {
            const json = await response.json();
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim().length > 0) {
              console.info(`[Gemini Vision] Successfully used model: ${model}`);
              return text.trim();
            }
          }
        } catch (_modelErr) {
          console.warn(`[Gemini Vision] Model "${model}" failed, trying next...`);
          continue;
        }
      }
    } catch (visionErr) {
      console.warn('Gemini vision extraction failed, falling back to Tesseract OCR:', visionErr);
    }
  }

  // Option B: Client-Side Tesseract OCR
  onProgress?.('Initializing OCR engine...');
  const worker = await createWorker('eng');
  try {
    onProgress?.('Extracting text from image...');
    const ret = await worker.recognize(imageFile);
    await worker.terminate();
    const cleanText = ret.data.text.trim();
    if (!cleanText) {
      return 'Image OCR completed, but no legible text was detected in the image.';
    }
    return cleanText;
  } catch (err) {
    await worker.terminate();
    console.error('Tesseract OCR error:', err);
    throw new Error('Failed to extract text from image');
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
