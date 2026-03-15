export class UpsertAssistantConfigDto {
  businessName!: string;
  businessDescription!: string;
  services!: string[];
  facts!: string[];
  contactPrompt?: string | null;
  tone?: string | null;
  language?: string | null;
  isActive?: boolean;
}
