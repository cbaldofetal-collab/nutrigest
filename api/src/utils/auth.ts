export const generateToken = (payload: any): string => {
  // Mock token generation for now
  return 'mock-token-' + Date.now();
};

export const verifyToken = (token: string): any => {
  // Mock token verification
  if (token.startsWith('mock-token-')) {
    return { id: '1', email: 'user@example.com' };
  }
  throw new Error('Invalid token');
};

export const hashPassword = async (password: string): Promise<string> => {
  // Mock password hashing
  return 'hashed-' + password;
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  // Mock password comparison
  return hashedPassword === 'hashed-' + password;
};

export const generateTokens = (payload: any): { accessToken: string; refreshToken: string } => {
  // Mock token generation
  return {
    accessToken: 'mock-access-token-' + Date.now(),
    refreshToken: 'mock-refresh-token-' + Date.now()
  };
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isStrongPassword = (password: string): boolean => {
  return password.length >= 8;
};