import React, { useEffect, useState } from "react";
import { Modal } from "@mantine/core";

export const ErrorModal: React.FC<
  { error: string | JSX.Element, opened: boolean, onClose: () => void }
> = ({error, opened, onClose}) => {
  return <Modal opened={opened} onClose={onClose} centered title={"Error"}
    styles={{ modal: { backgroundColor: "#ffcccb" } }}
  >
    <div style={{textAlign: "center"}}>
      {error}
    </div>
  </Modal>
}

export const InformationModal: React.FC<
  { info: string | JSX.Element, opened: boolean, onClose: () => void }
> = ({info, opened, onClose}) => {
  return <Modal opened={opened} onClose={onClose} centered>
    <div style={{ textAlign: "center" }}>
      {info}
    </div>
  </Modal>
}