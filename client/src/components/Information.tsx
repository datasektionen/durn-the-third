import React, { useEffect, useState } from "react";
import { Modal } from "@mantine/core";

export const ErrorModal: React.FC<
  { error: string, opened: boolean, onClose: () => void }
> = ({error, opened, onClose}) => {
  return <Modal opened={opened} onClose={onClose} centered title={"Error"}
    styles={{ modal: { backgroundColor: "#ffcccb" } }}
  >
    <div>
      {error}
    </div>
  </Modal>
}

export const InformationModal: React.FC<
  { info: string, opened: boolean, onClose: () => void }
> = ({info, opened, onClose}) => {
  return <Modal opened={opened} onClose={onClose} centered>
    {info}
  </Modal>
}