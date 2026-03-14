const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const sharp = require('sharp');

const { GoogleGenAI } = require('@google/genai');

const parseTimetableImage = async (filePath) => {
  const absolutePath = path.resolve(filePath);
  const isPDF = absolutePath.toLowerCase().endsWith('.pdf');
  console.log(`[OCR] Parsing file: ${absolutePath} (isPDF: ${isPDF})`);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`[OCR] File not found: ${absolutePath}`);
    throw new Error('File not found');
  }

  // Debug: Log image size
  if (!isPDF) {
    try {
      const metadata = await sharp(absolutePath).metadata();
      console.log(`[OCR] Image metadata: ${metadata.width}x${metadata.height} (${metadata.format})`);
    } catch (e) {
      console.warn(`[OCR] Could not read image metadata:`, e.message);
    }
  }

  // AI OCR (Gemini) only for images, not PDFs
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
    '.jpg': 'image/jpeg', 
    '.jpeg': 'image/jpeg', 
    '.png': 'image/png', 
    '.webp': 'image/webp', 
    '.gif': 'image/gif' 
  };
  const mimeType = mimeMap[ext] || 'image/png';

  // Enhance image for AI - Small text needs higher resolution
  console.log(`[OCR] Enhancing image for AI analysis...`);
  const imageBuffer = await sharp(filePath)
    .resize({ width: 2200, withoutEnlargement: false })
    .sharpen()
    .toBuffer();
    
  const imageBase64 = imageBuffer.toString('base64');

  const prompt = `Extract the weekly timetable from this university grid. 
The top row contains time slot headers (1, 2, 3...) with time ranges below them (e.g., 9:30-10:20). 
The left column indicates the days (Mo, Tu, We, Th, Fr, Sa).

CRITICAL INSTRUCTIONS FOR MERGED CELLS:
- If a subject box spans multiple columns (e.g., CCE covers Slot 1 and Slot 2), you MUST combine the time ranges.
- Example: If Slot 1 is 9:30-10:20 and Slot 2 is 10:20-11:10, and "CCE" spans both, return ONE slot with "time": "09:30 - 11:10".
- Subject names are the LARGE text in the center of blocks (e.g., CCE, MM, NALR-II, IP-III).
- Ignore the tiny text at the bottom-left (room numbers) and bottom-right (teacher names).

For each day, return a list of slots:
1. "time": The full time range covered by the subject (HH:mm - HH:mm).
2. "subject": The actual subject name/code.

Return ONLY a valid JSON object:
{
  "subjects": ["Subject Name", ...],
  "timetable": [
    { "day": "Monday", "slots": [{ "time": "09:30 - 11:10", "subject": "CCE" }, ...] }
  ]
}`;

  try {
    const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

    const contents = [
      {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64,
        },
      },
      { text: prompt },
    ];

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        response_mime_type: "application/json",
      }
    });

    // Gemini Deepmind SDK returns response.text differently or sometimes in a nested structure
    let text = response.text; 
    console.log(`[OCR] AI Raw Response Snippet: ${text.substring(0, 200)}...`);
    
    // Clean markdown code blocks if present
    text = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
    
    const result = JSON.parse(text);
    
    console.log(`[OCR] AI Detection successful. Detected ${result.timetable.length} days.`);
    return result;
  } catch (error) {
    console.error(`[OCR] Gemini API error:`, error);
    throw error;
  }
};

const preprocessImage = async (inputPath) => {
  const outputPath = path.join(path.dirname(inputPath), 'processed-' + Date.now() + '.png');
  console.log(`[OCR] Preprocessing image with advanced Sharp pipeline: ${outputPath}`);
  await sharp(inputPath)
    .resize({ width: 2000 }) // Enlarge text for better OCR
    .grayscale()
    .normalize()
    .sharpen()
    .threshold(150) // Convert to high-contrast black & white
    .toFile(outputPath);
  return outputPath;
};

