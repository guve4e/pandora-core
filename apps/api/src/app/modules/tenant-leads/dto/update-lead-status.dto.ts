export class UpdateLeadStatusDto {
  status!: 'new' | 'contacted' | 'scheduled' | 'won' | 'lost';
}
