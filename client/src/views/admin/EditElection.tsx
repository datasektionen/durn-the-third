import React, { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { Header } from "methone";

import { Container, Grid, TextInput, Text, Button, NumberInput, Box, createStyles, Center } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useListState } from "@mantine/hooks";

import { Candidate, Election, NullTime } from "../../util/ElectionTypes";
import { DateTimeInput } from "../../components/DateTime";
import { CandidateList } from "../../components/CandidateList";
import useAuthorization from "../../hooks/useAuthorization";
import { useNavigate, useParams } from "react-router-dom";
import { useAPIData } from "../../hooks/useAxios";
// import EditElection from "./OldEditElection"

// import DateTimePicker from "react-datetime-picker"
// import DateTimeInput from "react-admin";

const useStyles = createStyles((theme) => {
  return {
    failed: {
      backgroundColor: "#e29493"
    }
  }
});

const EditElection: React.FC = () => {
  const { authHeader } = useAuthorization();
  const { classes } = useStyles();
  const navigate = useNavigate();
  const [error, setError] = useState<String | null>(null);
  const [loading, setLoading] = useState(true);
  const electionId = useParams()["id"] ?? "";
  const [electionData, loadingData, fetchError] = useAPIData(`/api/election/${electionId}`);
  const [candidates, candidatesHandler] = useListState<Candidate>();
  const [removedCandidates, removedCandidatesHandler] = useListState<string>();
  const [editedCandidates, editedCandidatesHandler] = useListState<Candidate>();
  const form = useForm({
    initialValues: {
      title: "",
      mandates: 1,
      extraMandates: 0,
      openTime: null as NullTime,
      closeTime: null as NullTime,
    }
  });

  useEffect(()=> {
    console.log(electionData);
    if (!loadingData && !fetchError) {
      form.setValues({
        title: electionData.name,
        mandates: electionData.mandates,
        extraMandates: electionData.extraMandates,
        openTime: electionData.OpenTime,
        closeTime: electionData.CloseTime,
      });
      candidatesHandler.setState(electionData.candidates);
      setLoading(false);
    }
  }, [electionData, loadingData, fetchError]);

  const changeOpenTime = (value: NullTime) => {
    form.setFieldValue("openTime", value)
  }
  const changeCloseTime = (value: NullTime) => {
    form.setFieldValue("closeTime", value)
  }

  const addCandidate = (candidate: Candidate) => {
    candidatesHandler.append({
      ...candidate,
      id: `tmp_${uuidv4()}`,
      changed: true,
    });
  };

  const removeCandidate = (candidate: Candidate) => {
    console.log(candidate)
    removedCandidatesHandler.append(candidate.id);
  };

  const candidateChanged = (candidate: Candidate) => {
    candidatesHandler.applyWhere(
      (item) => item.id == candidate.id,
      () => ({
        ...candidate,
        changed: false,
      }),
    )
  };

  const submitElection = useCallback((values: typeof form.values) => {
    axios.post("/api/election/create", {
      name: values.title,
      mandates: values.mandates,
      extraMandates: values.extraMandates,
      openTime: values.openTime,
      closeTime: values.closeTime,
    }, {
      headers: authHeader
    }).then(({ data }) => {
      Promise.all(
        candidates.map((candidate) =>
          axios.post(`/api/election/${data}/candidate/add`, {
            name: candidate.name,
            presentation: candidate.presentation,
          }, { headers: authHeader }))
      ).then(() => {
        navigate(`/admin/election/${data}`);
      })
    }).catch(() => { });
  }, [candidates, candidateChanged, removedCandidates])

  const onSubmit = useCallback(form.onSubmit((values) => {
    const now = new Date(Date.now());
    if (values.title == "") {
      setError("Title can't be empty");
    } else if (values.closeTime && !values.openTime) {
      setError("The end of the election can't be set without setting the start");
    } else if (values.openTime && values.openTime <= now) {
      setError("The start of the election can't be before the current time")
    } else if (
      values.openTime && values.closeTime &&
      values.closeTime <= values.openTime
    ) {
      setError("The end of the election can't be before the start");
    } else {
      submitElection(values);
    }
  }), [setError, form]);


  const content = <Container my="md">
    {error &&
      <Box className={classes.failed} style={{
        borderRadius: "5pt",
        padding: "1rem",
        marginBottom: "1rem"
      }}>
        <Text align="center" fw={700}>
          {error}
        </Text>
      </Box>
    }

    <Box sx={(theme) => ({
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2],
      padding: "1rem",
      borderRadius: "5pt"
    })}>

      <form onSubmit={onSubmit}>

        <Grid align="cent">
          <Grid.Col md={12}>
            <Button type="submit" fullWidth>
              <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                <Text fw={700} size="xl" >
                  Save Changes
                </Text>
              </div>
            </Button>
          </Grid.Col>

          <Grid.Col md={3}>
            <div style={{ marginBottom: "3rem" }} >
              <Text align="center" size="lg" color="dimmed" fw={700}>
                Election starts
              </Text>
              <DateTimeInput
                onChange={changeOpenTime}
                defaultDate={null}
              />
            </div>

            <div style={{ marginBottom: "2rem" }} >
              <Text align="center" size="lg" color="dimmed" fw={700}>
                Election ends
              </Text>
              <DateTimeInput
                onChange={changeCloseTime}
                defaultDate={null}
              />
            </div>

            <div style={{ marginBottom: "2rem" }} >
              <Text align="center" size="lg" color="dimmed" fw={700}>
                Mandates
              </Text>
              <NumberInput
                {...form.getInputProps("mandates")}
                min={1}
              />
            </div>

            <div style={{ marginBottom: "2rem" }} >
              <Text align="center" size="lg" color="dimmed" fw={700}>
                Secondary mandates
              </Text>
              <NumberInput
                {...form.getInputProps("extraMandates")}
                min={0}
              />

            </div>
          </Grid.Col>


          <Grid.Col md={9}>

            <TextInput
              // class={failed ? classes.failed : "2"}
              placeholder="Election title"
              size="xl"
              {...form.getInputProps("title")}
            />
            <br />
            <CandidateList
              candidates={
                candidates.filter(v => !removedCandidates.includes(v.id))
              }
              onCandidateAdded={addCandidate}
              onCandidateChanged={candidateChanged}
              onCandidateRemoved={removeCandidate}
            />
          </Grid.Col>
          <Grid.Col>

          </Grid.Col>
        </Grid>
      </form>
    </Box>
  </Container>

  return <>
    <Header title="Editing Election" />
    {!loading && content}
    {loading && <Center> loading </Center>}
    {!loading && error && <Center> Error </Center>}
  </>
}

export default EditElection;