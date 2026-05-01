const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const categorizeTransactions = async (transactionsText, categories) => {
  try {
    const prompt = `
    You are a financial categorizer. Given the following raw text from a bank statement, extract all transactions and categorize them.
    Available categories (ID: Name - Type):
    ${categories.map(c => `${c.id}: ${c.name} - ${c.type}`).join('\n')}

    Raw Text:
    ${transactionsText}

    Extract each transaction and output ONLY a JSON array of objects.
    Each object must have:
    - "date": YYYY-MM-DD
    - "description": clean description of the transaction
    - "amount": positive number
    - "is_refund": boolean (true if money is coming in but it's an expense refund, or just false)
    - "category_id": integer ID of the best matching category from the list above, or null if absolutely unknown
    - "type": "income" or "expense"
    - "currency": string (e.g. "USD", guess from context or default to "USD")
    
    Output strictly JSON, no markdown formatting.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // using gpt-4o as default
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    let content = response.choices[0].message.content.trim();
    if (content.startsWith('\`\`\`json')) {
      content = content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI Categorize Error:', error);
    return [];
  }
};

const detectAnomalies = async (transactions) => {
  try {
    const prompt = `
    You are a financial anomaly detector. Review the following recent transactions and identify any unusual spending patterns, anomalies, or suspicious activities.
    
    Transactions:
    ${JSON.stringify(transactions, null, 2)}

    Output ONLY a JSON array of anomaly objects.
    Each object must have:
    - "transaction_id": the id of the suspicious transaction (if tied to one)
    - "reason": detailed explanation of why it is an anomaly
    - "severity": "low", "medium", or "high"

    Output strictly JSON, no markdown formatting. If no anomalies, return an empty array [].
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    let content = response.choices[0].message.content.trim();
    if (content.startsWith('\`\`\`json')) {
      content = content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI Anomaly Error:', error);
    return [];
  }
};

module.exports = {
  categorizeTransactions,
  detectAnomalies,
};
