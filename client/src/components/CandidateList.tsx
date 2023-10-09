import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid"

import { Button, Center, createStyles, ScrollArea, Table, Text, TextInput } from "@mantine/core";
import { useDebouncedState } from "@mantine/hooks";
import { Plus, X } from "tabler-icons-react";

import { Candidate } from "../util/ElectionTypes"

const useStyles = createStyles((theme) => {
  return {
    changed: {
      backgroundColor: "#e2e19380"
    },
    row: {
      backgroundColor: theme.colors.gray[1]
    },
    add: {
      // borderTop: "2px solid " + theme.colors.gray[4]
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
  const { classes, cx } = useStyles();
  const [name, setName] = useState("");
  const [presentation, setPresentation] = useState("");

  const addCandidate = () => {
    onCandidateAdded({
      id: `tmp_${uuidv4()}`,
      name: name,
      presentation: presentation,
      symbolic: false,
    });
    setName("");
    setPresentation("");
  };

  // const candidateElements = candidates.map((candidate) => (
  //   <CandidateRow candidate={candidate} onCandidateChanged={onCandidateChanged} onCandidateRemoved={onCandidateRemoved} />
  // ));

  const addCandidateRow = <>
    <tr className={cx(classes.row, classes.add)} key="new-candidate">
      <td><Button compact fullWidth onClick={addCandidate}>
        <Plus />
      </Button></td>
      <td>
        <TextInput 
          value={name}
          placeholder="Alternativ"
          onChange={(element) => setName(element.target.value)}
        />
      </td>
      <td>
        <TextInput 
          value={presentation} 
          placeholder="beskrivning (optional)"
          onChange={(element) => setPresentation(element.target.value)}
        />
      </td>
    </tr>
  </>;

  return <>
    <ScrollArea>


      <Text fw={700} c="gray.7" style={{ margin: "0.5rem", marginTop: "1rem" }} align="center">
        Lägg till alternativ
      </Text>

      <Table withBorder withColumnBorders>
        <thead>
          <tr>
            <td style={{ width: 30 }}></td>
            <td />
            <td />
          </tr>
        </thead>

        <tbody>
          {addCandidateRow}
        </tbody>

      </Table>
      <br />

      <Table withBorder withColumnBorders>
        <thead>
          <tr key="head" className={ classes.row }>
            <th style={{ width: 30 }}></th>
            <th>
              <Text style={{ margin: "1rem" }} align="center" fw={700}>
                Alternativ
              </Text>
            </th>
            <th>
              <Text style={{ margin: "1rem" }} align="center" fw={700}>
                Beskrivning
              </Text>
            </th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <CandidateRow
              candidate={candidate}
              onCandidateChanged={onCandidateChanged}
              onCandidateRemoved={onCandidateRemoved}
            />
          ))}
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
  const { classes } = useStyles();

  useEffect(() => {
    onCandidateChanged({
      ...candidate,
      name: name,
      presentation: presentation,
    })
  }, [name, presentation])

  return <>
    <tr key={candidate.id} className={ candidate.changed ? classes.changed : classes.row }>
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
