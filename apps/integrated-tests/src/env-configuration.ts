import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

/**
 * Loads service-specific environment variables for integration tests.
 * 
 * This function reads environment configuration from service-specific .env files
 * located in the 'envs/' directory and combines them with essential system
 * environment variables (PATH and HOME that are needed to run the services as child processes).
 */
export function getServiceEnv(service: string): NodeJS.ProcessEnv {
    const essentialEnv = {
        PATH: process.env.PATH,
        HOME: process.env.HOME
    };
    const envFilePath = path.resolve(__dirname, `envs/${service}.env`);
    const envConfig = dotenv.parse(fs.readFileSync(envFilePath));
    return {
        ...essentialEnv,
        ...envConfig
    };
} 