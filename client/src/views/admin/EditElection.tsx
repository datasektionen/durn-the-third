import React, { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { Header } from "methone";

import { Container, createStyles, Center } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useListState } from "@mantine/hooks";

import { Candidate, Election, ElectionSchema, NullTime, parseElectionResponse } from "../../util/ElectionTypes";
import useAuthorization from "../../hooks/useAuthorization";
import { useNavigate, useParams } from "react-router-dom";
import { useAPIData } from "../../hooks/useAxios";
import { AdminElectionView, ElectionFormValues } from "../../components/AdminElectionView";

const useStyles = createStyles((theme) => {
  return {
    failed: {
      backgroundColor: "#e29493"
    }
  }
});

const EditElection: React.FC = () => {
  const { authHeader } = useAuthorization();
  const navigate = useNavigate();
  const [userInputError, setError] = useState<string | false>(false);
  const [loading, setLoading] = useState(true);
  const electionId = useParams()["id"] ?? "";
  const [electionData, loadingData, fetchError] = useAPIData<Election>(
    `/api/election/${electionId}`,
    ElectionSchema,
  );
  const [candidates, candidatesHandler] = useListState<Candidate>();
  const [removedCandidates, removedCandidatesHandler] = useListState<string>();

  const electionForm = useForm<ElectionFormValues>({
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
      electionForm.setValues({
        title: electionData.name,
        mandates: electionData.mandates,
        extraMandates: electionData.extraMandates,
        openTime: electionData.OpenTime,
        closeTime: electionData.CloseTime,
      });
      candidatesHandler.setState(
        electionData.candidates.filter((c: Candidate) => !c.symbolic)
          .map((c: Candidate) => ({
            ...c,
            changed: false,
          }))
      );
      setLoading(loadingData);
    }
  }, [electionData, loadingData, fetchError]);

  const changeOpenTime = (value: NullTime) => {
    electionForm.setFieldValue("openTime", value)
  }
  const changeCloseTime = (value: NullTime) => {
    electionForm.setFieldValue("closeTime", value)
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

  const changeCandidate = (candidate: Candidate) => {
    candidatesHandler.applyWhere(
      (item) => item.id == candidate.id && (
        item.name != candidate.name ||
        item.presentation != candidate.presentation
      ),
      () => ({
        ...candidate,
        changed: true,
      }),
    )
  };

  const saveElection = useCallback((values: typeof electionForm.values) => {
    axios.post(`/api/election/${electionId}/edit`, {
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
  }, [candidates, changeCandidate, removedCandidates])

  const submitElectionForm = useCallback(electionForm.onSubmit((values) => {
    if (values.title == "") {
      setError("Title can't be empty");
    } else if (values.closeTime && !values.openTime) {
      setError("The end of the election can't be set without setting the start");
    } else if (
      values.openTime && values.closeTime &&
      values.closeTime <= values.openTime
    ) {
      setError("The end of the election can't be before the start");
    } else {
      saveElection(values);
    }
  }), [setError, electionForm]);


  return <>
    <Header title="Editing Election" />
    <Container my="md">
      {loading && <Center> loading </Center>}
      {!loading && fetchError && <Center> Error </Center>}
      {!loading && !fetchError &&
        <AdminElectionView 
          candidates={candidates.filter(c => !removedCandidates.includes(c.id))}
          onCandidateAdded={addCandidate}
          onCandidateChanged={changeCandidate}
          onCandidateRemoved={removeCandidate}
          electionForm={electionForm}
          onOpenTimeChanged={changeOpenTime}
          onCloseTimeChanged={changeCloseTime}
          onSubmit={submitElectionForm}
          submitText="Save Changes"
          userInputError={userInputError}
          openTimeDefault={electionData.openTime ?? null} // null if undefined
          closeTimeDefault={electionData.closeTime ?? null}
        />
      }
    </Container>
  </>
}

export default EditElection;
