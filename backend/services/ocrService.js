const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const sharp = require('sharp');
const { GoogleGenAI } = require('@google/genai');

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const safeParseJSON = (text) => {
  try {
    const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[OCR] JSON Parse Error. Raw text:", text);
    throw new Error("Failed to parse AI response as JSON");
  }
};

const parseTimetableImage = async (filePath) => {
  const absolutePath = path.resolve(filePath);
  const isPDF = absolutePath.toLowerCase().endsWith('.pdf');
  console.log(`[OCR] Parsing file: ${absolutePath} (isPDF: ${isPDF})`);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`[OCR] File not found: ${absolutePath}`);
    throw new Error('File not found');
  }

  if (!isPDF) {
    try {
      const metadata = await sharp(absolutePath).metadata();
      console.log(`[OCR] Image metadata: ${metadata.width}x${metadata.height} (${metadata.format})`);
    } catch (e) {
      console.warn(`[OCR] Could not read image metadata:`, e.message);
    }
  }

  if (process.env.GOOGLE_API_KEY && !isPDF) {
    try {
      console.log(`[OCR] Using Gemini Vision for detection...`);
      return await parseWithAI(absolutePath);
    } catch (err) {
      console.error(`[OCR] AI Detection failed, falling back to local OCR:`, err.message);
    }
  }

  if (isPDF) {
    return await parsePDF(absolutePath);
  } else {
    return await parseImage(absolutePath);
  }
};

const parseWithAI = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = { 
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', 
    '.webp': 'image/webp', '.gif': 'image/gif' 
  };
  const mimeType = mimeMap[ext] || 'image/png';

  console.log(`[OCR] Enhancing image for AI analysis...`);
  const imageBuffer = await sharp(filePath)
    .resize({ width: 2200, withoutEnlargement: false })
    .sharpen()
    .toBuffer();
    
  const imageBase64 = imageBuffer.toString('base64');

  const prompt = `Extract the weekly timetable from this university grid. 
The top row contains time slot headers with time ranges. 
The left column indicates the days (Mo, Tu, We, Th, Fr, Sa).
For each day, return a list of slots with "time" and "subject".
Return ONLY valid JSON in format:
{
  "subjects": ["Name", ...],
  "timetable": [{ "day": "Monday", "slots": [{ "time": "09:00 - 10:00", "subject": "Math" }] }]
}`;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { inlineData: { mimeType, data: imageBase64 } },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    return safeParseJSON(result.text);
  } catch (error) {
    console.error(`[OCR] Gemini API error:`, error);
    throw error;
  }
};

const preprocessImage = async (inputPath) => {
  const outputPath = path.join(path.dirname(inputPath), 'processed-' + Date.now() + '.png');
  await sharp(inputPath)
    .resize({ width: 2000 })
    .grayscale()
    .normalize()
    .sharpen()
    .threshold(150)
    .toFile(outputPath);
  return outputPath;
};

const parsePDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const dayMap = {
    'mo': 'Monday', 'tu': 'Tuesday', 'we': 'Wednesday', 'th': 'Thursday', 'fr': 'Friday', 'sa': 'Saturday',
    'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday', 'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday'
  };

  const timetable = [];
  const subjects = new Set();
  
  lines.forEach(line => {
    const words = line.split(/\s+/);
    const firstWord = words[0].toLowerCase().replace(/[^a-z]/g, '');
    if (dayMap[firstWord]) {
      const day = dayMap[firstWord];
      const rest = words.slice(1).join(' ').trim();
      const slots = rest.split(/\s\s+/).filter(s => s.length > 1).map((s, idx) => {
        subjects.add(s);
        return { time: `Slot ${idx + 1}`, subject: s };
      });
      if (slots.length > 0) timetable.push({ day, slots });
    }
  });

  return { subjects: Array.from(subjects), timetable };
};

const processBlock = (block, slots, subjectsSet) => {
  if (block.length === 0) return;
  const text = block.map(w => w.text).join(' ');
  const subjectWord = block.find(w => /^[A-Z0-9-]{2,10}$/.test(w.text)) || block[0];
  const subjectCode = subjectWord.text.replace(/[^A-Z0-9-]/g, '');
  
  if (subjectCode.length < 2 || /^\d+$/.test(subjectCode) || ['Room', 'Slot', 'No'].includes(subjectCode)) {
    return;
  }

  slots.push({ time: `Slot ${slots.length + 1}`, subject: subjectCode });
  subjectsSet.add(subjectCode);
};

