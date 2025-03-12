import { nanoid } from 'nanoid';

// Generate unique string
export const gerarStringUnica = (): string => {
  return nanoid(6)
};