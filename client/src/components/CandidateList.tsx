import { Button, createStyles, ScrollArea, Table, Text, TextInput } from "@mantine/core";
import { useDebouncedState } from "@mantine/hooks";
import React, { useCallback, useEffect, useState } from "react";
import { Plus, X } from "tabler-icons-react";
import { Candidate } from "../util/ElectionTypes"

const useStyles = createStyles((theme) => {
  return {
    changed: {
      backgroundColor: "#e2e19380"
    },
    adding: {
      backgroundColor: theme.colors.gray[1]
    },

    info: {
      padding: "3rem",
      marginBottom: "1rem",
      borderRadius: "0.5rem",
      backgroundColor: "rgb(197, 202, 233)",
    }
  }
});


export interface CandidateListProps {
  candidates: Candidate[]
  onCandidateAdded: (candidate: Candidate) => void
  onCandidateChanged: (candidate: Candidate) => void
  onCandidateRemoved: (candidate: Candidate) => void
}

export const CandidateList: React.FC<CandidateListProps> = (
  { candidates, onCandidateAdded, onCandidateChanged, onCandidateRemoved }
) => {
  const { classes } = useStyles();
  const [name, setName] = useState("");
  const [presentation, setPresentation] = useState("");

  const addCandidate = () => {
    onCandidateAdded({
      id: "",
      name: name,
      presentation: presentation,
      symbolic: false,
      changed: true,
    });
    setName("");
    setPresentation("");
  };

  // const candidateElements = candidates.map((candidate) => (
  //   <CandidateRow candidate={candidate} onCandidateChanged={onCandidateChanged} onCandidateRemoved={onCandidateRemoved} />
  // ));

  const addCandidateRow = <>
    <tr className={classes.adding} key="new-candidate">
      <td><Button compact fullWidth onClick={addCandidate}>
        <Plus />
      </Button></td>
      <td>
        <TextInput 
          value={name}
          onChange={(element) => setName(element.target.value)}
        />
      </td>
      <td>
        <TextInput 
          value={presentation} 
          placeholder="länk till kandidatpresentation"
          onChange={(element) => setPresentation(element.target.value)}
        />
      </td>
    </tr>
  </>;

  return <>
    <ScrollArea>
      <Table withBorder withColumnBorders>
        <thead>
          <tr key="head">
            <th style={{ width: 30 }}></th>
            <th>
              <Text style={{ margin: "1rem" }} align="center">
                Kandidatens namn
              </Text>
            </th>
            <th>
              <Text style={{ margin: "1rem" }} align="center">
                Kandidatpresentation
              </Text>
            </th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <CandidateRow candidate={candidate} onCandidateChanged={onCandidateChanged} onCandidateRemoved={onCandidateRemoved} />
          ))}
          {addCandidateRow}
        </tbody>
      </Table>
    </ScrollArea>
  </>
};

interface CandidateRowProps {
  candidate: Candidate,
  onCandidateChanged: (candidate: Candidate) => void
  onCandidateRemoved: (candidate: Candidate) => void
}

const CandidateRow: React.FC<CandidateRowProps> = (
  { candidate, onCandidateChanged, onCandidateRemoved }
) => {
  const [name, setName] = useDebouncedState(candidate.name, 500);
  const [
    presentation, 
    setPresentation
  ] = useDebouncedState(candidate.presentation, 500);
  const { classes, cx } = useStyles();

  console.log(candidate);

  useEffect(() => {
    onCandidateChanged({
      ...candidate,
      name: name,
      presentation: presentation,
      changed: true,
    })
  }, [name, presentation])

  return <>
    <tr key={candidate.id} className={candidate.changed ? classes.changed : "" }>
      <td>
        <Button color={"red"} compact fullWidth onClick={
          () => onCandidateRemoved(candidate)
        }>
          <X />
        </Button>
      </td>
      <td>
        <TextInput
          defaultValue={candidate.name}
          key={`name-${candidate.id}`}
          onChange={(element) => setName(element.target.value)}
        />
      </td>
      <td>
        <TextInput
          defaultValue={candidate.presentation}
          key={`pres-${candidate.id}`}
          onChange={(element) => setPresentation(element.target.value)}
        />
      </td>
    </tr>
  </>
};