export interface InstructionData {
    instruction: string;
    documentation: string;
    key: string;
    description: string;
    sve?: true;
}

export interface InstructionDetail {
    instruction: string;
    encdetail: string;
}
