export declare const CANARY_STEPS: readonly [5, 25, 50, 100];
export declare const DEFAULT_THRESHOLDS: {
    readonly errorRate: 5;
    readonly p99Latency: 1000;
    readonly observationWindow: 120;
};
export declare const WORKER_CONFIG: {
    readonly evaluationIntervalMs: 10000;
    readonly defaultServiceTargetUrl: string;
};
export declare const API_CONFIG: {
    readonly port: number;
    readonly host: string;
    readonly corsOrigins: string[];
};
export declare const VALID_TRANSITIONS: Record<string, string[]>;
export declare const AGENT_CONFIG: {
    readonly confidenceThreshold: 0.8;
    readonly maxInvestigationDuration: 60;
    readonly model: string;
};
//# sourceMappingURL=index.d.ts.map