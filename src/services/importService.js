const fs = require('fs');
const pdfParse = require('pdf-parse');
const csvParser = require('csv-parser');
const openaiService = require('./openaiService');

const parsePDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      })
      .on('error', (err) => reject(err));
  });
};

const processStatement = async (filePath, mimeType, categories) => {
  let transactions = [];
  
  if (mimeType === 'application/pdf') {
    const text = await parsePDF(filePath);
    transactions = await openaiService.categorizeTransactions(text, categories);
  } else if (mimeType === 'text/csv' || mimeType === 'application/csv') {
    const csvData = await parseCSV(filePath);
    // Convert CSV JSON to string and ask OpenAI to categorize and clean it
    transactions = await openaiService.categorizeTransactions(JSON.stringify(csvData), categories);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or CSV.');
  }

  return transactions;
};

module.exports = {
  processStatement,
};
