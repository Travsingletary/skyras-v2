export type AgentTool<Input = unknown, Output = unknown> = (input: Input) => Promise<Output>;

export interface AgentDefinition<TTools extends Record<string, AgentTool<any, any>>> {
  name: string;
  instructions: string;
  tools: TTools;
}

export type AgentFactory<TTools extends Record<string, AgentTool<any, any>>> = () => AgentDefinition<TTools>;
