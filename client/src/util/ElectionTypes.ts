

export type NullTime = Date | null

export interface Candidate {
  id: string,
  name: string,
  presentation: string,
  symbolic: boolean
}

export interface Election {
  id: string,
  name: string,
  description: string,
  published: boolean,
  finalized: boolean,
  openTime: NullTime,
  closeTime: NullTime,
  candidates: Candidate[],
}

export const createEmptyElection = () => {
  return {
    id: "",
    name: "",
    description: "",
    published: false,
    finalized: false,
    openTime: null,
    closeTime: null,
    candidates: [],
  }
}

export const electionMock = (): Election => {
  return {
    id: "fd9d7c4a-ee20-4b63-ae44-cc5760f3d493",
    name: "test",
    description: "thing",
    published: true,
    finalized: false,
    openTime: new Date("2022-10-30T00:14:31Z"),
    closeTime: new Date("2023-10-30T00:14:31Z"),
    candidates: [
      {
        id: "724619af-aa6b-4299-ae25-5307904d8636",
        name: "adsfasdfasdfasdfasdfadsfadfsafasdfsadf",
        presentation: "https://dsekt.se/data",
        symbolic: false
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
    published: data.published,
    finalized: data.finalized,
    openTime: data.openTime == null ? null : new Date(data.openTime),
    closeTime: data.closeTime == null ? null : new Date(data.closeTime),
    candidates: data.candidates
  }
} 