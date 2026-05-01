const axios = require('axios');

const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  
  try {
    // using exchangerate-api free tier
    const response = await axios.get(`https://open.er-api.com/v6/latest/${fromCurrency}`);
    const rates = response.data.rates;
    
    if (rates && rates[toCurrency]) {
      const rate = rates[toCurrency];
      return parseFloat((amount * rate).toFixed(2));
    }
    return amount; // Fallback if currency not found
  } catch (error) {
    console.error('Exchange rate error:', error.message);
    return amount; // Fallback to original amount on failure
  }
};

module.exports = {
  convertCurrency,
};
