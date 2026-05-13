import { IAnticaptureClient } from './anticapture-client';
export declare const noopAnticaptureClient: IAnticaptureClient;
export declare function makeAnticaptureClient(overrides?: Partial<IAnticaptureClient>): IAnticaptureClient;
