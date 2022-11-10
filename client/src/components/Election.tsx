import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createStyles, Modal } from "@mantine/core";

import constants from "../util/constants";
import { Election } from "../util/ElectionTypes";

const useStyle = createStyles((theme) => {
  return {
    electionTitle: {
      fontFamily: "lato",
      marginTop: "0",
      marginBottom: "0",
      backgroundColor: "#eeeeee",
      padding: "0.8rem",
      borderRadius: "0.2rem",
      overflowWrap: "break-word"
    },
    electionBox: {
      boxShadow: "1px 1px 2px 2px rgba(0,0,0,0.15)",
      position: "relative",
      padding: "1rem",
      borderRadius: "0.2rem",
      ":hover": {
        boxShadow: "0 0 6px 6px rgba(0,0,150,0.15)",
        position: "relative",
        padding: "1rem",
        borderRadius: "0.2rem",
      }
    },
    candidateText: {
      marginTop: "1.6rem",
      marginLeft: "1rem",
    }, 
    electionDescription: {
      marginTop: "1.6rem",
      marginLeft: "1rem",
    }
  }
})

interface DisplayElectionInfoProps {
  election: Election,
  ModalContent?: React.FC<{ election: Election }>
  redirectURL?: string
}

export const DisplayElectionInfo: React.FC<DisplayElectionInfoProps> = (
  {election, ModalContent, redirectURL}
) => {
  const { classes, cx } = useStyle()
  const [opened, setOpened] = useState(false)
  const navigate = useNavigate()

  const onDivClick = useCallback(() => {
    if (ModalContent) {
      setOpened(true)
    } else if (redirectURL) {
      navigate(redirectURL)
    }
  }, [ModalContent, election, redirectURL])


  return <>
    {ModalContent &&
      <Modal centered
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <h2>{election.name}</h2>
        }
        closeOnClickOutside={false}
        overlayOpacity={0.2}
        size="600px"
      >
        <ModalContent election={election} />
      </Modal>
    }
    <div
      className={cx(constants.themeColor, "lighten-4", classes.electionBox)}
      onClick={onDivClick}
    >
      
      <div className={classes.electionTitle}>
        <h3 className={classes.electionTitle}>{election.name}</h3>
      </div>
      <p className={classes.electionDescription}>
        {election.description}
      </p>
      <p className={classes.candidateText}>
        {`${election.candidates.filter((c) => !c.symbolic).length } kandidater`}
      </p>
    </div>
  </>
}