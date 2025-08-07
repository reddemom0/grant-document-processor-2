// api/extract-pdf.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const PDF_API_KEY = 'writers@granted.ca_DlmgQCx0A0AH2aXmnPsjlp7o3FXERSoD4aw7Ax4BINCQaJ6rTevInrw7A1VEYxcw';
    
    // Get file from request body (base64)
    const { fileData, fileName } = req.body;
    
    if (!fileData) {
      res.status(400).json({ error: 'No file data provided' });
      return;
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');
    
    // Create form data for PDF.co
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', buffer, fileName || 'document.pdf');

    // Call PDF.co API
    const fetch = require('node-fetch');
    const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
      method: 'POST',
      headers: {
        'x-api-key': PDF_API_KEY,
        ...form.getHeaders()
      },
      body: form
    });

    if (!response.ok) {
      throw new Error(`PDF.co API error: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.status !== 'success') {
      throw new Error(`PDF extraction failed: ${result.message || 'Unknown error'}`);
    }

    // Fetch the extracted text
    const textResponse = await fetch(result.url);
    
    if (!textResponse.ok) {
      throw new Error('Failed to fetch extracted text');
    }

    const extractedText = await textResponse.text();

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the PDF');
    }

    // Return the extracted text
    res.status(200).json({ 
      success: true, 
      text: extractedText,
      charCount: extractedText.length 
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
