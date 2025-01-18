const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

const roommates = [
    {
        name: 'Alice',
        age: 25,
        gender: 'Female',
        nationality: 'American',
        employmentType: 'Student',
        relationshipStatus: 'Single',
        cleanliness: 'Clean',
        description: 'Friendly and quiet.'
    },
    {
        name: 'Bob',
        age: 30,
        gender: 'Male',
        nationality: 'Canadian',
        employmentType: 'Professional',
        relationshipStatus: 'Married',
        cleanliness: 'Messy',
        description: 'Outgoing and social.'
    },
    // Add more mock data as needed
];

app.post('/api/find-roommates', (req: any, res: any) => {
    const { gender, nationality, employmentType, ageRange, relationshipStatus, cleanliness } = req.body;

    const filteredRoommates = roommates.filter(roommate => {
        return (
            (!gender || roommate.gender === gender) &&
            (!nationality || roommate.nationality === nationality) &&
            (!employmentType || roommate.employmentType === employmentType) &&
            (!ageRange || (roommate.age >= ageRange[0] && roommate.age <= ageRange[1])) &&
            (!relationshipStatus || roommate.relationshipStatus === relationshipStatus) &&
            (!cleanliness || roommate.cleanliness === cleanliness)
        );
    });

    res.json(filteredRoommates);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});