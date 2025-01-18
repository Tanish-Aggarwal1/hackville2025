app.post('/api/recommendations', async (req, res) => {
  const { location, houseType, roomType, priceRange, squareFeet, sharing } = req.body;

  try {
    const prompt = `
      Based on these preferences:
      Location: ${location}, 
      House Type: ${houseType}, 
      Room Type: ${roomType}, 
      Price Range: ${priceRange}, 
      Square Feet: ${squareFeet}, 
      Sharing: ${sharing}, 
      suggest a list of suitable house listings with details like title, location, price, and description.
    `;

    const aiResponse = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer YOUR_API_KEY`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 200,
      }),
    });

    const data = await aiResponse.json();
    const listings = data.choices[0].text.split('\n').filter(Boolean);
    res.json({ listings });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating listings');
  }
});
