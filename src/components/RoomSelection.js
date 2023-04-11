import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import base from "./airtable";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

// This will be used to store input data
let userRoomType;
let userRoomSelection;
//const roomTypes = [];
//var disabledRoomTypes;

const roomTypes = [
  "Recording Studio 🎙️",
  "Rehearsal Spaces 🎧",
  "Edit & Collaboration Spaces 🎒",
];

// Variables to used for API filtering
let roomOptionsAllInfo = [];
let roomSelectedAllInfo = [];
let eventsList = [];

export default function RoomSelectionInput({
  roomOptionStudio,
  roomOptionRehearsal,
  roomOptionECspace,
  disabledRoomTypes,
  setRoomTypeSelected,
  setRoomSelected,
  roomBookingRecord,
  setRoomBookingRecord,
}) {
  const [roomType, setRoomType] = React.useState("");
  const [room, setRoom] = React.useState([]);

  const [isStudio, setIsStudio] = React.useState(false);
  const [isRehearsal, setIsRehearsal] = React.useState(false);
  const [isECspace, setIsECspace] = React.useState(false);

  const handleChangeRoomType = (event) => {
    const {
      target: { value },
    } = event;
    setRoomType(
      // On autofill, we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
    userRoomType = value;
    setRoomTypeSelected(value);

    if (userRoomType === "Recording Studio 🎙️") {
      roomOptionsAllInfo = roomOptionStudio;
      setIsStudio(true);
      setIsRehearsal(false);
      setIsECspace(false);
      setRoom([]); // Clear user input
    } else if (userRoomType === "Rehearsal Spaces 🎧") {
      roomOptionsAllInfo = roomOptionRehearsal;
      setIsStudio(false);
      setIsRehearsal(true);
      setIsECspace(false);
      setRoom([]); // Clear user input
    } else if (userRoomType === "Edit & Collaboration Spaces 🎒") {
      roomOptionsAllInfo = roomOptionECspace;
      setIsStudio(false);
      setIsRehearsal(false);
      setIsECspace(true);
      setRoom([]); // Clear user input
    }
  };

  const handleChangeRoom = (event) => {
    const {
      target: { value },
    } = event;
    setRoom(
      // On autofill, we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
    userRoomSelection = value;
    setRoomSelected(value);

    //GENERATING ARRAY WITH ALL INFO ON ROOM SELECTED
    const valueLength = value.length;
    const roomOptionsLength = roomOptionsAllInfo.length;
    roomSelectedAllInfo = [];

    for (let i = 0; i < valueLength; i++) {
      for (let x = 0; x < roomOptionsLength; x++) {
        if (roomOptionsAllInfo[x].name === value[i])
          roomSelectedAllInfo.push(roomOptionsAllInfo[x]);
      }
    }

    ///////////////////   API Magic   ////////////////////////////////

    //Crawling all rooms to find associated events whose recordIDs are stored in eventsList[]
    const roomSelectedAllInfoLength = roomSelectedAllInfo.length;
    eventsList = [];
    let eventsListLength = 0;
    for (let j = 0; j < roomSelectedAllInfoLength; j++) {
      base("Rooms").find(roomSelectedAllInfo[j].key, function (err, record) {
        if (err) {
          return;
        }
        eventsList.push({
          name: record.get("Name"),
          id: record.id,
          eventStart: record.get("Events Start"),
          eventEnd: record.get("Events End"),
          eventStatus: record.get("Events Status"),
        });
        eventsListLength++;
      });
    }
    setRoomBookingRecord(eventsList);
  };

  useEffect(() => {
    if (roomBookingRecord.length !== 0) {
    }
  }, [roomBookingRecord]);

  const handleDelete = (e, value) => {
    e.preventDefault();
    setRoom((current) => _without(current, value));
    setRoomSelected((current) => _without(current, value));
  };

  const roomSelectionStudio = (
    <FormControl variant="standard" sx={{ m: 1, width: 400 }}>
      <InputLabel>Select studio room(s)</InputLabel>
      <Select
        variant="standard"
        labelId="event-multiple-selection"
        id="event-multiple-chip"
        value={room}
        onChange={handleChangeRoom}
        multiple
        renderValue={(selected) => (
          <Box>
            {selected.map((value) => (
              <Chip
                key={value}
                label={value}
                onDelete={(e) => handleDelete(e, value)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
              />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {roomOptionStudio.map((option) => (
          <MenuItem key={option.key} value={option.name}>
            <Checkbox checked={room.indexOf(option.name) > -1} />
            {option.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const roomSelectionRehearsal = (
    <FormControl variant="standard" sx={{ m: 1, width: 400 }}>
      <InputLabel id="demo-multiple-chip-label">
        Select rehearsal room(s)
      </InputLabel>
      <Select
        variant="standard"
        labelId="event-multiple-selection"
        id="event-multiple-chip"
        value={room}
        onChange={handleChangeRoom}
        multiple
        input={
          <OutlinedInput
            id="select-multiple-chip"
            label="Select rehearsal room(s)"
          />
        }
        renderValue={(selected) => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selected.map((value) => (
              <Chip
                key={value}
                label={value}
                onDelete={(e) => handleDelete(e, value)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
              />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {roomOptionRehearsal.map((option) => (
          <MenuItem key={option.key} value={option.name}>
            <Checkbox checked={room.indexOf(option.name) > -1} />
            {option.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const roomSelectionECspace = (
    <FormControl variant="standard" sx={{ m: 1, width: 400 }}>
      <InputLabel id="demo-multiple-chip-label">
        Select Edit & Collaboration room(s)
      </InputLabel>
      <Select
        labelId="event-multiple-selection"
        id="event-multiple-chip"
        value={room}
        onChange={handleChangeRoom}
        multiple
        renderValue={(selected) => (
          <Box>
            {selected.map((value) => (
              <Chip
                key={value}
                label={value}
                onDelete={(e) => handleDelete(e, value)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
              />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {roomOptionECspace.map((option) => (
          <MenuItem key={option.key} value={option.name}>
            <Checkbox checked={room.indexOf(option.name) > -1} />
            {option.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <div>
      <Stack spacing={1} sx={{ p: 2 }}>
        <div>
          <FormControl fullWidth variant="standard">
            <InputLabel id="event-type-label" sx={{ color: "white" }}>
              Room Type
            </InputLabel>
            <Select
              value={roomType}
              onChange={handleChangeRoomType}
              renderValue={(selected) => (
                <Box>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {roomTypes.map((type) => (
                <MenuItem
                  key={type}
                  value={type}
                  disabled={disabledRoomTypes.indexOf(type) > -1}
                >
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div>
          {isStudio && roomSelectionStudio}
          {isRehearsal && roomSelectionRehearsal}
          {isECspace && roomSelectionECspace}
        </div>
      </Stack>
    </div>
  );
}
