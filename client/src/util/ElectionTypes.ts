import { z } from "zod"

export type NullTime = Date | null

export const CandidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  presentation: z.string(),
  symbolic: z.boolean(),
  changed: z.boolean().optional(),
  added: z.boolean().optional(),
  removed: z.boolean().optional(),
});

export type Candidate = z.infer<typeof CandidateSchema>;

export const ElectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  mandates: z.number(),
  extraMandates: z.number(),
  openTime: z.date().nullable(),
  closeTime: z.date().nullable(),
  candidates: z.array(CandidateSchema),
  finalized: z.boolean(),
});

export type Election = z.infer<typeof ElectionSchema>;

export const ElectionResultResponseSchema = z.object({
  ranking: z.array(CandidateSchema),
  voteMatrix: z.array(z.array(z.number())),
  totalVotes: z.number(),
  schultzeMatrix: z.array(z.array(z.number())),
});

export type ElectionResultResponse = z.infer<typeof ElectionResultResponseSchema>;

export const createEmptyElection = (): Election => {
  return {
    id: "",
    name: "",
    description: "",
    mandates: 1,
    extraMandates: 0,
    openTime: null,
    closeTime: null,
    candidates: [],
    finalized: false,
  }
};


export const electionMock = (): Election => {
  return {
    id: "fd9d7c4a-ee20-4b63-ae44-cc5760f3d493",
    name: "test",
    description: "thing",
    mandates: 1,
    extraMandates: 1,
    openTime: new Date("2022-10-30T00:14:31Z"),
    closeTime: new Date("2023-10-30T00:14:31Z"),
    finalized: false,
    candidates: [
      {
        id: "724619af-aa6b-4299-ae25-5307904d8636",
        name: "adsfasdfasdfasdfasdfadsfadfsafasdfsadf",
        presentation: "https://dsekt.se/data",
        symbolic: false,
      },
      {
        id: "937e4bfe-d0e7-4390-b73e-e36219e838a4",
        name: "adsf2",
        presentation: "https://dsekt.se/niklas",
        symbolic: false
      },
      {
        id: "asdfasfd-d0e7-4390-b73e-e36219e838a4",
        name: "Vakant",
        presentation: "",
        symbolic: true
      },
      {
        id: "sadfasdf-d0e7-4390-b73e-e36219e838a4",
        name: "Blank",
        presentation: "",
        symbolic: true
      }
    ]
  }
}



export const parseElectionResponse = (data: any):Election => {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    mandates: data.mandates,
    extraMandates: data.extraMandates,
    openTime: data.openTime == null ? null : new Date(data.openTime),
    closeTime: data.closeTime == null ? null : new Date(data.closeTime),
    candidates: data.candidates,
    finalized: data.finalized,
  }
} 