const parsePDF = async (filePath) => {
  console.log(`[OCR] PDF Parsing started`);
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

  console.log(`  [Block] Detected: "${text}" -> Subject: ${subjectCode}`);
  
  slots.push({
    time: `Slot ${slots.length + 1}`,
    subject: subjectCode
  });
  subjectsSet.add(subjectCode);
};

const parseImage = async (filePath) => {
  console.log(`[OCR] Image Parsing started with Ultra Preprocessing + Tesseract`);
  
  let worker;
  let processedPath;
  try {
    processedPath = await preprocessImage(filePath);
    
    worker = await Tesseract.createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          process.stdout.write(`\r[OCR] Local Fallback Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    // Use PSM 6 for sparse table/grid reading
    const result = await worker.recognize(processedPath, { rotateAuto: true }, { psm: 6 });
    process.stdout.write('\n');
    
    if (result.data && result.data.text) {
      console.log(`[OCR] Raw Text Length: ${result.data.text.length} chars. Snippet: "${result.data.text.substring(0, 50).replace(/\n/g, ' ')}..."`);
    }

    const data = result.data;
    let words = data.words;
    
    if ((!words || words.length === 0) && data.blocks) {
      words = [];
      data.blocks.forEach(block => {
        if (block.paragraphs) {
          block.paragraphs.forEach(para => {
            if (para.lines) {
              para.lines.forEach(line => {
                if (line.words) words.push(...line.words);
              });
            }
          } );
        }
      });
    }

    if (!words || words.length === 0) {
      console.error(`[OCR] Tesseract failed to extract words. Confidence: ${data.confidence}%`);
      throw new Error('Local OCR failed to extract text');
    }

    const imgWidth = data.imageWidth || 1280;
    console.log(`[OCR] Preprocessed width: ${imgWidth}. Words: ${words.length}. Confidence: ${data.confidence}%`);

    const dayMap = {
      'mo': 'Monday', 'tu': 'Tuesday', 'we': 'Wednesday', 'th': 'Thursday', 'fr': 'Friday', 'sa': 'Saturday',
      'mn': 'Monday', 'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday', 'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday',
      'm0': 'Monday', 'tv': 'Tuesday'
    };

    const detectedDays = words.filter(w => {
      const clean = w.text.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isDay = !!dayMap[clean] && w.bbox.x0 < imgWidth * 0.4;
      if (isDay) console.log(`[OCR] Found day candidate: "${w.text}" (${clean}) at x=${w.bbox.x0}`);
      return isDay;
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
        if (idx > 0 && gap > 50) { // Tighter gap for enlarged image
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

  const prompt = `Extract the current attendance counts for each subject from this university portal screenshot. 
Identify the subject name and the attendance fraction (e.g., 15/20) or "Attended: 15, Total: 20". 
Return ONLY a valid JSON object in this format:
{
  "attendance": [
    { "subject": "Subject Name/Code", "attended": 15, "total": 20 }
  ]
}`;

  try {
    const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

    const contents = [
      {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64,
        },
      },
      { text: prompt },
    ];

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        response_mime_type: "application/json",
      }
    });

    let text = response.text;
    text = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(text);
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
Current Data:
- Subjects: ${JSON.stringify(subjects.map(s => ({ name: s.name, attended: s.attended, total: s.total, req: s.requiredAttendance })))}
- Today's Schedule (${today}): ${JSON.stringify(timetable.find(t => t.day === today)?.slots || [])}

Task:
Generate a 2-sentence max "Daily Brief" for the user's dashboard.
Sentence 1: Focus on today's most important class (highest credit or highest risk). 
Sentence 2: A motivational or strategic tip based on their overall attendance.
Tone: Professional, encouraging, and slightly futuristic.

Return ONLY the plain text string.`;

  try {
    const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use stable flash for fast briefing

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error(`[AI Brief] Error:`, error);
    return `Stay focused today, ${name}! Your consistency is key to success.`;
  }
};

module.exports = { parseTimetableImage, syncPortalAttendance, generateDailyBriefing };
