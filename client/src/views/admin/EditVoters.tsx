import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
    })
  }, [])

  return <div>
    <Grid>
      <Grid.Col xs={6}>
        <AddVotersField disabled={!adminWrite} />
      </Grid.Col>

      <Grid.Col xs={6}>
        <VotersTable voters={voters} setVoters={setVoters} />
      </Grid.Col>
    </Grid>
  </div>
}

interface AddVotersFieldProps {
  disabled: boolean
}

const AddVotersField: React.FC<AddVotersFieldProps> = ({disabled}) => {
  const {authHeader} = useAuthorization()
  return <div>
    
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