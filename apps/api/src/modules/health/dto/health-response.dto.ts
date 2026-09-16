import { ApiProperty } from '@nestjs/swagger';

export class ComponentHealth {
  @ApiProperty({ enum: ['up', 'down'] })
  status!: 'up' | 'down';

  @ApiProperty({ required: false, example: 12 })
  latencyMs?: number;

  @ApiProperty({ required: false, example: 'connection refused' })
  error?: string;
}

export class HealthResponse {
  @ApiProperty({ enum: ['ok', 'degraded'] })
  status!: 'ok' | 'degraded';

  @ApiProperty({ example: '2026-09-17T00:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 3600 })
  uptime!: number;

  @ApiProperty({ type: ComponentHealth })
  components!: Record<'database' | 'redis' | 'rabbitmq', ComponentHealth>;
}
