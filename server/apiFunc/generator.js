import OpenAI from "openai/index.js";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function main(base64code) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "describe the person and their suroundings in the image",
            },
            {
              type: "image_url",
              image_url: {
                url: base64code,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    console.log(response.choices[0].message.content);

    const imageDescription = response.choices[0].message.content;

    await generateImage(imageDescription); // Generate an image from the description
  } catch (error) {
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
    } else {
      console.log("Error:", error.message);
    }
  }
}

async function generateImage(description) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: description,
      n: 1,
      size: "1024x1024",
    });
    const image_url = response.data[0].url;
    console.log(image_url);
  } catch (error) {
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
    } else {
      console.log("Error:", error.message);
    }
  }
}
