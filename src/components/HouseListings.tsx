import React, { useState } from "react";

const HouseListings = () => {
  const [showForm, setShowForm] = useState(false);
  const [preferences, setPreferences] = useState({
    location: "",
    houseType: "",
    roomType: "",
    priceRange: "",
    squareFeet: "",
    sharing: "",
  });
  const [listings, setListings] = useState([{
    title: "",
    location: "",
    price: "",
  }]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setPreferences({ ...preferences, [name]: value });
  };

  const fetchListings = async () => {
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        const data = await response.json();
        setListings(data.listings); // Update with AI-generated listings
      } else {
        console.error("Failed to fetch listings");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    fetchListings(); // Fetch AI-powered results
  };

  return (
    <div>
      <h1>Filter Options</h1>
      <div className="filter-buttons">
        {/* Add more buttons here for other shapes */}
        <button onClick={() => setShowForm(true)}>House Listings</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <h2>Enter Your Preferences</h2>

          <label>
            Location:
            <input
              type="text"
              name="location"
              value={preferences.location}
              onChange={handleInputChange}
            />
          </label>
          <br />

          <label>
            Type of House:
            <select
              name="houseType"
              value={preferences.houseType}
              onChange={handleInputChange}
            >
              <option value="">Select</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Basement">Studio</option>
              <option value="Condo">Studio</option>
              <option value="">Studio</option>
            </select>
          </label>
          <br />

          <label>
            Type of Room:
            <select
              name="roomType"
              value={preferences.roomType}
              onChange={handleInputChange}
            >
              <option value="">Select</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Master">Master</option>
            </select>
          </label>
          <br />

          <label>
            Price Range:
            <input
              type="text"
              name="priceRange"
              value={preferences.priceRange}
              onChange={handleInputChange}
              placeholder="e.g., 500-3000"
            />
          </label>
          <br />

          <label>
            Square Feet:
            <input
              type="number"
              name="squareFeet"
              value={preferences.squareFeet}
              onChange={handleInputChange}
            />
          </label>
          <br />

          <label>
            Sharing or Private:
            <div>
              <label>
                <input
                  type="radio"
                  name="sharing"
                  value="Shared"
                  onChange={handleInputChange}
                />
                Shared
              </label>
              <label>
                <input
                  type="radio"
                  name="sharing"
                  value="Private"
                  onChange={handleInputChange}
                />
                Private
              </label>
            </div>
          </label>
          <br />

          <button type="submit">Get Listings</button>
        </form>
      )}

      <h2>AI-Generated Listings</h2>
      <ul>
        {listings.map((listing, index) => (
          <li key={index}>
            {listing.title} - {listing.location} - {listing.price}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HouseListings;
