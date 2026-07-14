export interface Actor {
  name: string;
  isPlayer?: boolean;
  id?: number;
  index?: number;
  /** Optional tick-chart row label override (dev previews). */
  chartLabel?: string;
}
