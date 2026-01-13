import Anthropic from '@anthropic-ai/sdk';

export async function analyzeFood(req, res) {
  try {
    const { image, mimeType, foodName, amount } = req.body;

    if (!image && !foodName) {
      return res.status(400).json({ error: 'No image or food name provided' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    let messageContent;

    if (image) {
      // Image-based analysis
      messageContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType || 'image/jpeg',
            data: image,
          },
        },
        {
          type: 'text',
          text: `Analyze this image of food and provide nutrition information.

Please respond in the following JSON format only, with no additional text:
{
  "foodName": "Name of the dish",
  "description": "Brief description of the dish and its typical ingredients",
  "servingSize": "Estimated serving size shown",
  "nutrition": {
    "calories": <number>,
    "protein": <number in grams>,
    "carbohydrates": <number in grams>,
    "fat": <number in grams>,
    "fiber": <number in grams>
  },
  "confidence": "high/medium/low"
}

If this is not food at all, respond with:
{
  "error": "Please upload an image of food"
}

Important: In the description, only describe the dish and its ingredients. Do NOT mention or comment on what cuisine or region the dish is from.

Provide your best estimates for a typical serving of this dish.`,
        },
      ];
    } else {
      // Text-based analysis
      messageContent = [
        {
          type: 'text',
          text: `Provide nutrition information for: "${foodName}" with quantity: "${amount}".

Please respond in the following JSON format only, with no additional text:
{
  "foodName": "${foodName}",
  "description": "Brief description of the dish and its typical ingredients",
  "servingSize": "${amount}",
  "nutrition": {
    "calories": <number>,
    "protein": <number in grams>,
    "carbohydrates": <number in grams>,
    "fat": <number in grams>,
    "fiber": <number in grams>
  },
  "confidence": "high/medium/low"
}

Important: In the description, only describe the dish and its ingredients. Do NOT mention or comment on what cuisine or region the dish is from.

Make sure the nutrition values are scaled appropriately for the specified quantity.`,
        },
      ];
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
    });

    const content = response.content[0].text;

    // Parse the JSON response
    let nutritionData;
    try {
      // Extract JSON from the response (handle potential markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nutritionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return res.status(500).json({ error: 'Failed to parse nutrition data' });
    }

    if (nutritionData.error) {
      return res.status(400).json({ error: nutritionData.error });
    }

    res.json(nutritionData);
  } catch (error) {
    console.error('Error analyzing food:', error);
    res.status(500).json({ error: 'Failed to analyze. Please try again.' });
  }
}
