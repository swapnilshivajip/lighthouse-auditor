import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';

/**
 * Generate random UUID.
 */
export const getRandomUUID = (): string => {
    const uniqueId: string = uuidv4();
    logger.debug(`Generated UUID: ${uniqueId}`);
    return uniqueId;
} 

/**
 * Generate random integer value in given range of min and max integer limit.
 * @param min minimum limit
 * @param max maximum limit
 */
export const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
    logger.info(`Random integer between ${min} and ${max}: ${randomInt}`);
    return randomInt;
}