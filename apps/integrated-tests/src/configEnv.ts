import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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