const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Anthropic } = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const supabase = require('./supabase');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize APIs
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({
  origin: [
    'https://handsome-charm-production.up.railway.app',
    'http://localhost:8081',
    'http://localhost:3000',
    'http://localhost:19006',
    'http://localhost:19007',
    'http://localhost:19008',
    'http://localhost:19000',
    'exp://localhost:19000'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
}).single('audio');

// Helper function for transcription
async function transcribeAudio(filepath) {
  try {
    console.log('Starting transcription for:', filepath);
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filepath),
      model: "whisper-1",
      language: "en"
    });

    console.log('Transcription completed');
    return transcription.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

// Helper function for summarization
async function summarizeText(text) {
  try {
    console.log('Starting summarization');
    
    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Please provide a clear and concise summary of the following transcribed audio. 
                  Focus on the main points and key takeaways: ${text}`
      }]
    });

    console.log('Summarization completed');
    return message.content[0].text;
  } catch (error) {
    console.error('Summarization error:', error);
    throw new Error(`Summarization failed: ${error.message}`);
  }
}

// Middleware to verify Supabase JWT
const authenticateUser = async (req, res, next) => {
  console.log('Auth headers:', req.headers);
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('No auth header present');
    return res.status(401).json({ error: 'No authorization header' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.log('Supabase auth error:', error);
      throw error;
    }
    
    req.user = user;
    console.log('User authenticated:', user.email);
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Protected route for summarization
app.post('/api/summarize', authenticateUser, (req, res) => {
  console.log('Summarize endpoint hit');
  upload(req, res, async function(err) {
    console.log('Processing upload');
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    try {
      console.log('Processing file:', req.file.filename);

      // Step 1: Transcribe the audio
      const transcription = await transcribeAudio(req.file.path);
      console.log('Transcription complete');

      // Step 2: Summarize the transcription
      const summary = await summarizeText(transcription);
      console.log('Summary complete');

      // Step 3: Clean up - delete the uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });

      // Send response
      res.json({
        status: 'success',
        summary: summary,
        transcription: transcription,
        fileInfo: {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });

    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({ 
        error: 'Error processing audio',
        details: error.message 
      });

      // Clean up on error
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
    }
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});