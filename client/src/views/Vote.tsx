import React from "react";
import { Header } from "methone"
import { Voting } from "../components/Voting";
import { useParams } from "react-router-dom";
import { useAPIData } from "../hooks/useAxios";
import { ElectionSchema, parseElectionResponse } from "../util/ElectionTypes";
import { LoadingContainer } from "../components/Loading";
import { Container, createStyles } from "@mantine/core";

const useStyles = createStyles((theme) => ({
  box: {
    background: theme.colors.gray[2],
    padding: "1rem",
    paddingTop: 0,
    borderRadius: "3px",
  }
}));

const Vote: React.FC = () => {
  const electionID = useParams()["id"] ?? "";
  const [electionData, electionLoading, electionError] = useAPIData(
    `/api/election/public/${electionID}`,
    (data) => ElectionSchema.parseAsync(parseElectionResponse(data))
  )
  const { classes } = useStyles();

  // console.log(electionData);
  return <>
    <Header title={electionData?.name ?? "Loading election"}/>
    <Container my={"xl"}>
      <LoadingContainer error={electionError} loading={electionLoading}>
        {electionData &&
          <div className={classes.box}>
            <Voting election={electionData} />
          </div>
        }
      </LoadingContainer>
      
    </Container>
  </>
}

export default Vote;