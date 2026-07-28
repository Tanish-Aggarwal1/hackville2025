import React, { useState } from 'react';
import { IonListHeader, IonInput, IonSelect, IonSelectOption, IonRange, IonButton, IonList, IonItem, IonLabel } from '@ionic/react';
import axios from 'axios';

interface RoommateResult {
    name: string;
    age: number;
    gender: string;
    nationality: string;
    employmentType: string;
    relationshipStatus: string;
    cleanliness: string;
    description: string;
}

const RoommateFinder: React.FC = () => {
    const [gender, setGender] = useState<string>('');
    const [nationality, setNationality] = useState<string>('');
    const [employmentType, setEmploymentType] = useState<string>('');
    const [ageRange, setAgeRange] = useState<{ lower: number, upper: number }>({ lower: 18, upper: 35 });
    const [relationshipStatus, setRelationshipStatus] = useState<string>('');
    const [cleanliness, setCleanliness] = useState<string>('');
    const [results, setResults] = useState<RoommateResult[]>([]);

    const findRoommates = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/roommates', {
                gender,
                nationality,
                employmentType,
                ageRange,
                relationshipStatus,
                cleanliness
            });
            setResults(response.data);
        } catch (error) {
            console.error('Error fetching roommates:', error);
        }
    };

    // Rendered inside Tab2's IonPage, so this must not declare a page of its own.
    return (
        <>
            <IonList>
                <IonListHeader>
                    <IonLabel>Roommate Finder</IonLabel>
                </IonListHeader>
                <IonItem>
                    <IonLabel>Gender</IonLabel>
                    <IonSelect value={gender} placeholder="Select Gender" onIonChange={e => setGender(e.detail.value)}>
                        <IonSelectOption value="Male">Male</IonSelectOption>
                        <IonSelectOption value="Female">Female</IonSelectOption>
                    </IonSelect>
                </IonItem>
                <IonItem>
                    <IonLabel>Nationality</IonLabel>
                    <IonInput value={nationality} placeholder="Enter Nationality" onIonChange={e => setNationality(e.detail.value as string)} />
                </IonItem>
                <IonItem>
                    <IonLabel>Employment Type</IonLabel>
                    <IonSelect value={employmentType} placeholder="Select Employment Type" onIonChange={e => setEmploymentType(e.detail.value)}>
                        <IonSelectOption value="Student">Student</IonSelectOption>
                        <IonSelectOption value="Professional">Professional</IonSelectOption>
                    </IonSelect>
                </IonItem>
                <IonItem>
                    <IonLabel>Age Range</IonLabel>
                    <IonRange min={18} max={60} step={1} dualKnobs={true} value={ageRange} pin={true}  onIonChange={e => setAgeRange(e.detail.value as { lower: number, upper: number })} />
                </IonItem>
                <IonItem>
                    <IonLabel>Relationship Status</IonLabel>
                    <IonSelect value={relationshipStatus} placeholder="Select Relationship Status" onIonChange={e => setRelationshipStatus(e.detail.value)}>
                        <IonSelectOption value="Single">Single</IonSelectOption>
                        <IonSelectOption value="Married">Married</IonSelectOption>
                    </IonSelect>
                </IonItem>
                <IonItem>
                    <IonLabel>Cleanliness</IonLabel>
                    <IonSelect value={cleanliness} placeholder="Select Cleanliness" onIonChange={e => setCleanliness(e.detail.value)}>
                        <IonSelectOption value="Clean">Clean</IonSelectOption>
                        <IonSelectOption value="Messy">Messy</IonSelectOption>
                    </IonSelect>
                </IonItem>
            </IonList>
            <IonButton expand="block" onClick={findRoommates}>Find Roommates</IonButton>
            <IonList>
                {results.map((roommate, index) => (
                    <IonItem key={index}>
                        <IonLabel>
                            <h2>{roommate.name}</h2>
                            <p>Age: {roommate.age}</p>
                            <p>Gender: {roommate.gender}</p>
                            <p>Nationality: {roommate.nationality}</p>
                            <p>Employment Type: {roommate.employmentType}</p>
                            <p>Relationship Status: {roommate.relationshipStatus}</p>
                            <p>Cleanliness: {roommate.cleanliness}</p>
                            <p>Description: {roommate.description}</p>
                        </IonLabel>
                    </IonItem>
                ))}
            </IonList>
        </>
    );
};

export default RoommateFinder;
