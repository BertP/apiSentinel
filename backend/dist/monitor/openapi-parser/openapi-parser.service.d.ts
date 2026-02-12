export declare class OpenapiParserService {
    private readonly logger;
    parseDefinition(filePath: string): Promise<any>;
    extractEndpoints(api: any): any[];
}
