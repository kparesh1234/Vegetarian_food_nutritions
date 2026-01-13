import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization of Anthropic SDK singleton
let anthropic = null;

function getAnthropicClient() {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

// Allowed MIME types for images
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Input validation
function validateInput(req) {
  const { image, mimeType, foodName, amount } = req.body;
  const errors = [];

  // Must have either image or foodName
  if (!image && !foodName) {
    errors.push('No image or food name provided');
    return { valid: false, errors };
  }

  // Validate image input
  if (image) {
    // Check MIME type
    if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
      errors.push(`Invalid image type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    // Validate base64 format (basic check)
    if (!/^[A-Za-z0-9+/=]+$/.test(image)) {
      errors.push('Invalid image data format');
    }

    // Check size (base64 is ~4/3 original size, limit to ~10MB)
    if (image.length > 13 * 1024 * 1024) {
      errors.push('Image too large (max 10MB)');
    }
  }

  // Validate text inputs
  if (foodName) {
    if (typeof foodName !== 'string') {
      errors.push('Food name must be a string');
    } else if (foodName.length > 200) {
      errors.push('Food name too long (max 200 characters)');
    } else if (foodName.trim().length === 0) {
      errors.push('Food name cannot be empty');
    }
  }

  if (amount) {
    if (typeof amount !== 'string') {
      errors.push('Amount must be a string');
    } else if (amount.length > 100) {
      errors.push('Amount too long (max 100 characters)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Parse JSON from Claude's response
function parseNutritionResponse(content) {
  // Try to extract JSON from markdown code block first
  let jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);

  // If no code block, try to find raw JSON
  if (!jsonMatch) {
    jsonMatch = content.match(/(\{[\s\S]*\})/);
  }

  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  const data = JSON.parse(jsonStr);

  // Validate required fields
  if (!data.foodName) {
    throw new Error('Missing foodName in response');
  }

  if (!data.nutrition) {
    throw new Error('Missing nutrition data in response');
  }

  return data;
}

// Handle Anthropic API errors
function handleAnthropicError(error, res) {
  console.error('Anthropic API error:', {
    message: error.message,
    status: error.status,
    type: error.type,
  });

  if (error.status === 429) {
    return res.status(429).json({
      error: 'Service temporarily overloaded. Please try again in a moment.',
    });
  }

  if (error.status === 401) {
    return res.status(500).json({
      error: 'API configuration error. Please contact support.',
    });
  }

  if (error.status === 400) {
    return res.status(400).json({
      error: 'Invalid request. Please check your input.',
    });
  }

  if (error.status === 413) {
    return res.status(413).json({
      error: 'Image too large. Please use a smaller image.',
    });
  }

  return res.status(500).json({
    error: 'Failed to analyze. Please try again.',
  });
}

export async function analyzeFood(req, res) {
  try {
    // Validate input
    const validation = validateInput(req);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.errors.join('; '),
      });
    }

    const { image, mimeType, foodName, amount } = req.body;

    let messageContent;

    if (image) {
      // Image-based analysis
      messageContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType,
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
      const sanitizedFoodName = foodName.trim();
      const sanitizedAmount = amount?.trim() || '1 serving';

      messageContent = [
        {
          type: 'text',
          text: `Provide nutrition information for: "${sanitizedFoodName}" with quantity: "${sanitizedAmount}".

Please respond in the following JSON format only, with no additional text:
{
  "foodName": "${sanitizedFoodName}",
  "description": "Brief description of the dish and its typical ingredients",
  "servingSize": "${sanitizedAmount}",
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

    const response = await getAnthropicClient().messages.create({
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
      nutritionData = parseNutritionResponse(content);
    } catch (parseError) {
      console.error('Parse error:', parseError.message);
      console.error('Raw content:', content);
      return res.status(500).json({ error: 'Failed to parse nutrition data' });
    }

    // Check for error response from Claude
    if (nutritionData.error) {
      return res.status(400).json({ error: nutritionData.error });
    }

    res.json(nutritionData);
  } catch (error) {
    // Check if it's an Anthropic API error
    if (error.status) {
      return handleAnthropicError(error, res);
    }

    console.error('Error analyzing food:', error);
    res.status(500).json({ error: 'Failed to analyze. Please try again.' });
  }
}
