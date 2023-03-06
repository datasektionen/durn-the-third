import React, { useCallback, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import axios from "axios"
import { Header } from "methone"

import { Container, createStyles } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useListState } from "@mantine/hooks"

import { Candidate, NullTime } from "../../util/ElectionTypes"
import useAuthorization from "../../hooks/useAuthorization"
import { useNavigate } from "react-router-dom"
import { AdminElectionView, ElectionFormValues } from "../../components/AdminElectionView"

const useStyles = createStyles((theme) => ({
  failed: {
    backgroundColor: "#e29493"
  }
}));

export const CreateElection: React.FC = () => {
  const { authHeader } = useAuthorization();
  const { classes } = useStyles();
  const navigate = useNavigate();
  const [ error, setError ] = useState<string|false>(false);

  const form = useForm<ElectionFormValues>({
    initialValues: {
      title: "",
      mandates: 1,
      extraMandates: 0,
      openTime: null as NullTime,
      closeTime: null as NullTime,
    }
  });

  const [candidates, candidatesHandler] = useListState<Candidate>();
  const [removedCandidates, removedCandidatesHandler] = useListState<string>();

  const changeOpenTime = (value: NullTime) => {
    form.setFieldValue("openTime", value);
  }
  const changeCloseTime = (value: NullTime) => {
    form.setFieldValue("closeTime", value);
  }

  const addCandidate = (candidate: Candidate) => {
    candidatesHandler.append({
      ...candidate,
      id: `tmp_${uuidv4()}`, 
      changed: false,
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
      setError("The end of the election can't be before the start")
    } else {
      submitElection(values);
    }
  }), [setError, form]);
  

  return <>
    <Header title="Create New Election" />

    <Container my="md">
      <AdminElectionView
        candidates={candidates}
        submitText="Create Election"
        electionForm={form}
        onSubmit={onSubmit}
        onOpenTimeChanged={changeOpenTime}
        onCloseTimeChanged={changeCloseTime}
        onCandidateAdded={addCandidate}
        onCandidateRemoved={removeCandidate}
        onCandidateChanged={candidateChanged}
        userInputError={error}
        openTimeDefault={null}
        closeTimeDefault={null}
      />
    </Container>
  </>
}