const crypto = require('crypto');

function generateBaseCpf(name, birthDate, identityNumber) {
    /**
     * Convert user identity (name + birth date + identity number) into a deterministic 9-digit CPF base.
     */
    const uniqueString = `${name.toLowerCase().replace(/\s/g, '')}${birthDate.replace(/-/g, '')}${identityNumber}`;
    const hash = crypto.createHash('md5').update(uniqueString).digest('hex');
    const numericHash = hash.replace(/\D/g, '').slice(0, 9); // Extract first 9 digits
    return numericHash.padStart(9, '0'); // Ensure 9 digits
}

function calculateCpfCheckDigits(cpfBase) {
    /**
     * Compute the two CPF check digits using the modulo 11 rule.
     */
    function calculateDigit(numbers, weightStart) {
        let total = 0;
        for (let i = 0; i < numbers.length; i++) {
            total += parseInt(numbers[i]) * (weightStart - i);
        }
        const remainder = total % 11;
        return remainder < 2 ? '0' : (11 - remainder).toString();
    }

    const firstDigit = calculateDigit(cpfBase, 10);
    const secondDigit = calculateDigit(cpfBase + firstDigit, 11);

    return firstDigit + secondDigit;
}

function generateCpf(name, birthDate, identityNumber) {
    /**
     * Generate a CPF from user identity.
     */
    const cpfBase = generateBaseCpf(name, birthDate, identityNumber);
    const checkDigits = calculateCpfCheckDigits(cpfBase);
    return `${cpfBase.slice(0, 3)}.${cpfBase.slice(3, 6)}.${cpfBase.slice(6, 9)}-${checkDigits}`;
}

module.exports = {
    generateCpf
};