const parseImage = async (filePath) => {
  let worker;
  let processedPath;
  try {
    processedPath = await preprocessImage(filePath);
    worker = await Tesseract.createWorker('eng', 1);
    const result = await worker.recognize(processedPath, { rotateAuto: true }, { psm: 6 });
    
    const data = result.data;
    const words = data.words || [];
    const imgWidth = data.imageWidth || 1280;

    const dayMap = {
      'mo': 'Monday', 'tu': 'Tuesday', 'we': 'Wednesday', 'th': 'Thursday', 'fr': 'Friday', 'sa': 'Saturday',
      'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday', 'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday'
    };

    const detectedDays = words.filter(w => {
      const clean = w.text.toLowerCase().replace(/[^a-z0-9]/g, '');
      return !!dayMap[clean] && w.bbox.x0 < imgWidth * 0.4;
    });

    const timetable = [];
    const subjects = new Set();

    detectedDays.forEach(dayWord => {
      const dayClean = dayWord.text.toLowerCase().replace(/[^a-z0-9]/g, '');
      const dayName = dayMap[dayClean];
      
      const rowWords = words.filter(w => 
        Math.abs(w.bbox.y0 - dayWord.bbox.y0) < (dayWord.bbox.y1 - dayWord.bbox.y0) * 3.0 && 
        w.bbox.x0 > dayWord.bbox.x1
      ).sort((a, b) => a.bbox.x0 - b.bbox.x0);

      const slots = [];
      let currentBlock = [];

      rowWords.forEach((w, idx) => {
        const prevWord = rowWords[idx - 1];
        const gap = prevWord ? (w.bbox.x0 - prevWord.bbox.x1) : 0;
        if (idx > 0 && gap > 50) {
          processBlock(currentBlock, slots, subjects);
          currentBlock = [];
        }
        currentBlock.push(w);
      });
      
      processBlock(currentBlock, slots, subjects);
      if (slots.length > 0) timetable.push({ day: dayName, slots });
    });

    return { subjects: Array.from(subjects), timetable };
  } catch (error) {
    console.error(`[OCR] Fatal Error:`, error.message);
    throw error;
  } finally {
    if (worker) await worker.terminate();
    if (processedPath && fs.existsSync(processedPath)) {
      try { fs.unlinkSync(processedPath); } catch (e) {}
    }
  }
};

const syncPortalAttendance = async (filePath) => {
  const absolutePath = path.resolve(filePath);
  const ext = path.extname(absolutePath).toLowerCase();
  const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
  const mimeType = mimeMap[ext] || 'image/png';
  const imageBase64 = fs.readFileSync(absolutePath, { encoding: 'base64' });

  const prompt = `Extract current attendance counts from this portal screenshot. 
Return ONLY valid JSON in format:
{
  "attendance": [
    { "subject": "Name", "attended": 10, "total": 12 }
  ]
}`;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { inlineData: { mimeType, data: imageBase64 } },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    return safeParseJSON(result.text);
  } catch (error) {
    console.error(`[Portal Sync] Gemini API error:`, error);
    throw error;
  }
};

const generateDailyBriefing = async (userData) => {
  const { subjects, timetable, name } = userData;
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = dayNames[new Date().getDay()];

  const prompt = `You are an academic consistency coach for ${name}. 
Data: ${JSON.stringify(subjects.map(s => ({ n: s.name, a: s.attended, t: s.total })))}
Today: ${JSON.stringify(timetable.find(t => t.day === today)?.slots || [])}
Generate a 2-sentence max briefing.`;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    return result.text ? result.text.trim() : `Stay focused today, ${name}! Your consistency is key to success.`;
  } catch (error) {
    console.error(`[Briefing] Gemini API error:`, error);
    return `Stay focused today, ${name}! Your consistency is key to success.`;
  }
};

module.exports = { parseTimetableImage, syncPortalAttendance, generateDailyBriefing };
