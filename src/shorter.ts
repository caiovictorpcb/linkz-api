import { createHash } from 'crypto';

// Generate unique string
export const gerarStringUnica = (): string => {
  const alfabeto = "0123456789abcdefghijklmnopqrstuvwxyz"; // Base 36

  while (true) {
    // Use nanoseconds for more granularity (similar to time.time_ns())
    const base = Date.now() * 1000000 + Math.floor(Math.random() * 1000000);
    // Generate MD5 hash and take first 6 characters
    const hashVal = createHash('md5')
      .update(base.toString())
      .digest('hex')
      .slice(0, 6);
    
    // Convert hex to base36 string
    const novaString = Array.from(hashVal)
      .map(c => alfabeto[parseInt(c, 16) % 36])
      .join('');

    // Ensure mix of letters and numbers
    const hasDigit = /[0-9]/.test(novaString);
    const hasAlpha = /[a-z]/.test(novaString);
    
    if (hasDigit && hasAlpha) {
      return novaString;
    }
    // Loop continues if condition not met
  }
};