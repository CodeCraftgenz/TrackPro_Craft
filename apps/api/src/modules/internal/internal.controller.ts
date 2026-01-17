import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';

import { InternalService } from './internal.service';

interface ValidateApiKeyBody {
  apiKey: string;
}

@Controller('internal')
export class InternalController {
  constructor(private readonly internalService: InternalService) {}

  @Post('validate-api-key')
  @HttpCode(HttpStatus.OK)
  async validateApiKey(
    @Headers('x-internal-secret') internalSecret: string,
    @Body() body: ValidateApiKeyBody,
  ) {
    // Validate internal request
    this.internalService.validateInternalRequest(internalSecret);

    const result = await this.internalService.validateApiKey(body.apiKey);

    if (!result) {
      throw new NotFoundException('API key not found or inactive');
    }

    return result;
  }
}
