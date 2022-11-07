import React, { useEffect, useState } from "react";
import dayjs from "dayjs";

import { Grid } from "@mantine/core";
import { DatePicker, TimeInput } from '@mantine/dates';

export type NullTime = Date | null

const combineTimeAndDate = (time: NullTime, date: NullTime) => {
  if (!date) return null;
  if (!time) return date;

  const hour = dayjs(time).hour();
  const minute = dayjs(time).minute();
  const dateAndTime = dayjs(date).hour(hour).minute(minute);

  return dateAndTime.toDate();
}

export interface DateTimeInputProps {
  label: string,
  onChange: (value: NullTime) => void
  defaultDate: NullTime
}

export const DateTimeInput: React.FC<DateTimeInputProps> = ({ label, onChange, defaultDate }) => {
  const [value, setValue] = useState<NullTime>(defaultDate)
  const [time, setTime] = useState<NullTime>(value)
  const [date, setDate] = useState<NullTime>(value)

  useEffect(() => { onChange(value) }, [value])
  useEffect(() => {
    setValue(combineTimeAndDate(time, date))
  }, [time, date])

  return <>
    <Grid align="flex-end" gutter={0}>
      <Grid.Col span={7}>
        <DatePicker
          placeholder="YYYY-MM-DD"
          inputFormat="YYYY-MM-DD"
          value={date}
          label={label}
          onChange={(value) => setDate(value)}
        />
      </Grid.Col>
      <Grid.Col span={5}>
        <TimeInput
          clearable
          placeholder="HH:MM"
          value={time}
          onChange={(value) => setTime(value)}
        />
      </Grid.Col>
    </Grid>
  </>
}