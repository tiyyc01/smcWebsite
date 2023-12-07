import React, { useEffect, useState } from "react";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Stack from "@mui/material/Stack";
import { Text } from "@nextui-org/react";

const fetchCourses = async () => {
  try {
    const response = await fetch("/api/fetchCourses");
    const data = await response.json();
    return data.results.map((record) => {
      let displayText = record.Name;

      // Check if "Week Day(s)" array is not empty before accessing its value
      if (record["Week Day(s)"] && record["Week Day(s)"].length > 0) {
        displayText += `, ${record["Week Day(s)"][0].value}`;
      }

      if (record["Meeting Time"]) {
        displayText += `, ${record["Meeting Time"]}`;
      }

      return { key: record.id, name: displayText };
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
};

const CourseSelectionInput = ({
  courseSelected,
  setCourseSelected,
  addCourse,
  setAddCourse,
  initialCourses,
  isUpdateMode,
}) => {
  const [courses, setCourses] = useState([]);
  const [debugSelectedCourses, setDebugSelectedCourses] = useState(); // Temporary state for debugging

  useEffect(() => {
    console.log('Initial Courses prop:', initialCourses); // Log the initialCourses prop

    const fetchData = async () => {
      const data = await fetchCourses();
      console.log('Fetched Courses:', data); // Log the fetched courses

      setCourses(data);

      if (isUpdateMode && initialCourses) {
        const selectedCourses = data.filter(course =>
          initialCourses.some(initialCourse => initialCourse.id === course.key)
        );

        console.log('Filtered Selected Courses:', selectedCourses); // Log the filtered selected courses

        // setCourseSelected(selectedCourses);
        setDebugSelectedCourses(selectedCourses); // Set the temporary state for debugging
        setAddCourse(selectedCourses.length > 0);
      }
    };

    fetchData();
  }, [isUpdateMode, initialCourses]);


  const handleCourseAssignmentChange = (event) => {
    setAddCourse(event.target.checked);
  };

  const handleCourseSelectionChange = (event, newCourses) => {
    setCourseSelected(newCourses);
    // setDebugSelectedCourses(newCourses)
  };

  const renderOption = (props, option, { selected }) => {
    const uncheckedIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
    const checkedIcon = <CheckBoxIcon fontSize="small" />;

    return (
      <li {...props}>
        <Checkbox
          icon={uncheckedIcon}
          checkedIcon={checkedIcon}
          checked={selected}
        />
        <Text>{option.name}</Text>
      </li>
    );
  };

  const renderInput = (params) => (
    <TextField
      className="w-full"
      {...params}
      variant="standard"
      label="Select course(s)"
      fullWidth
    />
  );

  console.log("CourseSelected state:", courseSelected);
  console.log("Debug SelectedCourses state:", debugSelectedCourses);

  return (
    <Stack>
      <FormControlLabel
        control={
          <Checkbox
            checked={addCourse}
            onChange={handleCourseAssignmentChange}
          />
        }
        label={<Text>Is this time slot for a course assignment?</Text>}
      />
      {addCourse && (
        <FormControl variant="standard" className="w-full">
          <Autocomplete
            multiple
            disableCloseOnSelect
            value={debugSelectedCourses}
            onChange={handleCourseSelectionChange}
            id="Search-for-course"
            options={courses}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.key === value.key}
            renderOption={renderOption}
            renderInput={renderInput}
          />
        </FormControl>
      )}
    </Stack>
  );
};

export default CourseSelectionInput;
