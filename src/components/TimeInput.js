import React, { useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import { Button } from "@nextui-org/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const roundToNearestHalfHour = (date) => {
  const roundedMinutes = date.getMinutes() >= 30 ? 60 : 30;
  date.setMinutes(roundedMinutes);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};

const addHours = (date, hours) => {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
};

const useTimeSelection = (initialStartTime, initialEndTime) => {
  const [startDate, setStartDate] = useState(
    initialStartTime || roundToNearestHalfHour(new Date())
  );
  const [endDate, setEndDate] = useState(
    initialEndTime || addHours(initialStartTime || new Date(), 1)
  );

  useEffect(() => {
    if (!initialStartTime && !initialEndTime) {
      const roundedDate = roundToNearestHalfHour(new Date());
      setStartDate(roundedDate);
      setEndDate(addHours(roundedDate, 1));
    }
  }, [initialStartTime, initialEndTime]);

  const handleDateChange = (type, date) => {
    if (type === "start") {
      setStartDate(date);
      setEndDate(addHours(date, 1));
    } else {
      setEndDate(date);
    }
  };

  return { startDate, endDate, handleDateChange };
};

const filterTemporallyUnavailableGear = (
  gearList,
  startTimeSelected,
  endTimeSelected
) => {
  if (!Array.isArray(gearList)) {
    return [];
  }
  const startTime = new Date(startTimeSelected);
  const endTime = new Date(endTimeSelected);
  return gearList.filter((gear) => {
    if (!gear.eventStart || !gear.eventEnd) return true;

    return !gear.eventStart.some((eventStart, idx) => {
      const eventEnd = gear.eventEnd[idx];
      const eventStartDate = new Date(eventStart);
      const eventEndDate = new Date(eventEnd);

      return (
        (startTime >= eventStartDate && startTime < eventEndDate) ||
        (endTime > eventStartDate && endTime <= eventEndDate) ||
        (startTime <= eventStartDate && endTime >= eventEndDate)
      );
    });
  });
};

const DatePickerSection = ({ startDate, endDate, handleDateChange }) => {
  const filterEndTime = (time) => {
    if (startDate.toDateString() === time.toDateString()) {
      return time > startDate;
    }
    return true;
  };

  return (
    <div className="flex flex-col items-center w-full">
      <h4>Select Start Date</h4>
      <DatePicker
        showIcon
        showTimeSelect
        dateFormat="MMMM d, yyyy h:mmaa"
        timeFormat="HH:mm"
        selected={startDate}
        selectsStart
        startDate={startDate}
        endDate={endDate}
        onChange={(date) => handleDateChange("start", date)}
      />

      <h4>Select End Date</h4>
      <DatePicker
        showIcon
        showTimeSelect
        dateFormat="MMMM d, yyyy h:mmaa"
        timeFormat="HH:mm"
        selected={endDate}
        selectsEnd
        startDate={startDate}
        endDate={endDate}
        minDate={startDate}
        filterTime={filterEndTime}
        onChange={(date) => handleDateChange("end", date)}
      />
    </div>
  );
};

const NotificationSection = ({
  roomUnavailable,
  successMsg,
  handleClose,
  unavailableRoom,
}) => {
  return (
    <div>
      {roomUnavailable && (
        <Snackbar
          open={roomUnavailable}
          autoHideDuration={10}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity="error">
            {unavailableRoom} is not available at inputted time!
          </Alert>
        </Snackbar>
      )}
      {successMsg && (
        <Snackbar
          open={successMsg}
          autoHideDuration={500}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity="success">Room is available at inputted time</Alert>
        </Snackbar>
      )}
    </div>
  );
};

const DateTimeValidation = ({
  setTimeCorrect,
  setStartTimeSelected,
  setEndTimeSelected,
  roomBookingRecord,
  gearList,
  setFilteredGearList,
  initialStartTime,
  initialEndTime,
  isUpdateMode,
}) => {
  const [roomUnavailable, setRoomUnavailable] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [unavailableRoom, setUnavailableRoom] = useState("");
  const { startDate, endDate, handleDateChange } = useTimeSelection(
    initialStartTime,
    initialEndTime
  );

  useEffect(() => {
    if (isUpdateMode) {
      handleAvailabilityCheck();
    }
  }, [isUpdateMode, startDate, endDate, roomBookingRecord]);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSuccessMsg(false);
  };

  const handleAvailabilityCheck = () => {
    const startTime = startDate.toISOString();
    const endTime = endDate.toISOString();

    if (startTime > endTime) {
      setTimeCorrect(false);
      return;
    }
    setTimeCorrect(true);
    setStartTimeSelected(startTime);
    setEndTimeSelected(endTime);

    const conflictFound = checkRoomAvailability(
      startTime,
      endTime,
      roomBookingRecord
    );

    if (conflictFound) {
      setRoomUnavailable(true);
      setSuccessMsg(false);
      setTimeCorrect(false);
    } else {
      setRoomUnavailable(false);
      setSuccessMsg(true);
      setTimeCorrect(true);

      setFilteredGearList(
        filterTemporallyUnavailableGear(gearList, startTime, endTime)
      );
    }
  };

  const checkRoomAvailability = (startTime, endTime, roomBookingRecord) => {
    const realStartTime = new Date(startTime);
    const realEndTime = new Date(endTime);

    if (!roomBookingRecord) return false;

    return roomBookingRecord.some((record) => {
      if (!record.eventStart || !record.eventEnd || !record.eventStatus)
        return false;

      return record.eventStart.some((eventStart, idx) => {
        if (record.eventStatus[idx].value.value !== "Booked ✅") return false;

        const eventStartDate = new Date(eventStart.value); // Convert to Date object
        const eventEndDate = new Date(record.eventEnd[idx].value); // Convert to Date object

        // Check if the new booking start or end time falls within an existing booking
        const isStartWithinEvent =
          realStartTime >= eventStartDate && realStartTime < eventEndDate;
        const isEndWithinEvent =
          realEndTime > eventStartDate && realEndTime <= eventEndDate;

        // Check if the new booking completely overlaps an existing booking
        const isOverlappingEvent =
          realStartTime <= eventStartDate && realEndTime >= eventEndDate;

        if (isStartWithinEvent || isEndWithinEvent || isOverlappingEvent) {
          setUnavailableRoom(record.name);
          return true;
        }
        return false;
      });
    });
  };

  return (
    <div>
      <Stack>
        <DatePickerSection
          startDate={startDate}
          endDate={endDate}
          handleDateChange={handleDateChange}
        />
      </Stack>

      <div className="flex justify-center items-center my-4">
        <Button
          shadow
          bordered
          color="warning"
          auto
          onClick={handleAvailabilityCheck}
          className="z-0"
        >
          check availability
        </Button>
      </div>

      <NotificationSection
        roomUnavailable={roomUnavailable}
        successMsg={successMsg}
        handleClose={handleClose}
        unavailableRoom={unavailableRoom}
      />
    </div>
  );
};

export default DateTimeValidation;
