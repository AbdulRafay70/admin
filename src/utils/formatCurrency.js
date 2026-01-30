/**
 * Format a number as currency (PKR by default)
 * @param {number|string} amount - The amount to format
 * @param {string} currency - The currency code (default: 'PKR')
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = 'PKR') => {
    if (amount === null || amount === undefined) return 'Rs. 0';

    // Convert to number
    const num = parseFloat(amount);

    if (isNaN(num)) return 'Rs. 0';

    return `Rs. ${num.toLocaleString('en-PK', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`;
};
