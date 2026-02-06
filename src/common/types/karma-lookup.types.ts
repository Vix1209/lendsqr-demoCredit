export type AdjutorKarmaLookupIdentity = string;

export type AdjutorKarmaLookupRequest = {
  identity: AdjutorKarmaLookupIdentity;
};

export type AdjutorKarmaLookupResponse = {
  status: string;
  message: string;
  data: AdjutorKarmaRecord | null;
  meta?: AdjutorResponseMeta | null;
  error_code?: number;
};

export type AdjutorKarmaRecord = {
  karma_identity: string;
  amount_in_contention: string | null;
  reason: string | null;
  default_date: string | null;
  karma_type: {
    karma: string | null;
  };
  karma_identity_type: {
    identity_type: string | null;
  };
  reporting_entity: {
    name: string | null;
    email: string | null;
  };
};

export type AdjutorResponseMeta = {
  cost: number;
  balance: number;
};
