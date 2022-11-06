import axios from "axios";
import React, { useEffect, useState } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "methone"

import { createStyles, Grid } from "@mantine/core";

import useAuthorization from "../../hooks/useAuthorization";

const useStyles = createStyles((theme) => {{

}})

const EditVoters: React.FC = () => {
  const {adminRead, adminWrite, authHeader} = useAuthorization()
  const navigate = useNavigate()
  const [voters, setVoters] = useState<string[]>([])

  // if (!adminRead) {
  //   navigate("/")
  // }

  useEffect(() => {
    axios("/api/voters", {
      headers: authHeader
    }).then((res) => {
      setVoters(res.data.voters)
    }).catch((error) => {
      console.log(error.body)
    })
  }, [authHeader])

  return <>
    <Header title="Manage voters" />
    <div>
      <Container my="md">
        <Grid>
          <Grid.Col>
            <Info />
          </Grid.Col>

          <Grid.Col xs={6}>
            <AddVotersField disabled={!adminWrite} setVoters={setVoters}/>
          </Grid.Col>

          <Grid.Col xs={6}>
            <VotersTable voters={voters} setVoters={setVoters} />
          </Grid.Col>
        </Grid>
      </Container>
    </div>
  </>
}

const Info: React.FC = () => {
  return <Skeleton height={300} animate={false} />
}

interface AddVotersFieldProps {
  disabled: boolean,
  setVoters: (voters: string[]) => void
}

const AddVotersField: React.FC<AddVotersFieldProps> = ({disabled, setVoters}) => {
  return <div>
    <h3 className={classes.sectionTitle}>
      Add voters
    </h3>
  </div>
}

interface VotersTableProps {
  voters: string[]
  setVoters: (voters: string[]) => void
}

const VotersTable: React.FC<VotersTableProps> = ({voters, setVoters}) => {
  return <div>
    
  </div>
}


export default EditVoters