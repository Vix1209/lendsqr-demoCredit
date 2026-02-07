import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AdjutorKarmaLookupResponse } from '../../common/types/karma-lookup.types';
import { BlacklistStatus } from '../../tables/blacklist.table';

export type BlacklistCheckResult = {
  status: BlacklistStatus;
  payload: AdjutorKarmaLookupResponse;
};

@Injectable()
export class BlacklistService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  // Check karma for a given BVN using the Adjutor API
  async checkKarmaByBvn(bvn: string): Promise<BlacklistCheckResult> {
    const payload = await this.lookupKarma(bvn);
    const status =
      payload.status === 'success' && payload.data
        ? BlacklistStatus.Blacklisted
        : payload.status === 'success'
          ? BlacklistStatus.Clear
          : BlacklistStatus.Error;

    return {
      status,
      payload: this.redactIdentity(payload),
    };
  }

  // Lookup karma for a given identity using the Adjutor API
  private async lookupKarma(
    identity: string,
  ): Promise<AdjutorKarmaLookupResponse> {
    const baseUrl =
      this.configService.get<string>('ADJUTOR_BASE_URL') ??
      'https://adjutor.lendsqr.com/v2';
    const apiKey =
      this.configService.get<string>('ADJUTOR_API_KEY') ??
      process.env.ADJUTOR_API_KEY;

    if (!apiKey) {
      return {
        status: 'error',
        message: 'Missing Adjutor API key',
        data: null,
      };
    }

    const url = `${baseUrl.replace(/\/$/, '')}/verification/karma/${encodeURIComponent(
      identity,
    )}`;
    console.log('url', url);

    try {
      const response = await firstValueFrom(
        this.httpService.get<AdjutorKarmaLookupResponse>(url, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }),
      );
      const payload = response.data;
      console.log('payload', payload);
      if (!payload) {
        return {
          status: 'error',
          message: 'Invalid response from Adjutor',
          data: null,
        };
      }
      return payload;
    } catch (_error) {
      return {
        status: 'error',
        message: 'Adjutor request failed',
        data: null,
      };
    }
  }

  // Redact the identity from the response payload to avoid exposing sensitive information
  private redactIdentity(
    payload: AdjutorKarmaLookupResponse,
  ): AdjutorKarmaLookupResponse {
    if (!payload.data) {
      return payload;
    }

    return {
      ...payload,
      data: {
        ...payload.data,
        karma_identity: 'redacted',
      },
    } as AdjutorKarmaLookupResponse;
  }
}
