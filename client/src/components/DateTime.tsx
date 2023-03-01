import React, { useEffect, useState } from "react";
import dayjs from "dayjs";

import { Grid, Indicator } from "@mantine/core";
import { DatePicker, TimeInput } from '@mantine/dates';
import { NullTime } from "../util/ElectionTypes";

const combineTimeAndDate = (time: NullTime, date: NullTime) => {
  if (!date) return null;
  if (!time) return date;

  const hour = dayjs(time).hour();
  const minute = dayjs(time).minute();
  const dateAndTime = dayjs(date).hour(hour).minute(minute);

  return dateAndTime.toDate();
}

export interface DateTimeInputProps {
  label?: React.ReactNode,
  onChange: (value: NullTime) => void
  defaultDate: NullTime
}

export const DateTimeInput: React.FC<DateTimeInputProps> = (
  { label, onChange, defaultDate }
) => {
  const [time, setTime] = useState<NullTime>(defaultDate);
  const [date, setDate] = useState<NullTime>(defaultDate);

  useEffect(() => { 
    setDate(defaultDate);
    setTime(defaultDate);
  }, [defaultDate]);
  
  useEffect(() => { 
    onChange(combineTimeAndDate(time, date)); 
  }, [time, date]);

  return <>
    <Grid align="flex-end" gutter={0}>
      <Grid.Col span={7}>
        <DatePicker
          placeholder="YYYY-MM-DD"
          inputFormat="YYYY-MM-DD"
          value={date}
          label={label}
          allowFreeInput
          onChange={(value) => setDate(value)}
          renderDay={(date) => {
            const today = dayjs(Date.now());
            return (
              <Indicator size={6} color="orange" offset = {8} disabled = {
                today.format("YYYYMMDD") != dayjs(date).format("YYYYMMDD")
              }>
                <div>{date.getDate()}</div>
              </Indicator>
            );
          }}
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