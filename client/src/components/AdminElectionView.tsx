import { Box, Button, createStyles, Grid, NumberInput, Text, TextInput } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import React from "react";
import { Candidate, NullTime } from "../util/ElectionTypes";
import { CandidateList } from "./CandidateList";
import { DateTimeInput } from "./DateTime";
import Loading from "./Loading";

export interface ElectionFormValues {
  title: string,
  mandates: number,
  extraMandates: number,
  openTime: NullTime,
  closeTime: NullTime
}

export interface ChangedFormValues {
  title: boolean,
  mandates: boolean,
  extraMandates: boolean,
  openTime: boolean,
  closeTime: boolean
}

export interface AdminElectionViewProps {
  candidates: Candidate[],
  electionForm: UseFormReturnType<ElectionFormValues>,
  submitText: string,
  onSubmit: (values?: React.FormEvent<HTMLFormElement> | undefined) => void,
  onOpenTimeChanged: (value: NullTime) => void,
  onCloseTimeChanged: (value: NullTime) => void,
  onCandidateAdded: (candidate: Candidate) => void,
  onCandidateRemoved: (candidate: Candidate) => void,
  onCandidateChanged: (candidate: Candidate) => void,
  changedFormValues?: ChangedFormValues,
  userInputError: string | false,
  openTimeDefault?: NullTime,
  closeTimeDefault?: NullTime,
  submitDisabled?: boolean,
  submittedVotes?: number | null,
}

const useStyles = createStyles((theme) => {
  return {
    failed: {
      backgroundColor: "#e29493"
    }
  }
});

export const AdminElectionView: React.FC<AdminElectionViewProps> = ({
  submitText, onSubmit, electionForm,
  onCloseTimeChanged, onOpenTimeChanged, userInputError,
  candidates, onCandidateAdded, onCandidateRemoved, onCandidateChanged,
  openTimeDefault = null, closeTimeDefault = null, submitDisabled = false,
  submittedVotes
}) => {
  const { classes } = useStyles();

  return <>
    {
      userInputError &&
      <Box className={classes.failed} style={{
        borderRadius: "5pt",
        padding: "1rem",
        marginBottom: "1rem"
      }}>
        <Text align="center" fw={700}>
          {userInputError}
        </Text>
      </Box>
    }

    <Box sx={(theme) => ({
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2],
      padding: "1rem",
      borderRadius: "5pt"
    })}>

      <form onSubmit={onSubmit}>
        <Grid>
          <Grid.Col md={3}>
            <div style={{ marginBottom: "3rem" }} >
              <Text align="center" size="lg" color="gray.7" fw={700}>
                Election starts
              </Text>
              <DateTimeInput
                onChange={onOpenTimeChanged}
                defaultDate={openTimeDefault}
              />
            </div>

            <div style={{ marginBottom: "2rem" }} >
              <Text align="center" size="lg" color="gray.7" fw={700}>
                Election ends
              </Text>
              <DateTimeInput
                onChange={onCloseTimeChanged}
                defaultDate={closeTimeDefault}
              />
            </div>

            <div style={{ marginBottom: "2rem" }} >
              <Text align="center" size="lg" color="gray.7" fw={700}>
                Mandates
              </Text>
              <NumberInput width="3rem"
                {...electionForm.getInputProps("mandates")}
                min={1}
              />
            </div>

            <div style={{ marginBottom: "2rem" }} >
              <Text align="center" size="lg" color="gray.7" fw={700}>
                Secondary mandates
              </Text>
              <NumberInput
                {...electionForm.getInputProps("extraMandates")}
                min={0}
              />
            </div>

            <div>
              <Text size="lg" fw={700} align="center">
                Submitted votes
              </Text>
              <Text align="center">
                {submittedVotes ?? "-"}
              </Text>
            </div>
          </Grid.Col>


          <Grid.Col md={9}>

            <TextInput
              // class={failed ? classes.failed : "2"}
              placeholder="Election title"
              size="xl"
              {...electionForm.getInputProps("title")}
            />
            <br />
            <CandidateList
              candidates={candidates}
              onCandidateAdded={onCandidateAdded}
              onCandidateChanged={onCandidateChanged}
              onCandidateRemoved={onCandidateRemoved}
            />
          </Grid.Col>
          
          <Grid.Col md={12}>
            <Button type="submit" fullWidth disabled={submitDisabled}>
              <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                <Text fw={700} size="xl" >
                  {submitText}
                </Text>
              </div>
            </Button>
          </Grid.Col>
          
        </Grid>
      </form>
    </Box>
  </>;
}